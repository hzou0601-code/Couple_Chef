param(
    [Parameter(Mandatory)][ValidateSet('acquire', 'renew', 'release')][string]$Action,
    [Parameter(Mandatory)][ValidatePattern('^[a-zA-Z0-9_-]+$')][string]$RunId,
    [ValidateRange(5, 240)][int]$LeaseMinutes = 120,
    [switch]$RecoverCorrupt
)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskStateDirectory = Join-Path $taskRoot '.iteration'
[System.IO.Directory]::CreateDirectory($taskStateDirectory) | Out-Null
$taskLock = Join-Path $taskStateDirectory 'active.lock'
# Serialize acquire/renew/release so an expiry check cannot race a renewal.
$taskGuard = Join-Path $taskStateDirectory 'guard'
$taskGuardStream = [System.IO.File]::Open($taskGuard, 'OpenOrCreate', 'ReadWrite', 'None')
try {
    $taskNow = [DateTimeOffset]::UtcNow
    $taskExisting = $null
    if (Test-Path -LiteralPath $taskLock) {
        try {
            $taskExisting = Get-Content -LiteralPath $taskLock -Raw | ConvertFrom-Json
            if (!$taskExisting.runId -or !$taskExisting.startedAt -or !$taskExisting.expiresAt) { throw 'Incomplete lock' }
            [DateTimeOffset]::Parse($taskExisting.expiresAt) | Out-Null
        } catch {
            # A corrupt lease has no reliable expiry. Wait the maximum possible lease.
            $taskOldEnough = (Get-Item -LiteralPath $taskLock).LastWriteTimeUtc -lt $taskNow.UtcDateTime.AddMinutes(-240)
            if ($Action -ne 'acquire' -or !$RecoverCorrupt -or !$taskOldEnough) {
                throw 'Corrupt lock: inspect Git/checkpoint; after 240 minutes acquire with -RecoverCorrupt to quarantine it'
            }
            $taskQuarantine = Join-Path $taskStateDirectory ("corrupt-" + [Guid]::NewGuid() + '.json')
            [System.IO.File]::Move($taskLock, $taskQuarantine)
            $taskExisting = $null
        }
    }
    if ($Action -eq 'acquire') {
        if ($taskExisting) {
            if ([DateTimeOffset]::Parse($taskExisting.expiresAt) -gt $taskNow) {
                throw "Active iteration: $($taskExisting.runId); expires $($taskExisting.expiresAt)"
            }
            # Caller must inspect DELIVERY checkpoint and Git before invoking recovery.
            $taskArchive = Join-Path $taskStateDirectory ("expired-" + [Guid]::NewGuid() + '.json')
            [System.IO.File]::Move($taskLock, $taskArchive)
        }
        $taskExisting = [ordered]@{
            runId = $RunId; startedAt = $taskNow.ToString('o'); expiresAt = ''
            recovery = 'After expiry inspect Git and DELIVERY checkpoint; archive stale lock; never reset changes.'
        }
    } else {
        if (!$taskExisting -or $taskExisting.runId -ne $RunId) { throw 'Lock owner mismatch' }
        if ($Action -eq 'release') {
            [System.IO.File]::Delete($taskLock)
            Write-Output "Released $RunId"
            return
        }
        if ([DateTimeOffset]::Parse($taskExisting.expiresAt) -le $taskNow) { throw 'Lease expired; inspect checkpoint then reacquire' }
    }
    # Write a full document before publishing it. A crash cannot leave a half-written lease.
    $taskTemporary = Join-Path $taskStateDirectory ([Guid]::NewGuid().ToString() + '.tmp')
    try {
        $taskExisting.expiresAt = $taskNow.AddMinutes($LeaseMinutes).ToString('o')
        $taskBytes = [Text.Encoding]::UTF8.GetBytes(($taskExisting | ConvertTo-Json))
        [System.IO.File]::WriteAllBytes($taskTemporary, $taskBytes)
        if ($Action -eq 'acquire') {
            # Move fails if a lock exists; no overwrite, equivalent to CreateNew publication.
            [System.IO.File]::Move($taskTemporary, $taskLock)
        } else {
            $taskBackup = Join-Path $taskStateDirectory ([Guid]::NewGuid().ToString() + '.previous')
            [System.IO.File]::Replace($taskTemporary, $taskLock, $taskBackup)
            [System.IO.File]::Delete($taskBackup)
        }
    } finally {
        if (Test-Path -LiteralPath $taskTemporary) { [System.IO.File]::Delete($taskTemporary) }
    }
    Write-Output "$Action $RunId; expires $($taskExisting.expiresAt)"
} finally { $taskGuardStream.Dispose() }

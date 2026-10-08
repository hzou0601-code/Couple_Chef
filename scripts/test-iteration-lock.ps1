$ErrorActionPreference = 'Stop'
$taskWorkspace = Join-Path (Split-Path $PSScriptRoot -Parent) ('.iteration/lock-test-' + [Guid]::NewGuid())
$taskScripts = Join-Path $taskWorkspace 'scripts'
[IO.Directory]::CreateDirectory($taskScripts) | Out-Null
$taskScript = Join-Path $taskScripts 'iteration-lock.ps1'
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'iteration-lock.ps1') -Destination $taskScript
$taskLockPath = Join-Path $taskWorkspace '.iteration/active.lock'
function Assert-Blocked([scriptblock]$Operation, [string]$Expected) {
    $taskCaught = $false
    try { & $Operation | Out-Null } catch {
        $taskCaught = $true
        if ($_.Exception.Message -notlike "*$Expected*") { throw }
    }
    if (!$taskCaught) { throw "Expected rejection: $Expected" }
}
& $taskScript -Action acquire -RunId owner | Out-Null
Assert-Blocked { & $taskScript -Action acquire -RunId other } 'Active iteration'
Assert-Blocked { & $taskScript -Action renew -RunId other } 'owner mismatch'
Assert-Blocked { & $taskScript -Action release -RunId other } 'owner mismatch'
& $taskScript -Action renew -RunId owner | Out-Null
$taskData = Get-Content -LiteralPath $taskLockPath -Raw | ConvertFrom-Json
if ($taskData.runId -ne 'owner') { throw 'Renewal changed owner' }
& $taskScript -Action release -RunId owner | Out-Null
if (Test-Path -LiteralPath $taskLockPath) { throw 'Release retained lock' }
& $taskScript -Action acquire -RunId old | Out-Null
$taskData = Get-Content -LiteralPath $taskLockPath -Raw | ConvertFrom-Json
$taskData.expiresAt = [DateTimeOffset]::UtcNow.AddMinutes(-1).ToString('o')
$taskData | ConvertTo-Json | Set-Content -LiteralPath $taskLockPath
& $taskScript -Action acquire -RunId recovered | Out-Null
if (!(Get-ChildItem (Split-Path $taskLockPath) -Filter 'expired-*.json')) { throw 'Missing stale lock archive' }
& $taskScript -Action release -RunId recovered | Out-Null
Set-Content -LiteralPath $taskLockPath -Value '{broken'
Assert-Blocked { & $taskScript -Action acquire -RunId recovered } 'Corrupt lock'
Assert-Blocked { & $taskScript -Action acquire -RunId recovered -RecoverCorrupt } 'Corrupt lock'
(Get-Item -LiteralPath $taskLockPath).LastWriteTimeUtc = [DateTime]::UtcNow.AddHours(-5)
& $taskScript -Action acquire -RunId recovered -RecoverCorrupt | Out-Null
if (!(Get-ChildItem (Split-Path $taskLockPath) -Filter 'corrupt-*.json')) { throw 'Missing corrupt lock quarantine' }
& $taskScript -Action release -RunId recovered | Out-Null
Write-Output 'PASS: acquire/renew/release, contention, owner checks, expired and corrupt recovery (isolated workspace)'

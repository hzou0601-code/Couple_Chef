import { createHash, randomUUID } from 'node:crypto'
import { closeSync, existsSync, fsyncSync, openSync, readFileSync, realpathSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const digest = text => createHash('sha256').update(text).digest('hex')

export function applyTypePatches(projectRoot, manifest, beforePublish) {
  const allowedPath = {
    '@tarojs/components': /^types\/[A-Za-z]+\.d\.ts$/,
    '@tarojs/taro': /^types\/api\/(network\/request|cloud\/index|device\/sms|framework\/index|open-api\/subscribe-message|wxml\/index)\.d\.ts$/,
  }[manifest.package]
  if (!allowedPath) throw new Error('Unsupported patch package')
  const packageRoot = resolve(projectRoot, 'node_modules', manifest.package)
  const realPackageRoot = realpathSync(packageRoot)
  if (!realPackageRoot.startsWith(realpathSync(projectRoot) + sep)) throw new Error('Patch package escapes project root')
  const installed = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'))
  if (installed.version !== manifest.version) throw new Error('Type patch version mismatch; review upstream before updating')
  // Validate the complete set before writing. Unknown local edits must be preserved.
  const updates = manifest.files.map(file => {
    if (!allowedPath.test(file.path)) throw new Error('Invalid declaration patch path')
    const path = resolve(packageRoot, file.path)
    if (!realpathSync(path).startsWith(realPackageRoot + sep)) throw new Error('Patch file escapes package root')
    const original = readFileSync(path, 'utf8')
    if (digest(original) === file.afterSha256) return null
    if (digest(original) !== file.beforeSha256) throw new Error(`Unknown declaration content: ${file.path}`)
    let patched = original
    for (const edit of file.edits) {
      if (!edit.before || patched.split(edit.before).length !== 2) throw new Error(`Ambiguous declaration edit: ${file.path}`)
      patched = patched.replace(edit.before, edit.after)
    }
    if (digest(patched) !== file.afterSha256) throw new Error(`Declaration patch digest mismatch: ${file.path}`)
    return { path, patched }
  })
  for (const update of updates) if (update) {
    // Publish complete bytes in the same directory; interruption cannot truncate the original.
    const temporary = update.path + `.couplechef-${randomUUID()}.tmp`
    const descriptor = openSync(temporary, 'wx')
    try {
      try { writeFileSync(descriptor, update.patched); fsyncSync(descriptor) }
      finally { closeSync(descriptor) }
      if (digest(readFileSync(temporary, 'utf8')) !== digest(update.patched)) throw new Error('Temporary patch digest mismatch')
      beforePublish?.(temporary, update.path)
      renameSync(temporary, update.path)
    } finally {
      if (existsSync(temporary)) unlinkSync(temporary)
    }
  }
  return updates.filter(Boolean).length
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  for (const name of ['components-4.1.7.json', 'taro-request-4.1.7.json', 'taro-basic-api-4.1.7.json', 'taro-subscribe-4.1.7.json', 'taro-observer-4.1.7.json']) {
    const manifest = JSON.parse(readFileSync(resolve(projectRoot, 'type-patches', name), 'utf8'))
    console.log(`Applied ${applyTypePatches(projectRoot, manifest)} ${manifest.package} declaration patches (others already applied)`)
  }
}

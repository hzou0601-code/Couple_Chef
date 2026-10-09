import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { applyTypePatches } from '../scripts/apply-type-patches.mjs'

const hash = text => createHash('sha256').update(text).digest('hex')
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'couplechef-types-'))
  t.after(() => {
    assert.equal(dirname(root), resolve(tmpdir()))
    rmSync(root, { recursive: true })
  })
  const packageRoot = join(root, 'node_modules/@tarojs/components')
  mkdirSync(join(packageRoot, 'types'), { recursive: true })
  writeFileSync(join(packageRoot, 'package.json'), JSON.stringify({ version: '4.1.7' }))
  const before = "import { StandardProps } from './common'\n"
  const after = "import { StandardProps, CommonEventFunction } from './common'\n"
  const manifest = { package: '@tarojs/components', version: '4.1.7', files: ['First', 'Second'].map(name => ({
    path: `types/${name}.d.ts`, beforeSha256: hash(before), afterSha256: hash(after), edits: [{ before, after }],
  })) }
  for (const file of manifest.files) writeFileSync(join(packageRoot, file.path), before)
  return { root, packageRoot, before, after, manifest }
}

test('known originals are repaired, idempotent and recover from partially applied patches', t => {
  const f = fixture(t)
  writeFileSync(join(f.packageRoot, f.manifest.files[0].path), f.after)
  assert.equal(applyTypePatches(f.root, f.manifest), 1)
  assert.equal(applyTypePatches(f.root, f.manifest), 0)
  for (const file of f.manifest.files) assert.equal(readFileSync(join(f.packageRoot, file.path), 'utf8'), f.after)
})
test('an unknown edit in a later file rejects before modifying any earlier file', t => {
  const f = fixture(t)
  writeFileSync(join(f.packageRoot, f.manifest.files[1].path), 'user content')
  assert.throws(() => applyTypePatches(f.root, f.manifest), /Unknown declaration content/)
  assert.equal(readFileSync(join(f.packageRoot, f.manifest.files[0].path), 'utf8'), f.before)
  assert.equal(readFileSync(join(f.packageRoot, f.manifest.files[1].path), 'utf8'), 'user content')
})
test('changed versions and package/path traversal are rejected', t => {
  const f = fixture(t)
  assert.throws(() => applyTypePatches(f.root, { ...f.manifest, package: '../elsewhere' }), /Unsupported/)
  assert.throws(() => applyTypePatches(f.root, { ...f.manifest, files: [{ ...f.manifest.files[0], path: '../outside.d.ts' }] }), /Invalid/)
  writeFileSync(join(f.packageRoot, 'package.json'), JSON.stringify({ version: '4.3.0' }))
  assert.throws(() => applyTypePatches(f.root, f.manifest), /version mismatch/)
})
test('invalid patch content or a mismatched expected result cannot cause partial writes', t => {
  for (const change of [{ edits: [{ before: 'absent', after: '' }] }, { afterSha256: 'bad' }]) {
    const f = fixture(t)
    const manifest = { ...f.manifest, files: [f.manifest.files[0], { ...f.manifest.files[1], ...change }] }
    assert.throws(() => applyTypePatches(f.root, manifest), /Ambiguous|digest mismatch/)
    assert.equal(readFileSync(join(f.packageRoot, f.manifest.files[0].path), 'utf8'), f.before)
  }
})

test('publication failure leaves complete originals and a rerun can finish', t => {
  const f = fixture(t)
  let publications = 0
  assert.throws(() => applyTypePatches(f.root, f.manifest, (temporary) => {
    assert.equal(readFileSync(temporary, 'utf8'), f.after)
    if (++publications === 2) throw new Error('simulated interruption')
  }), /simulated interruption/)
  assert.equal(readFileSync(join(f.packageRoot, f.manifest.files[0].path), 'utf8'), f.after)
  assert.equal(readFileSync(join(f.packageRoot, f.manifest.files[1].path), 'utf8'), f.before)
  assert.equal(readdirSync(join(f.packageRoot, 'types')).some(name => name.endsWith('.tmp')), false)
  assert.equal(applyTypePatches(f.root, f.manifest), 1)
})

test('a declaration directory link cannot redirect patches outside the package', t => {
  const f = fixture(t)
  const outside = join(f.root, 'outside-package')
  mkdirSync(outside)
  for (const file of f.manifest.files) writeFileSync(join(outside, file.path.split('/').at(-1)), f.before)
  const types = join(f.packageRoot, 'types')
  assert.equal(dirname(types), f.packageRoot)
  rmSync(types, { recursive: true })
  symlinkSync(outside, types, process.platform === 'win32' ? 'junction' : 'dir')
  assert.throws(() => applyTypePatches(f.root, f.manifest), /escapes package root/)
  assert.equal(readFileSync(join(outside, 'First.d.ts'), 'utf8'), f.before)
})

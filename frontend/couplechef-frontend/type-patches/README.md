# Taro declaration compatibility

`components-4.1.7.json` repairs 16 official MIT declaration files without changing JavaScript, payload types or compiler checks:

- Import the existing `CommonEventFunction` definition where it is referenced but missing.
- Declare two ambient namespaces.
- Remove a second identical `placeholderStyle?: string` field, retaining the original field.

Source: [official package](https://registry.npmjs.org/@tarojs/components/4.1.7). Upstream stable 4.1.11 and 4.3.0 were inspected and still contain these defects; this is not a claim that either release was fully installed or built. Download integrity evidence is in `docs/iterations/evidence/20261009-type-gate-05/` at repository root.

Yarn's `postinstall` applies the version-pinned, before/after-SHA256 patches. All targets are checked before writing; unknown edits, versions or paths escaping the package fail without overwriting them. Complete bytes are flushed to a unique file in the same directory before rename publishes them. Already-applied files are accepted, so an interrupted run can be resumed without truncating originals. An abrupt process termination may leave an unused temporary file, which does not affect reapplication. Run `node scripts/apply-type-patches.mjs` after an install that deliberately omitted lifecycle scripts. Do not delete validation to make an upgrade succeed: compare the new official files, re-evaluate each fix and update or remove the manifest with review.

Full `yarn typecheck` remains required and currently fails in other Taro/API/optional-platform/webpack declarations. This patch does not imply T002BV or T002B acceptance. No `any` replacement, diagnostic allowlist, source exclusion or global `skipLibCheck` was added.

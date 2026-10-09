# Taro declaration compatibility

`components-4.1.7.json` repairs 16 official MIT declaration files without changing JavaScript, payload types or compiler checks:

- Import the existing `CommonEventFunction` definition where it is referenced but missing.
- Declare two ambient namespaces.
- Remove a second identical `placeholderStyle?: string` field, retaining the original field.

Source: [official package](https://registry.npmjs.org/@tarojs/components/4.1.7). Upstream stable 4.1.11 and 4.3.0 were inspected and still contain these defects; this is not a claim that either release was fully installed or built. Download integrity evidence is in `docs/iterations/evidence/20261009-type-gate-05/` at repository root.

Yarn's `postinstall` applies the version-pinned, before/after-SHA256 patches. All targets are checked before writing; unknown edits, versions or paths escaping the package fail without overwriting them. Complete bytes are flushed to a unique file in the same directory before rename publishes them. Already-applied files are accepted, so an interrupted run can be resumed without truncating originals. An abrupt process termination may leave an unused temporary file, which does not affect reapplication. Run `node scripts/apply-type-patches.mjs` after an install that deliberately omitted lifecycle scripts. Do not delete validation to make an upgrade succeed: compare the new official files, re-evaluate each fix and update or remove the manifest with review.

Full `yarn typecheck` remains required and currently fails in other Taro/API/optional-platform/webpack declarations. This patch does not imply T002BV or T002B acceptance. No `any` replacement, diagnostic allowlist, source exclusion or global `skipLibCheck` was added.

## Request / cloud generics (T002BV-A1)

taro-request-4.1.7.json pins two official MIT declarations from https://registry.npmjs.org/@tarojs/taro/4.1.7 (same locked version). It propagates existing request-body string / IAnyObject / ArrayBuffer constraints to request and both callContainer overloads. Response wrappers retain their data generic without the incorrect body constraint, matching the existing unconstrained public response generic (including unknown and scalar JSON). No response is cast or replaced with any; unknown still requires validation before field access. Existing defaults remain unchanged; no runtime JS or dependencies change. The applicator only permits the two nested API paths for this package, retaining version/content/realpath checks and atomic publication.

yarn typecheck:request-contracts checks actual public types, valid object/string/buffer payloads, abort and typed responses, and expected rejection of numeric/boolean payloads and incompatible response fields. Its skipLibCheck is scoped to consumer contracts because other vendor declarations remain broken; the full project check is separately run without ignoring diagnostics. RequestParams and remaining API errors belong to T002BV-A2; platform/webpack errors remain T002BV-X.

## Basic API declarations (T002BV-A2a)

taro-basic-api-4.1.7.json repairs the official locked package's SMS CallbackResul typo using the existing CallbackResult and propagates getApp.Instance's App constraint to getApp. Original files match the archived official 4.1.7 package; version/before/after-SHA and exact path guards apply. Public contract tests check typed SMS results, string phone numbers and typed app fields, and reject numeric app instances. No runtime JS or dependency changes. Other API declarations and the full type gate remain pending.

## Missing interceptor RequestParams (T002BV-A2b)

The local types/taro-request-params.d.ts augmentation fills the missing symbol without another vendor-file transition. It follows locked @tarojs/api 4.1.7 interceptor source: initial options may be empty and data is unknown. Partial request.Option<T> preserves concrete public fields and callbacks; only data is overridden to unknown, requiring validation. Generic Chain.proceed forwards explicitly typed response callbacks while the default chain continues to read unknown data; its return type retains the original interceptor contract. Both scoped contract/inventory projects explicitly load the augmentation; the full project already includes types. Upgrades must re-evaluate or remove this augmentation if upstream adds the symbol. Runtime JS and request signatures are unchanged.

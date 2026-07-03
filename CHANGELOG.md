# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2026-07-03

### Changed

- **Narrow `PixelProps` to remove the non-functional `format` prop.** `PixelProps` inherited `format?: PixelFormat` from `SrcGeneratorOptions`, but `Pixel` never read it — the component's only functional format input is `mimeType`. Passing `format` to `<Pixel>` did nothing except spread an invalid `format="…"` attribute onto the rendered `<img>` (React renders any unrecognized lowercase prop verbatim as a DOM attribute). `PixelProps` is now `Omit<SrcGeneratorOptions, "format"> & …`; `format` remains on `SrcGeneratorOptions`, which the exported `buildPixelUrl`/`buildPixelSources` helpers still legitimately consume. **Behavior change (SemVer-honesty note):** a TypeScript consumer who was passing `format` to `<Pixel>` will now get a compile error — this surfaces a latent bug (the prop never worked) rather than changing any runtime behavior that previously worked. Use `mimeType` instead, the one functional format prop. (`src/types.ts`)
- **Replace the `JSX` named-import return type with `ReactElement`.** The component's memo callback and `renderImage` were typed via `import type { JSX } from "react"` / `JSX.Element`, which requires the module-scoped `namespace JSX` that only exists in `@types/react` 18.2.6+ and all 19.x — it is absent from `@types/react` 18.0.x and 18.2.0–18.2.5. `ReactElement` is a named export of `react` in every `@types/react` version from 16 through 19 (and `JSX.Element` is itself defined as `interface Element extends React.ReactElement<any, any> {}`), making it a structurally identical, strictly more portable replacement that actually matches the package's advertised `react >=18.0.0` peer range. Types-only — no runtime render path changed. (`src/components/Pixel.tsx`)

### Fixed

- **Stop the `format` prop from leaking onto the rendered `<img>`.** Even with `format` removed from the public `PixelProps` type, an untyped caller (plain JS, or a spread of loosely-typed props) could still pass `format` through to the DOM. The component now destructures `format` out before spreading the remaining props onto `<img>`, so it never reaches the DOM regardless of how it arrives. (`src/components/Pixel.tsx`)

## [1.2.1] - 2026-07-03

### Fixed

- **Multi-source `<picture>` no longer double-applies `className`/`style`.** The multi-source render branch (taken whenever more than one format source is generated — the common case, since `avif`/`webp` default to `true`) applied the caller's `className` and `style` (including `background`-mode's absolute-fill positioning and the loading 1px placeholder) to BOTH the `<picture>` wrapper and its inner `<img>`, so borders/margins/backgrounds were rendered twice, once on each box. `<picture>` is now a transparent, boxless wrapper (`style={{ display: "contents" }}`, no `className`); the inner `<img>` remains the sole styled element, matching how the single-source/`direct` branch already renders its one `<img>`. Because `display: contents` establishes no containing block, `background`-mode absolute positioning and the loading placeholder still resolve to the identical geometry as before (they now come from the true parent directly instead of through the previously redundant, exactly-coincident intermediate `<picture>` box). The only user-visible change is that a caller-supplied decorative `style`/`className` (a border, margin, or background color) now renders once instead of twice. (`src/components/Pixel.tsx`, `src/types.ts`)

## [1.2.0] - 2026-07-02

### Added

- **Named `Pixel` export for CJS/tooling ergonomics.** `Pixel` was previously reachable only as the default export — the sole symbol in the package not also available as a named import, unlike `Skeleton`, `buildPixelUrl`, `buildPixelSources`, and `getMimeType`. Added `export { default as Pixel } from "./components/Pixel"` alongside the unchanged `export default Pixel`, so `import { Pixel } from "pixel-serve-client"` and `const { Pixel } = require("pixel-serve-client")` now work the same way the other named exports already do. Purely additive: the default export, `package.json#exports` map, and every existing import path are unchanged. Verified the ESM default import, `require(...).default`, and the new `require(...).Pixel` all resolve to the identical component reference. (`src/index.ts`, `src/index.test.ts`)

### Fixed

- **Caller-supplied `onError` no longer clobbers the internal fallback handler.** Previously `{...props}` was spread after the internal `onError={handleImgError}` on both the standalone `<img>` and the `<picture>` inner `<img>`, so a caller-supplied `onError` silently replaced the internal handler and voided the graceful-fallback guarantee (a failed image would just stay broken if the caller passed its own `onError`). `onError` (renamed `userOnError`) and `loading` are now destructured out of `props` before the spread, and a composed handler (`handleImgError()` then `userOnError?.(event)`) is rendered on both `<img>` elements — the bundled-placeholder fallback always runs first, and the caller's handler still fires with the same event. `loading` keeps its existing override behavior (pass it explicitly to beat the `lazy`-derived default). (`src/components/Pixel.tsx`)
- **`buildPixelSources` no longer emits a duplicate `<source>` when `mimeType` matches an enabled format flag.** Requesting `mimeType: "webp"` (or `"avif"`) with the matching `webp`/`avif` flag left enabled (the default) produced two sources with the same `type`/`src` — the flag-driven push and the primary push both resolved to the same format. React then warned about duplicate keys (`key={source.type}`) and rendered a redundant `<source>` in the DOM. The flag-driven push is now skipped when it would duplicate the primary format (`avif && mimeType !== "avif"`, `webp && mimeType !== "webp"`); the primary push already covers that format. (`src/functions.ts`)
- **Eliminated the Rollup `MIXED_EXPORTS` build warning without changing the export shape.** Because the package deliberately exposes both a default export (`Pixel`) and named exports (`Pixel`, `Skeleton`, `buildPixelUrl`, `buildPixelSources`, `getMimeType`), the optional Rollup treeshake pass that tsup runs when `treeshake: true` printed a "using named and default exports together" warning on the CJS entry on every build. tsup 8.5.1 offers no way to scope that single warning away — its only lever is the global `silent` flag, which would also hide genuine warnings — and `output.exports: "named"` would be a consumer-facing change. `treeshake` is now left at its default (off): esbuild already tree-shakes and the output is still minified, so the emitted bundle is functionally equivalent (verified `require(...).default === require(...).Pixel`, `__esModule: true`, every named export present, and `attw` all green) while the build is now genuinely warning-free. (`tsup.config.ts`)

### Tests

- **Closed the remaining `Pixel`/`Skeleton` branch-coverage gaps.** Added four `Pixel` cases: the `<picture>` element now asserted to collapse down to a single bundled-placeholder `<img>` after a DOM-level `onError` on the nested `<img>` (rather than only checking the resulting fallback `src`, as prior tests did); a partial-preload-failure scenario where only the AVIF candidate's preload rejects, asserting the rendered `<picture>` keeps the WebP and JPEG sources and drops AVIF; `eagerLoad` combined with `fallbackSrc` (the immediate, non-awaited source generation on mount honors the override); and `eagerLoad` combined with a non-JPEG `mimeType` (the source-dedupe logic added for the duplicate-`<source>` fix above still holds under the eager path, with no duplicate-key `console.error`). Added one `Skeleton` case covering the `ensureStyles()` `typeof document === "undefined"` early-return guard: mounted via a pre-built container element — React resolves the owner document for new host nodes from `container.ownerDocument` rather than re-reading the bare `document` global, so the mount still succeeds — with the global `document` binding temporarily replaced via `vi.stubGlobal`/`vi.unstubAllGlobals` around the `render()` call, exercising the guard's early return with no change to `Skeleton.tsx`. Package-wide coverage moved from 99.15%/94.57%/100%/100% to 100%/95.18%/100%/100% (statements/branches/functions/lines); `Skeleton.tsx` is now 100% on all four metrics. Test-only — no behavior changes. (`src/components/Pixel.test.tsx`, `src/components/Skeleton.test.tsx`)

## [1.1.9] - 2026-05-12

### Security

- **Plug incomplete-sanitization in CHANGELOG section regex.** CodeQL `js/incomplete-sanitization` (alert #1) flagged `pkg.version.replace(/\./g, "\\.")` in `scripts/release-tag.mjs` because it escapes `.` but not the backslash itself — a future pre-release tag could in principle smuggle a partial escape past us. Switched to a full regex-metachar escape `/[\\^$.*+?()[\]{}|]/g, "\\$&"`. (Mirrors the same fix shipped in `pixel-serve-server` v2.8.7 since the script is part of a shared scaffold.) (`scripts/release-tag.mjs`)

### Added

- **Origin-remote sanity check in `release-tag.mjs`.** Verifies `package.json#name` matches the second segment of the `origin` remote slug before creating the tag, so an accidental `release:tag` invocation from the wrong working directory cannot push a mis-versioned tag to the wrong repo. (`scripts/release-tag.mjs`)

### Documentation

- **Remove libraries.io "Dependencies" badge.** Removed `[![Dependencies](https://img.shields.io/librariesio/release/npm/pixel-serve-client)](https://libraries.io/npm/pixel-serve-client)` from the README so the status row only shows badges this project directly controls or that reflect first-party CI signal (CI, CodeQL, Codecov, npm provenance). (`README.md`)

## [1.1.8] - 2026-05-12

### Documentation

- **Replace broken npm-provenance shield with a static "built & signed" badge.** The v1.1.7-era badge URL `https://img.shields.io/npm/sigstore/pixel-serve-client?label=provenance` rendered as `404 badge not found` because shields.io has no `/npm/sigstore/` endpoint (verified by probing `/npm/provenance`, `/npm/has-provenance`, `/sigstore/npm`, `/npm/attestation`, `/npm/sig` — all return the same 404). Swapped in a static `img.shields.io/badge/npm%20provenance-built%20%26%20signed-success?logo=npm&logoColor=white` shield that links through to `npmjs.com/package/pixel-serve-client`, where the real "Built and signed on GitHub Actions" attestation UI lives. (`README.md`)

### Notes

- Patch bump (`1.1.7` → `1.1.8`): docs-only — no public API changes (`Pixel`, `buildPixelUrl`, `buildPixelSources`, `getMimeType`, `Skeleton` ship unchanged). Re-publishing pushes the corrected README to the npm package page so `https://www.npmjs.com/package/pixel-serve-client` no longer renders the broken badge.

## [1.1.7] - 2026-05-12

### Added

- **GitHub Actions CI matrix.** New `.github/workflows/ci.yml` runs on push to `main` and on every PR across Node 20.x / 22.x / 24.x. Each leg builds, runs `attw --pack` for export-shape validation, type-checks, lints, format-checks, and runs the full Vitest + jsdom suite with coverage. The Node 22.x leg uploads `coverage/lcov.info` to Codecov (`Hiprax/pixel-serve-client`). Concurrency group `ci-${workflow}-${ref}` cancels superseded pushes; `permissions: contents: read` enforces least-privilege; runners cap at 15 minutes; `actions/checkout@v6` runs with `persist-credentials: false`. (`.github/workflows/ci.yml`)
- **Tag-triggered release workflow.** New `.github/workflows/release.yml` runs on push of any `v*.*.*` tag (and via `workflow_dispatch` with an optional tag input). Re-runs all quality gates, verifies the tag version matches `package.json#version` (refusing to publish on mismatch), runs `npm pack --dry-run`, then `npm publish --provenance --access public` using `secrets.NPM_TOKEN` and OIDC (`id-token: write`). On success it extracts the `## [VERSION]` block from `CHANGELOG.md` and creates a GitHub Release. (`.github/workflows/release.yml`)
- **CodeQL static analysis.** New `.github/workflows/codeql.yml` runs on push, PR, and weekly cron (`0 6 * * 1`) using `github/codeql-action@v4` with the `security-and-quality` query suite over `javascript-typescript`. Capped at 30 minutes with only `security-events: write` + read scopes. (`.github/workflows/codeql.yml`)
- **Dual-build types fix surfaced by attw.** Switched `exports[".".import|require]` to the nested-types shape (`types` + `default` under each condition, `.d.mts` for ESM) so resolvers under `node16`/`nodenext` no longer report "🎭 Masquerading as CJS". `attw --pack .` is now green across `node10`, `node16` (CJS), `node16` (ESM), and `bundler`. Legacy `main`/`module`/`types` keys retained for older resolvers. (`package.json`)
- **Cross-platform release scripts.** Six zero-dependency Node scripts under `scripts/`: `_lib.mjs`, `verify.mjs` (sequential build → attw → type-check → lint → format → test runner with PASS/FAIL summary), `new-branch.mjs`, `sync-main.mjs`, `release-prepare.mjs` (pre-flight + version bump + CHANGELOG `[Unreleased]` → `[X.Y.Z]` promotion + release branch push), `release-tag.mjs` (annotated tag + push that triggers the release workflow). Wired as `npm run verify | branch | sync | release:prepare | release:tag`. (`scripts/*`, `package.json#scripts`)
- **Issue / PR / contact templates.** `.github/PULL_REQUEST_TEMPLATE.md` with the standard checklist plus a manual `<picture>`/fallback-path verification box, `.github/ISSUE_TEMPLATE/bug_report.yml` (package + React + Node versions, rendering environment dropdown spanning Vite / Next.js / Remix / Astro / SSR, Pixel JSX, expected/actual), `.github/ISSUE_TEMPLATE/feature_request.yml`, and `.github/ISSUE_TEMPLATE/config.yml` routing security reports to GitHub Security Advisories. (`.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/*`)
- **`@arethetypeswrong/cli` dev dependency.** Pinned at `^0.18.2` and wired as `npm run check-types-pack` (`attw --pack .`). Surfaced and helped fix the masquerading-as-CJS export-shape issue. (`package.json#devDependencies`, `package.json#scripts`)
- **README badges.** Added five new status badges: CI (`actions/workflows/ci.yml/badge.svg`), CodeQL (`actions/workflows/codeql.yml/badge.svg`), Codecov (`codecov.io/gh/.../branch/main/graph/badge.svg`), Dependencies (`shields.io/librariesio/release/npm/...` — flags outdated runtime/dev deps via the libraries.io index), and npm provenance (`shields.io/npm/sigstore/...?label=provenance` — surfaces the sigstore signature attached by `npm publish --provenance` on the latest published version). Bumped the stale `TypeScript-5.9.3` shield to `TypeScript-6.0.3`, and broadened the React shield to `React-18 | 19` to match the actual peer-dependency range. (`README.md`)
- **CHANGELOG `[Unreleased]` section.** Added the Keep a Changelog header and a placeholder `## [Unreleased]` heading so `release:prepare` has a target to promote on the next bump. (`CHANGELOG.md`)

### Notes

- Patch bump (`1.1.6` → `1.1.7`): tooling-only — no public API changes (`Pixel`, `buildPixelUrl`, `buildPixelSources`, `getMimeType`, `Skeleton` ship unchanged). React stays the sole peer dependency. The `exports` map keeps the same conditional resolution for both ESM and CJS consumers; the change is the nested `types`/`default` shape, which is additive in terms of resolver behavior. All `npm run build`, `npm test`, `npm run lint`, `npm run format`, `npm run type-check`, and `npm run check-types-pack` pass with 95/95 tests and 100% line coverage.

## [1.1.6] - 2026-05-12

### Dependencies

- **TypeScript 5.9.3 → 6.0.3.** Major bump. The project's existing `tsconfig.json` already pins every option that TypeScript 6 changed defaults for (`strict: true`, `module: ESNext`, `target: ES2022`, `moduleResolution: Bundler`, explicit `types: [...]`, `jsx: react-jsx`), so no source changes were required. Added `ignoreDeprecations: "6.0"` to `tsconfig.json` to silence the `baseUrl` deprecation surfaced by `tsup`/`rollup-plugin-dts` for declaration emission. (`tsconfig.json`, `package.json`)
- **ESLint 9.39.1 → 10.3.0.** Major bump. Added `@eslint/js@^10.0.1` as an explicit dev dependency — it was previously transitively available and is now required as a direct dep. Renamed `eslint.config.js` → `eslint.config.mjs` to satisfy ESLint 10's stricter module-type detection (the package ships dual ESM/CJS so we can't set `"type": "module"` in `package.json`). The three new default rules (`no-unassigned-vars`, `no-useless-assignment`, `preserve-caught-error`) and the new JSX reference tracking did not surface any violations in the existing codebase. (`eslint.config.mjs`, `package.json`)
- **jsdom 27.2.0 → 29.1.1.** Two major bumps. v28 overhauled the resource-loading customization API (not used by this package's tests). v29 replaced the legacy CSSOM dependencies with fresh internal implementations. All 95 component / helper / Skeleton tests continue to pass against the new jsdom. (`package.json`)
- **`typescript-eslint` 8.56 → 8.59.3** (matched on `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser`). No source changes required. (`package.json`)
- **Vitest 4.0.15 → 4.1.6** (matched on `@vitest/coverage-v8`). No source changes required; all 95 tests still pass with 100% line coverage. (`package.json`)
- **Prettier 3.7.4 → 3.8.3.** Added `.prettierrc.json` pinning `endOfLine: "auto"` so the repo accepts both CRLF (Windows checkout default) and LF. Ran `prettier --write` to apply the v3.0+ `trailingComma: "all"` default to incidental sites in the component / test files. No behavior changes. (`.prettierrc.json`, `src/components/Pixel.tsx`, `src/components/Pixel.test.tsx`, `src/components/Skeleton.test.tsx`)
- **Smaller bumps:** `@testing-library/react` 16.3.0 → 16.3.2, `@types/react` 19.2.7 → 19.2.14, `@types/node` 24.10.1 → 25.7.0. (`package.json`)

### Notes

- Patch bump (`1.1.5` → `1.1.6`): dev-dependency-only update. No public API changes — `Pixel`, `buildPixelUrl`, `buildPixelSources`, `getMimeType`, and `Skeleton` ship unchanged. React stays the sole peer dependency. All `npm run build`, `npm test`, `npm run lint`, `npm run format`, and `npm run type-check` pass with 95/95 tests and 100% line coverage.

## [1.1.5] - 2026-05-12

### Security / Dependencies

- **`npm audit fix` applied (Task 13).** Resolved 8 dev-time advisories (3 moderate, 5 high) flagged by transitive dependencies of the lint/test toolchain. Fixed: `picomatch` (high — POSIX class injection and ReDoS via extglob quantifiers, GHSA-3v7f-55p6-f55p, GHSA-c2c7-rcm5-vvqj), `postcss` (moderate — XSS via unescaped `</style>` in stringify output, GHSA-qx2v-qp2m-jg93), `rollup` (high — arbitrary file write via path traversal, GHSA-mw96-cpmx-2vgc), `vite` (high — three advisories: path traversal in optimized deps `.map` handling, `server.fs.deny` bypass via queries, arbitrary file read via dev-server websocket; GHSA-4w7w-66w2-5vf9, GHSA-v2wj-q39q-566r, GHSA-p9ff-h696-f583), `flatted` (high — unbounded recursion DoS and prototype pollution in `parse()`, GHSA-25h7-pfq9-p65f, GHSA-rf6f-7fwh-wjgh), `minimatch` (high — multiple ReDoS via repeated wildcards / non-adjacent GLOBSTAR / nested extglobs, GHSA-3ppc-4f35-3m26, GHSA-7r86-cg39-jmmj, GHSA-23c5-xmqv-rm74), `brace-expansion` (moderate — zero-step sequence DoS, GHSA-f886-m6hf-6m8v), and `ajv` (moderate — ReDoS with `$data` option, GHSA-2g4f-4pwh-qvx6). All are transitive dev deps reachable via `vite`/`eslint`/`vitest`; no production runtime exposure. (`package-lock.json`)

### Notes

- Patch bump (`1.1.4` → `1.1.5`): dependency-only update via `npm audit fix` (no `--force`). Final `npm audit` reports 0 vulnerabilities. All `npm run build`, `npm test`, `npm run lint`, and `npm run type-check` pass.

## [1.1.4] - 2026-05-12

### Documentation

- **`SECURITY.md` added (Task 10).** New disclosure-policy document covering: supported versions (`1.x` active, `<1.0` unsupported), reporting channels (GitHub Security Advisories preferred, private email fallback), response targets, the 90-day coordinated-disclosure embargo policy, and detailed in-scope / out-of-scope vulnerability classes. DOM injection / XSS, URL injection in `buildPixelUrl`, Skeleton CSS injection, SSR hydration leaks, and prototype pollution are explicitly in scope. React/dev-dependency vulnerabilities and `direct`/`fallbackSrc` misuse are explicitly out of scope. The document defers server-side concerns (SSRF, path traversal, decompression bombs) to `pixel-serve-server/SECURITY.md`. (`SECURITY.md`)
- **`CONTRIBUTING.md` added (Task 10).** New contributor guide covering project layout, prerequisites (Node 20+ for the build/test toolchain), the daily development loop, the pre-submit checklist, the coverage thresholds (95% lines/functions/statements, 90% branches), code-style requirements (TypeScript strict, ESLint+Prettier, no new runtime deps — React stays the sole peer dep, SSR safety, `React.memo` on `Pixel` is intentional, bundled images stay data-URL-encoded), commit message style, a PR checklist, the maintainer-only release procedure, and a note that the project does **not** currently require DCO sign-off. (`CONTRIBUTING.md`)
- **README — `eagerLoad` "When to use" section expanded (Task 15).** The existing "Eager Load (skip preload chain)" subsection now ends with a `When to use eagerLoad` callout that spells out the three load-bearing facts: the tradeoff (skips the per-format preload detection chain), the use case (zero skeleton flash for known-good URLs like CDN-served images, hero banners, and dashboards), and the caveat (`<picture>`/`<source>` still negotiates browser-level fallback, but the **client-side smart fallback chain** that detects "all candidates failed and renders the bundled placeholder" is not engaged — the bundled placeholder fires only on the final `<img>` `onError`). The props-table row was previously brief; this section is the canonical reference. (`README.md`)
- **README — `Security` and `Contributing` sections updated** to point at the new `SECURITY.md` and `CONTRIBUTING.md` files. The existing GitHub-issues link in `Contributing` was preserved; `Security` explicitly warns against opening public issues for security reports. (`README.md`)

### Engineering

- **`package.json#files` includes `SECURITY.md` (Task 10).** The npm publish whitelist now ships the disclosure policy alongside `dist/`. `CONTRIBUTING.md` remains repository-only — it is a workflow document, not a consumer-facing API reference. (`package.json`)

### Notes

- Patch bump (`1.1.3` → `1.1.4`): documentation-only changes. No runtime API changes. All `npm run build`, `npm test`, `npm run lint`, and `npm run type-check` pass.

## [1.1.3] - 2026-05-12

### Engineering

- **Node engine pinned to `>=20` (Task 12).** `package.json#engines.node` updated from `>=18` to `>=20`. Node 18 reached end-of-life on 2025-04-30, and the build/test toolchain (Vite 7, Vitest 4) already requires Node 20+. README `Installation` section now spells out the Node 20 minimum for build/test tooling and clarifies that the bundled component itself runs in any browser supporting `<picture>` and the listed image formats. (`package.json`, `README.md`)

### Notes

- Patch bump (`1.1.2` → `1.1.3`): documentation and tooling-pin changes only. No runtime API changes. All `npm run build`, `npm test`, `npm run lint`, and `npm run type-check` pass.

## [1.1.2] - 2026-05-12

### Documentation

- **`eagerLoad` usage example added (Task 26).** The Examples section now includes a dedicated "Eager Load (skip preload chain)" sub-section that explains the tradeoff (no per-format success detection — only the final `<img>` failure triggers the bundled placeholder fallback) and shows a runnable JSX snippet. The prop was already listed in the props table; this addition closes the docs gap so consumers can find the behavior without grepping the table for the flag. (`README.md`)

### Notes

- Patch bump (`1.1.1` → `1.1.2`): documentation-only changes. No runtime API changes.

## [1.1.1] - 2026-05-12

### Tests

- **Rewrote the flaky "cleans up on unmount" test (Task 12).** The previous version spied on `console.error` for the React 17-era "state-update-after-unmount" warning that React 18+ removed entirely, so the assertion always passed regardless of behavior. The replacement test under the name `cancels in-flight preload after unmount so no state update is attempted` swaps in a controlled mock `Image` whose `onload` is fired MANUALLY after the component has been unmounted, then drains the microtask queue and asserts that no React warnings or thrown errors leak into the test harness. This actually exercises the per-effect-run `cancelled` flag introduced in 1.1.0. (`src/components/Pixel.test.tsx`)
- **Added three new behavioral tests under `Pixel resilience (Task 14)`:** rapid src changes across four back-to-back rerenders (asserts only the final src wins, no stale earlier src appears in the DOM — guards the StrictMode cancel semantics under pressure), an SSR-like scenario where `new Image()` throws synchronously (the preload Promise executor catches the throw, `Promise.allSettled` reports a rejection per source, and the all-failed branch renders the bundled fallback `<img>`), and explicit `width=0` / `height=0` props (documents the chosen behavior: zero is a valid dimension, the inline style emits `0px` and the HTML `width="0"`/`height="0"` attributes are forwarded verbatim). (`src/components/Pixel.test.tsx`)

### Changed

- **Coverage threshold raised (Task 31).** `vitest.config.ts` `branches` threshold lifted from `85` to `90` after the Task 14 additions pushed actual aggregate branch coverage to 93.67%. Lines / functions / statements thresholds unchanged at 95. (`vitest.config.ts`)

### Notes

- Patch bump (`1.1.0` → `1.1.1`): test-only changes plus the coverage-threshold tightening. No runtime API changes. All `npm run build`, `npm test`, `npm run lint`, and `npm run type-check` pass.

## [1.1.0] - 2026-05-12

### Added

- **`eagerLoad` prop on `Pixel`.** New optional `boolean` (default `false`) that bypasses the per-format preload chain entirely. When enabled, the component renders `<picture>` directly using the constructed sources and relies on the browser plus the native `onError` handler for fallbacks. Tradeoff: per-format success detection is unavailable in this mode. (`src/components/Pixel.tsx`, `src/types.ts`)
- **`width` and `height` HTML attributes on `<img>`.** Numeric `width`/`height` props are now reflected as HTML attributes on the rendered `<img>` whenever they are defined, giving browsers a stable aspect-ratio hint that reserves layout space and reduces Cumulative Layout Shift (CLS). (`src/components/Pixel.tsx`)
- **`crossOrigin` and `referrerPolicy` propagation to the preload `Image` instance.** Both attributes are now set on the `new Image()` used during preload before the `src` assignment, matching the attributes applied to the visible `<img>`. Eliminates the double-fetch problem on CORS-restricted hosts. (`src/components/Pixel.tsx`)
- **JSDoc on `PixelProps.style`.** Documented the precedence rules — caller-supplied `style` wins over the prop-derived `width`/`height` styles, but `background` mode still overrides everything. (`src/types.ts`)

### Fixed

- **StrictMode mount/unmount race in `Pixel`.** Replaced the long-lived `useRef` mount flag with a local `cancelled` flag scoped per effect run. Under React StrictMode (double-invoked effects) and rapid `src` changes, the previous implementation could let a stale `Promise.allSettled` resolution win and flash an out-of-date image — the cancellation flag now closes the window. The `mounted` ref has been removed. (`src/components/Pixel.tsx`)
- **Skeleton flash for cached images.** `preload` now checks `img.complete && img.naturalWidth > 0` after assigning `src` and resolves synchronously when the browser already holds the image in memory cache, eliminating the one-frame skeleton flash. (`src/components/Pixel.tsx`)
- **Width/height style logic edge case.** Changed the dimensions branch from `(width || height)` to `(width !== undefined || height !== undefined)` so explicit `0` values no longer collapse to the no-dimensions branch. Caller-supplied `style` is also now spread last in both branches so its keys consistently win — except in `background` mode, which intentionally overrides. (`src/components/Pixel.tsx`)
- **`useEffect` dependency hygiene.** After the StrictMode race fix, the preload effect now lists only `[desiredSources]` as its dependency — the memoized array reference already encodes every input that affects preloading. Redundant `type`, `avif`, `webp`, and `mimeType` entries (which previously caused extra re-runs) have been removed. (`src/components/Pixel.tsx`)

### Tests

- Added six new test cases in `src/components/Pixel.test.tsx`:
  - StrictMode rapid src change asserts only the final src wins (no flicker, no stale state).
  - Cached image (`img.complete=true`) returns synchronously from preload with no skeleton frame.
  - Caller `style.width` precedence over `width` prop, plus a no-dimensions style passthrough check.
  - Numeric HTML `width`/`height` attributes appear on `<img>` when props are set, and are omitted otherwise.
  - `crossOrigin` / `referrerPolicy` are applied to the preload `Image` instance before `src` is assigned.
  - `eagerLoad` mode renders `<picture>` immediately and never runs the preload chain (verified with a hostile Image mock).

## [1.0.4] - 2026-05-12

### Added

- **`type-check` npm script.** Added `"type-check": "tsc --noEmit"` so the documented pre-completion checklist can be honored. `tsup` strips types with esbuild and does not type-check; this script wires the existing `tsconfig.json` (`noEmit: true`) into a first-class verification step. (`package.json`)

### Documentation

- Confirmed the client's `PixelFormat` already excludes `svg`, so the companion `pixel-serve-server` 2.0.0 SVG-output removal requires no client API change. README and project docs aligned to state that SVG is not a supported output format anywhere in the pipeline. (`README.md`)

## [1.0.3] - 2026-02-22

### Fixed

- **Added `onError` handler to `<img>` elements** — The Pixel component now gracefully falls back to bundled placeholder images when a rendered image fails to load at the DOM level, preventing broken image icons from appearing. (`src/components/Pixel.tsx`)
- **Added explicit return type to `renderImage`** — Added `JSX.Element | null` return type annotation to satisfy the `explicit-function-return-type` ESLint rule. (`src/components/Pixel.tsx`)
- **Removed unused `getMimeType` import** — Removed unused import from Pixel component. (`src/components/Pixel.tsx`)
- **Removed unused `mimeType` parameter from `getFallbackSources`** — The parameter was declared but never used inside the function. (`src/components/Pixel.tsx`)
- **Lint errors** — Fixed all pre-existing lint errors revealed after adding `typescript-eslint` dependency: added explicit return types to `preload`, `run`, `buildParams`, and `waitForLoad` functions, removed unused `cleanup` import, replaced `any` type in test. (`src/components/Pixel.tsx`, `src/components/Pixel.test.tsx`, `src/components/Skeleton.test.tsx`, `src/functions.ts`, `src/functions.test.ts`)

### Added

- **Missing `typescript-eslint` dependency** — Added the `typescript-eslint` package to devDependencies, fixing `npm run lint` which previously failed due to the missing import. (`package.json`)
- **New tests** — Added tests for `onError` handler behavior with normal and avatar image types, verifying fallback to bundled placeholder images on DOM-level image load failure. (`src/components/Pixel.test.tsx`)

## [1.0.2] - 2026-02-22

### Fixed

- **Fixed useless unmount test** — Replaced `expect(true).toBe(true)` with proper `console.error` spy to verify no React state-update-after-unmount warnings occur. (`src/components/Pixel.test.tsx`)
- **Strengthened skeleton inset assertion** — Changed array-based `toContain` to regex `toMatch` for cross-environment CSS value normalization. (`src/components/Skeleton.test.tsx`)

### Removed

- **Removed zero-value coverage tests** — Removed `width=0`, `height=0`, `quality=0` URL tests that tested invalid real-world values and existed only to pad coverage. (`src/functions.test.ts`)

### Added

- **New Pixel component tests** — Added 9 tests: src prop re-rendering, `dynamicDimension` true/false behavior, data URL direct mode, normal fallback on all-source failure, `<picture>` element with multiple sources, onClick handler forwarding, `fallbackSrc` URL generation priority, and loading-state image visibility. (`src/components/Pixel.test.tsx`)
- **New function tests** — Added tests for URL encoding of special characters, undefined parameter exclusion from URLs, source order verification (avif/webp/primary), default mimeType behavior, and unknown format fallback in `getMimeType`. (`src/functions.test.ts`)

## [1.0.1] - 2026-02-22

### Fixed

- **Graceful per-format preload fallback** — Replaced `Promise.all` with `Promise.allSettled` in the `Pixel` component so that if one image format fails to preload (e.g., AVIF), the successfully loaded formats (e.g., WebP, JPEG) are still used instead of falling back entirely to placeholder images. (`src/components/Pixel.tsx`)
- **Fallback MIME type accuracy** — Fallback images now declare their actual format (`image/jpeg` for normal, `image/png` for avatar) instead of using the requested `mimeType`, which could incorrectly declare `image/gif` or `image/tiff` for bundled JPG/PNG fallback assets. (`src/components/Pixel.tsx`)
- **Zero-value parameter handling** — Changed `width`, `height`, and `quality` checks from truthy (`if (quality)`) to explicit (`if (quality !== undefined && quality !== null)`) so that zero values are correctly included in URL parameters. (`src/functions.ts`)
- **getMimeType safety fallback** — Added nullish coalescing (`?? "image/jpeg"`) to `getMimeType()` return value for defensive safety against unexpected input. (`src/functions.ts`)

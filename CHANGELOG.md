# Changelog

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

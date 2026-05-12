# Pixel Serve Client

**A fast, fully typed React 18+ image component** for the [Pixel Serve Server](https://www.npmjs.com/package/pixel-serve-server) backend. Ships ESM & CJS builds with first-class TypeScript IntelliSense.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/pixel-serve-client)](https://www.npmjs.com/package/pixel-serve-client)
[![CI](https://github.com/Hiprax/pixel-serve-client/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Hiprax/pixel-serve-client/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Hiprax/pixel-serve-client/actions/workflows/codeql.yml/badge.svg?branch=main)](https://github.com/Hiprax/pixel-serve-client/actions/workflows/codeql.yml)
[![codecov](https://codecov.io/gh/Hiprax/pixel-serve-client/branch/main/graph/badge.svg)](https://codecov.io/gh/Hiprax/pixel-serve-client)
[![npm provenance](https://img.shields.io/badge/npm%20provenance-built%20%26%20signed-success?logo=npm&logoColor=white)](https://www.npmjs.com/package/pixel-serve-client)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18%20%7C%2019-blue.svg)](https://react.dev/)

## Features

- 🖼️ **Multi-format sources**: Automatic AVIF, WebP, JPEG/PNG srcset generation
- ⚡ **Lazy loading & placeholders**: Lightweight skeleton loader with graceful fallbacks
- 🔒 **SSR-safe**: Guards against `window`/`Image` access on the server
- 📦 **Typed helpers**: `buildPixelUrl`, `buildPixelSources`, `getMimeType` exports for custom use
- 🎨 **Customizable**: Background mode, avatars, direct/raw mode, and private/public folders
- ♻️ **Dual builds**: Works in both ESM and CommonJS environments

## Installation

Requires **Node.js 20 or newer** for the build/test tooling (Node 18 reached end-of-life on 2025-04-30; Vitest 4, ESLint 10, and jsdom 29 in the toolchain now require Node 20+). The bundled component itself runs in any browser that supports `<picture>` and the listed image formats.

```bash
npm install pixel-serve-client
```

## Peer Dependencies

- React >= 18.0.0
- React DOM >= 18.0.0

## Quick Start

### Basic Usage

```tsx
import Pixel from "pixel-serve-client";

const App = () => (
  <Pixel
    src="/uploads/photo.jpg"
    alt="Example Image"
    width={400}
    height={300}
  />
);
```

### With All Options

```tsx
import Pixel from "pixel-serve-client";

const App = () => (
  <Pixel
    src="/uploads/photo.jpg"
    alt="Detailed Image"
    width={800}
    height={600}
    quality={90}
    backendUrl="/api/v1/pixel/serve"
    avif={true}
    webp={true}
    mimeType="jpeg"
    lazy={true}
    loader={true}
    folder="public"
    type="normal"
    className="my-image"
    style={{ borderRadius: "8px" }}
  />
);
```

## Props

| Prop               | Type                    | Default               | Description                                         |
| ------------------ | ----------------------- | --------------------- | --------------------------------------------------- |
| `src`              | `string`                | **required**          | Image path or URL (sent to backend unless `direct`) |
| `alt`              | `string`                | `"image"`             | Alt text for accessibility                          |
| `width`            | `number`                | `undefined`           | Target width in pixels                              |
| `height`           | `number`                | `undefined`           | Target height in pixels                             |
| `quality`          | `number`                | `undefined`           | Quality forwarded to backend (1-100)                |
| `backendUrl`       | `string`                | `/api/v1/pixel/serve` | Pixel Serve endpoint                                |
| `avif`             | `boolean`               | `true`                | Generate AVIF source                                |
| `webp`             | `boolean`               | `true`                | Generate WebP source                                |
| `mimeType`         | `PixelFormat`           | `"jpeg"`              | Primary format when not `direct`                    |
| `direct`           | `boolean`               | `false`               | If true, use `src` verbatim without format variants |
| `lazy`             | `boolean`               | `true`                | Enable native lazy loading                          |
| `loader`           | `boolean`               | `true`                | Show skeleton until images resolve                  |
| `eagerLoad`        | `boolean`               | `false`               | Skip preload chain; render `<picture>` immediately and rely on native `onError` |
| `background`       | `boolean`               | `false`               | Apply background-fit styling                        |
| `folder`           | `'public' \| 'private'` | `"public"`            | Matches server expectation                          |
| `type`             | `'normal' \| 'avatar'`  | `"normal"`            | Chooses avatar vs image fallbacks                   |
| `userId`           | `string`                | `undefined`           | User ID for private folder access                   |
| `fallbackSrc`      | `string`                | `undefined`           | Override source for fallback                        |
| `dynamicDimension` | `boolean`               | `false`               | Don't apply fixed width/height styles               |
| `className`        | `string`                | `undefined`           | CSS class for the image/picture                     |
| `style`            | `CSSProperties`         | `undefined`           | Inline styles                                       |

All standard `<img>` props (except `src` and `children`) are also supported and forwarded.

## Examples

### Avatar with Fallback

```tsx
<Pixel
  src="/users/avatar.jpg"
  type="avatar"
  width={80}
  height={80}
  folder="private"
  userId="user123"
/>
```

### Background Image

```tsx
<div style={{ position: "relative", height: "400px" }}>
  <Pixel src="/banners/hero.jpg" background width={1920} height={400} />
  <h1>Welcome!</h1>
</div>
```

### Direct/Raw Mode

Skip the Pixel Serve backend and use the image URL directly:

```tsx
<Pixel src="https://cdn.example.com/image.png" direct alt="External image" />
```

### Disable Modern Formats

```tsx
<Pixel src="/legacy.jpg" avif={false} webp={false} mimeType="jpeg" />
```

### Eager Load (skip preload chain)

By default the component preloads each candidate format via `new Image()` and
swaps in the bundled fallback only for formats that fail. When `eagerLoad` is
true, the preload chain is bypassed entirely: `<picture>` is rendered
immediately with the constructed sources and the native `<img onError>`
handler triggers the bundled placeholder fallback. Use this when you want
the browser to drive loading directly and you do not need per-format
success detection (the fallback only fires when the **final** `<img>`
fails, not the intermediate AVIF/WebP sources).

```tsx
<Pixel
  src="/uploads/photo.jpg"
  width={800}
  height={600}
  eagerLoad
  loader={false}
/>
```

#### When to use `eagerLoad`

- **Tradeoff.** The component skips the per-format preload detection loop
  that normally runs `new Image()` against AVIF, WebP, and the primary
  format in parallel before mounting. The smart fallback chain that would
  swap in the bundled placeholder for a single format failing is **not
  engaged** — the browser is in charge of source negotiation.
- **Use case.** Reach for `eagerLoad` when you want **zero skeleton
  flash** for URLs you already know are good (CDN-served images with a
  warm cache, hero banners above the fold, dashboards where every
  millisecond of placeholder shimmer is visible noise). Pair it with
  `loader={false}` for the most aggressive setup.
- **Caveat.** If a format is unsupported by the browser, the
  `<picture>`/`<source>` negotiation still picks the next compatible
  format automatically — `<picture>` itself handles per-source fallback
  at the browser level. What you lose is the **client-side smart
  fallback chain** that detects "all my candidates failed" and renders
  the bundled placeholder. With `eagerLoad`, the bundled placeholder
  only kicks in when the **final** `<img>` errors (via the native
  `onError` handler), not when an intermediate AVIF/WebP source fails
  in a way `<picture>` could not negotiate past.

### Custom Backend URL

```tsx
<Pixel
  src="/image.jpg"
  backendUrl="https://api.mysite.com/images"
  width={600}
/>
```

## Helper Functions

For custom implementations, you can use the exported helper functions:

```typescript
import {
  buildPixelUrl,
  buildPixelSources,
  getMimeType,
} from "pixel-serve-client";

// Build a single URL
const url = buildPixelUrl({
  src: "/image.jpg",
  width: 800,
  height: 600,
  format: "webp",
  quality: 90,
  backendUrl: "/api/v1/pixel/serve",
});
// => "/api/v1/pixel/serve?width=800&height=600&quality=90&format=webp&src=%2Fimage.jpg&folder=public&type=normal"

// Build sources array for <picture>
const sources = buildPixelSources({
  src: "/image.jpg",
  width: 800,
  avif: true,
  webp: true,
  mimeType: "jpeg",
});
// => [
//   { src: "...format=avif...", type: "image/avif" },
//   { src: "...format=webp...", type: "image/webp" },
//   { src: "...format=jpeg...", type: "image/jpeg" },
// ]

// Get MIME type for a format
const mime = getMimeType("webp"); // => "image/webp"
```

## Integration with Pixel Serve Server

This component is designed to work with [`pixel-serve-server`](https://www.npmjs.com/package/pixel-serve-server):

```typescript
// Server (Express)
import express from "express";
import { registerServe } from "pixel-serve-server";

const app = express();
app.get("/api/v1/pixel/serve", registerServe({
  baseDir: "./public/images",
  allowedNetworkList: ["cdn.example.com"],
}));

// Client (React)
import Pixel from "pixel-serve-client";

<Pixel
  src="/photos/landscape.jpg"
  width={1200}
  height={800}
  backendUrl="/api/v1/pixel/serve"
/>
```

## Skeleton Loader

The built-in skeleton loader can be used independently:

```tsx
import { Skeleton } from "pixel-serve-client";

<Skeleton
  width={200}
  height={150}
  isCircle={false}
  background={false}
  className="my-skeleton"
/>;
```

### Skeleton Props

| Prop         | Type               | Default      | Description           |
| ------------ | ------------------ | ------------ | --------------------- |
| `width`      | `string \| number` | **required** | Width (px if number)  |
| `height`     | `string \| number` | **required** | Height (px if number) |
| `isCircle`   | `boolean`          | `false`      | Circular shape        |
| `background` | `boolean`          | `false`      | Absolute positioning  |
| `className`  | `string`           | `undefined`  | Additional CSS class  |

## Type Exports

```typescript
import type {
  PixelProps,
  PixelFormat,
  PixelFolder,
  PixelType,
  PixelSource,
  SrcGeneratorOptions,
} from "pixel-serve-client";
```

## Module Formats

```typescript
// ESM
import Pixel from "pixel-serve-client";
import { buildPixelUrl, Skeleton } from "pixel-serve-client";

// CommonJS
const Pixel = require("pixel-serve-client").default;
const { buildPixelUrl, Skeleton } = require("pixel-serve-client");
```

## SSR Compatibility

The component is SSR-safe and handles server-side rendering gracefully:

- Guards against `window` and `Image` access
- Preloads images only on the client
- Renders with initial skeleton state

## Performance Tips

1. **Set explicit dimensions**: Always provide `width` and `height` to prevent layout shift
2. **Use `lazy` loading**: Enabled by default for better initial load
3. **Enable modern formats**: AVIF and WebP are enabled by default for smaller file sizes
4. **Use `direct` for external CDNs**: Skip processing for already-optimized images

## License

MIT

## Contributing

Issues and pull requests are welcome at [GitHub](https://github.com/Hiprax/pixel-serve-client).
See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the local development workflow,
coverage expectations, and PR guidelines.

## Security

See [`SECURITY.md`](./SECURITY.md) for the disclosure policy, supported
versions, and the in-scope / out-of-scope vulnerability classes. Please **do
not** open public GitHub issues for security reports.

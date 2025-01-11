# Pixel Serve Client Component

The `Pixel Serve` component is a powerful and flexible React component designed to handle dynamic image rendering with support for multiple formats, lazy loading, and additional customization options.

## Features

- **Multi-format support**: Automatically generates image sources for AVIF, WebP, and other formats.
- **Lazy Loading**: Loads images only when they come into view, improving performance.
- **Dynamic Dimensions**: Allows for responsive width and height.
- **Customizable**: Supports styles, classes, and multiple use cases (e.g., background images, avatars).
- **Placeholder Skeletons**: Displays a loading skeleton until the image is ready.

## Installation

To use this component in your project, install it via npm:

```bash
npm install pixel-serve-client
```

## Usage

### Basic Example

```tsx
import Pixel from "pixel-serve-client";

const App = () => (
  <Pixel
    src="/path/to/image.jpg"
    alt="Example Image"
    width={300}
    height={200}
  />
);

export default App;
```

### Props

| Prop               | Type                    | Default               | Description                                                                |
| ------------------ | ----------------------- | --------------------- | -------------------------------------------------------------------------- |
| `src`              | `string`                | **Required**          | The source URL of the image.                                               |
| `className`        | `string`                | `undefined`           | Custom CSS class for the component.                                        |
| `alt`              | `string`                | `'image'`             | Alt text for the image.                                                    |
| `style`            | `CSSProperties`         | `{}`                  | Inline styles for the image.                                               |
| `background`       | `boolean`               | `false`               | Whether the image is used as a background.                                 |
| `lazy`             | `boolean`               | `true`                | Enables lazy loading for the image.                                        |
| `width`            | `number`                | `undefined`           | Width of the image in pixels.                                              |
| `height`           | `number`                | `undefined`           | Height of the image in pixels.                                             |
| `quality`          | `number`                | `undefined`           | Image quality for compression (if applicable).                             |
| `userId`           | `string`                | `undefined`           | ID of the user who owns the image (used in dynamic image paths).           |
| `avif`             | `boolean`               | `true`                | Whether to generate an AVIF source for the image.                          |
| `webp`             | `boolean`               | `true`                | Whether to generate a WebP source for the image.                           |
| `mimeType`         | `string`                | `'jpeg'`              | MIME type of the image (e.g., 'jpeg', 'png').                              |
| `direct`           | `boolean`               | `false`               | Loads the image directly without generating multiple formats.              |
| `loader`           | `boolean`               | `true`                | Displays a skeleton loader while the image is loading.                     |
| `dynamicDimension` | `boolean`               | `false`               | Dynamically adjusts dimensions based on the `width` and `height` provided. |
| `backendUrl`       | `string`                | `/api/v1/pixel/serve` | The backend URL for the image.                                             |
| `folder`           | `'public' \| 'private'` | `'public'`            | Specifies whether the image is in a public or private folder.              |
| `type`             | `'normal' \| 'avatar'`  | `'normal'`            | Specifies the type of image (e.g., normal image or avatar).                |

### Other Examples

Using `Pixel Serve` as a background image:

```tsx
<Pixel
  src="/path/to/background.jpg"
  background={true}
  style={{ borderRadius: "10px" }}
  width={500}
  height={300}
/>
```

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Author

Developed by Hiprax.

import type { CSSProperties, ImgHTMLAttributes } from "react";

export type PixelFolder = "public" | "private";
export type PixelType = "normal" | "avatar";
export type PixelFormat = "jpeg" | "png" | "webp" | "avif" | "gif" | "tiff";

export type SrcGeneratorOptions = {
  src: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: PixelFormat;
  userId?: string;
  backendUrl?: string;
  folder?: PixelFolder;
  type?: PixelType;
  direct?: boolean;
};

export type PixelProps = SrcGeneratorOptions &
  Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "children"> & {
    className?: string;
    alt?: string;
    /**
     * Inline style applied to the rendered `<img>` or `<picture>` element.
     *
     * Precedence rules:
     * - When `width`/`height` props are set and `dynamicDimension` is false,
     *   they seed the style first and any matching keys in `style` override
     *   them (caller-supplied `style` wins).
     * - When `background` is true, the background positioning styles
     *   intentionally override everything else, including `style`.
     */
    style?: CSSProperties;
    background?: boolean;
    lazy?: boolean;
    avif?: boolean;
    webp?: boolean;
    mimeType?: PixelFormat;
    loader?: boolean;
    /**
     * When true, skip the per-format preload chain and render `<picture>`
     * directly with the constructed sources. The browser handles loading
     * and the native `onError` handler triggers the bundled placeholder
     * fallback. Tradeoff: format-by-format success detection is not
     * available — only the final `<img>` failure produces a fallback.
     *
     * @default false
     */
    eagerLoad?: boolean;
    dynamicDimension?: boolean;
    fallbackSrc?: string;
  };

export type PixelSource = { src: string; type: string };

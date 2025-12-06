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
    style?: CSSProperties;
    background?: boolean;
    lazy?: boolean;
    avif?: boolean;
    webp?: boolean;
    mimeType?: PixelFormat;
    loader?: boolean;
    dynamicDimension?: boolean;
    fallbackSrc?: string;
  };

export type PixelSource = { src: string; type: string };

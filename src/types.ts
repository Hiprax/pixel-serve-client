import type { CSSProperties } from "react";

export type SrcGeneratorProps = {
  src: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
  userId?: string;
  backendUrl?: string;
  folder?: "public" | "private";
  type?: "normal" | "avatar";
};

export type PixelProps = {
  src: string;
  className?: string;
  alt?: string;
  style?: CSSProperties;
  background?: boolean;
  lazy?: boolean;
  width?: number;
  height?: number;
  quality?: number;
  userId?: string;
  backendUrl?: string;
  avif?: boolean;
  webp?: boolean;
  mimeType?: string;
  direct?: boolean;
  loader?: boolean;
  dynamicDimension?: boolean;
  folder?: "public" | "private";
  type?: "normal" | "avatar";
};

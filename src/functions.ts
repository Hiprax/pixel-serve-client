import type { PixelFormat, PixelSource, SrcGeneratorOptions } from "./types";

const extensionMap: Record<PixelFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  tiff: "image/tiff",
  avif: "image/avif",
};

export const getMimeType = (type: PixelFormat = "jpeg"): string =>
  extensionMap[type] ?? "image/jpeg";

const buildParams = ({
  src,
  width,
  height,
  quality,
  format,
  userId,
  folder = "public",
  type = "normal",
}: SrcGeneratorOptions): string => {
  const params = new URLSearchParams();
  if (width !== undefined && width !== null) params.set("width", String(width));
  if (height !== undefined && height !== null)
    params.set("height", String(height));
  if (quality !== undefined && quality !== null)
    params.set("quality", String(quality));
  if (format) params.set("format", format);
  params.set("src", src);
  params.set("folder", folder === "private" ? "private" : "public");
  params.set("type", type === "avatar" ? "avatar" : "normal");
  if (userId) params.set("userId", userId);
  return params.toString();
};

export const buildPixelUrl = ({
  backendUrl = "/api/v1/pixel/serve",
  ...options
}: SrcGeneratorOptions): string => `${backendUrl}?${buildParams(options)}`;

export const buildPixelSources = ({
  avif = true,
  webp = true,
  mimeType = "jpeg",
  ...options
}: SrcGeneratorOptions & {
  avif?: boolean;
  webp?: boolean;
  mimeType?: PixelFormat;
}): PixelSource[] => {
  if (options.direct) {
    return [
      {
        src: options.src,
        type: extensionMap[mimeType],
      },
    ];
  }
  const sources: PixelSource[] = [];
  if (avif) {
    sources.push({
      src: buildPixelUrl({ ...options, format: "avif" }),
      type: extensionMap.avif,
    });
  }
  if (webp) {
    sources.push({
      src: buildPixelUrl({ ...options, format: "webp" }),
      type: extensionMap.webp,
    });
  }
  sources.push({
    src: buildPixelUrl({ ...options, format: mimeType }),
    type: extensionMap[mimeType],
  });
  return sources;
};

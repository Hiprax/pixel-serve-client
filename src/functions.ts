import type { SrcGeneratorProps } from "./types";

/**
 * Generates the MIME type based on the file extension.
 *
 * @param {string} type - The file extension (e.g., 'jpg', 'png').
 * @returns {string} The corresponding MIME type.
 */
export const getMimeType = (type: string): string => {
  const extensionMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    tiff: "image/tiff",
    tif: "image/tiff",
    avif: "image/avif",
  };
  return extensionMap[type] || "";
};

/**
 * Generates the source URL for the image based on the provided parameters.
 *
 * @param {Object} options - Options for generating the image source URL.
 * @param {string} options.src - The source URL of the image.
 * @param {number} [options.width] - The width of the image.
 * @param {number} [options.height] - The height of the image.
 * @param {number} [options.quality] - The quality of the image.
 * @param {string} [options.format] - The format of the image.
 * @param {string} [options.userId] - The user ID of the image owner.
 * @param {string} [options.backendUrl="/api/v1/pixel/serve"] - The backend URL for the image.
 * @param {string} [options.folder="public"] - The folder where the image is stored.
 * @param {string} [options.type="normal"] - The type of image (e.g., 'normal', 'avatar').
 * @returns {string} The generated source URL.
 */
export const srcGenerator = ({
  src,
  width,
  height,
  quality,
  format,
  userId,
  backendUrl = "/api/v1/pixel/serve",
  folder = "public",
  type = "normal",
}: SrcGeneratorProps) =>
  `${backendUrl}?${width ? "width=" + width : ""}${
    height ? "&height=" + height : ""
  }${quality ? "&quality=" + quality : ""}${
    format ? "&format=" + format : ""
  }&src=${src}&folder=${folder === "private" ? "private" : "public"}&type=${
    type === "avatar" ? "avatar" : "normal"
  }${userId ? "&userId=" + userId : ""}`;

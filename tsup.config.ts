import { defineConfig } from "tsup";
import { copyFileSync, mkdirSync } from "fs";
import { join } from "path";

export default defineConfig({
  entry: ["./src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  minify: true,
  sourcemap: true,
  external: ["react"],
  shims: true,
  loader: {
    ".avif": "dataurl",
    ".webp": "dataurl",
    ".jpg": "dataurl",
    ".png": "dataurl",
  },
  async onSuccess() {
    // Create assets directory if it doesn't exist
    mkdirSync("dist/assets", { recursive: true });

    // Copy all image files to dist/assets
    const imageFiles = [
      "src/assets/noimage.avif",
      "src/assets/noimage.webp",
      "src/assets/noimage.jpg",
      "src/assets/noavatar.avif",
      "src/assets/noavatar.webp",
      "src/assets/noavatar.png",
    ];

    imageFiles.forEach((file) => {
      const fileName = file.split("/").pop();
      // Add a null check to ensure fileName is not undefined
      if (fileName) {
        copyFileSync(file, join("dist/assets", fileName));
      }
    });
  },
});

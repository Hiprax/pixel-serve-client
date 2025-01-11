import { defineConfig } from "tsup";
import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export default defineConfig({
  entry: ["./src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  minify: true,
  sourcemap: true,
  external: ["react"],
  shims: true,
  async onSuccess() {
    await mkdir("dist/assets", { recursive: true });

    const assets = [
      "noimage.avif",
      "noimage.webp",
      "noimage.jpg",
      "noavatar.avif",
      "noavatar.webp",
      "noavatar.png",
    ];

    for (const asset of assets) {
      await copyFile(join("src/assets", asset), join("dist/assets", asset));
    }
  },
});

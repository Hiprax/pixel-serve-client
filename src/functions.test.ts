import { describe, expect, it } from "vitest";
import { buildPixelSources, buildPixelUrl, getMimeType } from "./functions";

describe("getMimeType", () => {
  it("returns correct MIME type for jpeg", () => {
    expect(getMimeType("jpeg")).toBe("image/jpeg");
  });

  it("returns correct MIME type for png", () => {
    expect(getMimeType("png")).toBe("image/png");
  });

  it("returns correct MIME type for webp", () => {
    expect(getMimeType("webp")).toBe("image/webp");
  });

  it("returns correct MIME type for gif", () => {
    expect(getMimeType("gif")).toBe("image/gif");
  });

  it("returns correct MIME type for tiff", () => {
    expect(getMimeType("tiff")).toBe("image/tiff");
  });

  it("returns correct MIME type for avif", () => {
    expect(getMimeType("avif")).toBe("image/avif");
  });

  it("defaults to jpeg when type is undefined", () => {
    expect(getMimeType()).toBe("image/jpeg");
  });
});

describe("buildPixelUrl", () => {
  it("builds URL with default backend", () => {
    const url = buildPixelUrl({ src: "/image.jpg" });
    expect(url).toContain("/api/v1/pixel/serve");
    expect(url).toContain("src=%2Fimage.jpg");
  });

  it("builds URL with custom backend", () => {
    const url = buildPixelUrl({
      src: "/image.jpg",
      backendUrl: "/custom/endpoint",
    });
    expect(url).toContain("/custom/endpoint");
  });

  it("includes width when provided", () => {
    const url = buildPixelUrl({ src: "/image.jpg", width: 800 });
    expect(url).toContain("width=800");
  });

  it("includes height when provided", () => {
    const url = buildPixelUrl({ src: "/image.jpg", height: 600 });
    expect(url).toContain("height=600");
  });

  it("includes quality when provided", () => {
    const url = buildPixelUrl({ src: "/image.jpg", quality: 90 });
    expect(url).toContain("quality=90");
  });

  it("includes format when provided", () => {
    const url = buildPixelUrl({ src: "/image.jpg", format: "webp" });
    expect(url).toContain("format=webp");
  });

  it("includes userId when provided", () => {
    const url = buildPixelUrl({ src: "/image.jpg", userId: "user123" });
    expect(url).toContain("userId=user123");
  });

  it("defaults folder to public", () => {
    const url = buildPixelUrl({ src: "/image.jpg" });
    expect(url).toContain("folder=public");
  });

  it("sets folder to private when specified", () => {
    const url = buildPixelUrl({ src: "/image.jpg", folder: "private" });
    expect(url).toContain("folder=private");
  });

  it("defaults type to normal", () => {
    const url = buildPixelUrl({ src: "/image.jpg" });
    expect(url).toContain("type=normal");
  });

  it("sets type to avatar when specified", () => {
    const url = buildPixelUrl({ src: "/image.jpg", type: "avatar" });
    expect(url).toContain("type=avatar");
  });

  it("builds complete URL with all parameters", () => {
    const url = buildPixelUrl({
      src: "/photo.png",
      width: 1200,
      height: 800,
      quality: 85,
      format: "avif",
      userId: "u456",
      folder: "private",
      type: "avatar",
      backendUrl: "/api/images",
    });

    expect(url).toContain("/api/images?");
    expect(url).toContain("width=1200");
    expect(url).toContain("height=800");
    expect(url).toContain("quality=85");
    expect(url).toContain("format=avif");
    expect(url).toContain("userId=u456");
    expect(url).toContain("folder=private");
    expect(url).toContain("type=avatar");
    expect(url).toContain("src=%2Fphoto.png");
  });
});

describe("buildPixelSources", () => {
  it("returns direct source when direct mode is true", () => {
    const sources = buildPixelSources({
      src: "/direct.jpg",
      direct: true,
      mimeType: "jpeg",
    });

    expect(sources).toHaveLength(1);
    expect(sources[0].src).toBe("/direct.jpg");
    expect(sources[0].type).toBe("image/jpeg");
  });

  it("returns direct source with png mimeType", () => {
    const sources = buildPixelSources({
      src: "/direct.png",
      direct: true,
      mimeType: "png",
    });

    expect(sources).toHaveLength(1);
    expect(sources[0].type).toBe("image/png");
  });

  it("generates all format sources by default", () => {
    const sources = buildPixelSources({ src: "/image.jpg" });

    expect(sources.length).toBe(3);
    expect(sources[0].type).toBe("image/avif");
    expect(sources[1].type).toBe("image/webp");
    expect(sources[2].type).toBe("image/jpeg");
  });

  it("excludes avif when avif is false", () => {
    const sources = buildPixelSources({
      src: "/image.jpg",
      avif: false,
    });

    expect(sources.length).toBe(2);
    expect(sources.some((s) => s.type === "image/avif")).toBe(false);
    expect(sources[0].type).toBe("image/webp");
    expect(sources[1].type).toBe("image/jpeg");
  });

  it("excludes webp when webp is false", () => {
    const sources = buildPixelSources({
      src: "/image.jpg",
      webp: false,
    });

    expect(sources.length).toBe(2);
    expect(sources.some((s) => s.type === "image/webp")).toBe(false);
    expect(sources[0].type).toBe("image/avif");
    expect(sources[1].type).toBe("image/jpeg");
  });

  it("only includes primary format when avif and webp are false", () => {
    const sources = buildPixelSources({
      src: "/image.jpg",
      avif: false,
      webp: false,
      mimeType: "jpeg",
    });

    expect(sources.length).toBe(1);
    expect(sources[0].type).toBe("image/jpeg");
  });

  it("uses provided mimeType for primary format", () => {
    const sources = buildPixelSources({
      src: "/image.png",
      avif: false,
      webp: false,
      mimeType: "png",
    });

    expect(sources[0].type).toBe("image/png");
  });

  it("passes all options to buildPixelUrl", () => {
    const sources = buildPixelSources({
      src: "/image.jpg",
      width: 800,
      height: 600,
      quality: 90,
      userId: "test",
      folder: "private",
      type: "avatar",
      backendUrl: "/custom",
    });

    expect(sources.length).toBe(3);
    sources.forEach((source) => {
      expect(source.src).toContain("/custom?");
      expect(source.src).toContain("width=800");
      expect(source.src).toContain("height=600");
      expect(source.src).toContain("quality=90");
      expect(source.src).toContain("userId=test");
      expect(source.src).toContain("folder=private");
      expect(source.src).toContain("type=avatar");
    });
  });

  it("includes format parameter in each source URL", () => {
    const sources = buildPixelSources({ src: "/image.jpg" });

    expect(sources[0].src).toContain("format=avif");
    expect(sources[1].src).toContain("format=webp");
    expect(sources[2].src).toContain("format=jpeg");
  });

  it("uses tiff as primary mimeType", () => {
    const sources = buildPixelSources({
      src: "/image.tiff",
      avif: false,
      webp: false,
      mimeType: "tiff",
    });

    expect(sources[0].type).toBe("image/tiff");
  });

  it("uses gif as primary mimeType", () => {
    const sources = buildPixelSources({
      src: "/image.gif",
      avif: false,
      webp: false,
      mimeType: "gif",
    });

    expect(sources[0].type).toBe("image/gif");
  });
});

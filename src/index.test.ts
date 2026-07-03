import { describe, expect, it } from "vitest";
import PixelDefault, { Pixel, Skeleton } from "./index";

describe("index exports", () => {
  it("exposes both the default and named Pixel exports as defined values", () => {
    // Guards against a vacuous pass below: if a bad import path resolved
    // both bindings to `undefined`, a bare `toBe` reference check would
    // still succeed even though the named export is broken.
    expect(PixelDefault).toBeDefined();
    expect(Pixel).toBeDefined();
  });

  it("named Pixel export is reference-equal to the default export", () => {
    expect(Pixel).toBe(PixelDefault);
  });

  it("named Pixel export resolves to the memoized Pixel component", () => {
    expect(Pixel.displayName).toBe("Pixel");
  });

  it("does not disturb the existing named Skeleton export", () => {
    expect(Skeleton).toBeDefined();
  });
});

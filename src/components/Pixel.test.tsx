import { StrictMode } from "react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Pixel from "./Pixel";
import { buildPixelSources, buildPixelUrl } from "../functions";
import { unsetImage } from "../../vitest.setup";

const waitForLoad = async (): Promise<void> =>
  waitFor(() => expect(screen.getByRole("img")).toBeInTheDocument());

describe("Pixel component", () => {
  it("renders picture sources and hides skeleton after load", async () => {
    render(
      <Pixel
        src="/image.jpg"
        width={200}
        height={200}
        quality={80}
        backendUrl="/api/v1/pixel/serve"
      />,
    );

    expect(
      screen.getByRole("presentation", { hidden: true }),
    ).toBeInTheDocument();

    await waitForLoad();
  });

  it("falls back immediately when Image is undefined (SSR-safe)", async () => {
    unsetImage();
    render(
      <Pixel
        src="/noimg.jpg"
        loader={false}
        avif={false}
        webp={false}
        mimeType="jpeg"
      />,
    );
    const img = await screen.findByRole("img");
    expect(img.getAttribute("src")).toContain("src=%2Fnoimg.jpg");
  });

  it("falls back when image fails to load", async () => {
    render(
      <Pixel
        src="fail-image.jpg"
        width={120}
        height={120}
        backendUrl="/api/v1/pixel/serve"
      />,
    );

    const img = await screen.findByRole("img");
    expect(img.getAttribute("src")).not.toContain("fail-image.jpg");
  });

  it("supports direct mode with raw src", async () => {
    render(<Pixel src="/raw.jpg" direct alt="raw" />);
    const img = await screen.findByRole("img", { name: "raw" });
    expect(img.getAttribute("src")).toBe("/raw.jpg");
  });

  it("renders background mode without loader", async () => {
    render(
      <Pixel
        src="/bg.jpg"
        background
        loader={false}
        width={100}
        height={50}
        dynamicDimension
      />,
    );
    await waitForLoad();
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toContain("src=%2Fbg.jpg");
  });

  it("renders single-source non-direct flow when formats disabled", async () => {
    render(
      <Pixel
        src="/single.jpg"
        avif={false}
        webp={false}
        mimeType="jpeg"
        loader={false}
      />,
    );
    const img = await screen.findByRole("img");
    expect(img.getAttribute("src")).toContain("format=jpeg");
  });

  it("falls back to avatar placeholder when load fails and formats off", async () => {
    render(
      <Pixel
        src="fail-avatar.jpg"
        type="avatar"
        avif={false}
        webp={false}
        mimeType="png"
        loader={false}
      />,
    );
    const img = await screen.findByRole("img");
    expect(img.getAttribute("src")).toContain("noavatar");
    expect(img.getAttribute("src")).toContain("png");
  });

  it("renders with custom className", async () => {
    render(<Pixel src="/image.jpg" className="custom-class" loader={false} />);
    await waitForLoad();
    const picture = document.querySelector(".custom-class");
    expect(picture).toBeInTheDocument();
  });

  it("renders with custom alt text", async () => {
    render(<Pixel src="/image.jpg" alt="Custom alt text" loader={false} />);
    const img = await screen.findByRole("img", { name: "Custom alt text" });
    expect(img).toBeInTheDocument();
  });

  it("renders with eager loading when lazy is false", async () => {
    render(<Pixel src="/image.jpg" lazy={false} loader={false} />);
    await waitForLoad();
    const img = screen.getByRole("img");
    expect(img.getAttribute("loading")).toBe("eager");
  });

  it("renders with lazy loading by default", async () => {
    render(<Pixel src="/image.jpg" loader={false} />);
    await waitForLoad();
    const img = screen.getByRole("img");
    expect(img.getAttribute("loading")).toBe("lazy");
  });

  it("applies custom style to image", async () => {
    render(
      <Pixel
        src="/image.jpg"
        style={{ borderRadius: "10px" }}
        loader={false}
      />,
    );
    await waitForLoad();
    const img = screen.getByRole("img");
    expect(img.style.borderRadius).toBe("10px");
  });

  it("renders with private folder setting", async () => {
    render(
      <Pixel
        src="/image.jpg"
        folder="private"
        userId="user123"
        loader={false}
      />,
    );
    await waitForLoad();
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toContain("folder=private");
    expect(img.getAttribute("src")).toContain("userId=user123");
  });

  it("uses fallbackSrc when provided", async () => {
    render(
      <Pixel
        src="fail-image.jpg"
        fallbackSrc="/fallback.jpg"
        loader={false}
        avif={false}
        webp={false}
      />,
    );
    const img = await screen.findByRole("img");
    // fallbackSrc should be used instead of src
    expect(img.getAttribute("src")).toContain("src=%2Ffallback.jpg");
  });

  it("renders avatar type correctly", async () => {
    render(<Pixel src="/avatar.jpg" type="avatar" loader={false} />);
    await waitForLoad();
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toContain("type=avatar");
  });

  it("passes additional props to img element", async () => {
    render(
      <Pixel
        src="/image.jpg"
        loader={false}
        data-testid="custom-id"
        title="Image title"
      />,
    );
    await waitForLoad();
    const img = screen.getByRole("img");
    expect(img.getAttribute("data-testid")).toBe("custom-id");
    expect(img.getAttribute("title")).toBe("Image title");
  });

  it("renders skeleton with correct dimensions", () => {
    render(
      <Pixel src="/loading-image.jpg" width={300} height={200} loader={true} />,
    );
    const skeleton = screen.getByRole("presentation", { hidden: true });
    expect(skeleton.style.width).toBe("300px");
    expect(skeleton.style.height).toBe("200px");
  });

  it("renders circular skeleton for avatar type", () => {
    render(
      <Pixel
        src="/loading-avatar.jpg"
        type="avatar"
        width={100}
        height={100}
        loader={true}
      />,
    );
    const skeleton = screen.getByRole("presentation", { hidden: true });
    expect(skeleton.style.borderRadius).toBe("50%");
  });

  it("renders background skeleton positioning", () => {
    render(<Pixel src="/loading-bg.jpg" background loader={true} />);
    const skeleton = screen.getByRole("presentation", { hidden: true });
    expect(skeleton.style.position).toBe("absolute");
  });

  it("renders with custom quality", async () => {
    render(<Pixel src="/image.jpg" quality={90} loader={false} />);
    await waitForLoad();
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toContain("quality=90");
  });

  it("renders with custom backendUrl", async () => {
    render(<Pixel src="/image.jpg" backendUrl="/custom/api" loader={false} />);
    await waitForLoad();
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toContain("/custom/api");
  });

  it("cancels in-flight preload after unmount so no state update is attempted", async () => {
    // React 18+ removed the "state-update-after-unmount" warning, so the old
    // console.error spy was a no-op. This test verifies the actual cancel
    // semantics: drive a deferred Image mock whose onload only fires AFTER
    // unmount, then assert that no setState was attempted post-unmount.
    type DeferredImage = {
      complete: false;
      naturalWidth: 0;
      onload: (() => void) | null;
      onerror: (() => void) | null;
      crossOrigin: string | null;
      referrerPolicy: string;
      src: string;
      _fire: () => void;
    };
    const pending: DeferredImage[] = [];
    class ManualImage {
      public complete = false as const;
      public naturalWidth = 0 as const;
      public onload: (() => void) | null = null;
      public onerror: (() => void) | null = null;
      public crossOrigin: string | null = null;
      public referrerPolicy = "";
      private _src = "";
      set src(value: string) {
        this._src = value;
      }
      get src(): string {
        return this._src;
      }
      _fire(): void {
        this.onload?.();
      }
    }
    const originalImage = (globalThis as unknown as { Image: typeof Image })
      .Image;
    (globalThis as unknown as { Image: unknown }).Image = function (): unknown {
      const inst = new ManualImage();
      pending.push(inst as unknown as DeferredImage);
      return inst;
    };

    // Spy on console.error to catch any React warnings or thrown errors that
    // would escape into the test harness if the cancel guard regresses.
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const { unmount } = render(<Pixel src="/image.jpg" loader={false} />);
      // Unmount BEFORE any preload Image fires its onload callback.
      unmount();

      // Now fire the pending onloads. With the cancel flag working, the
      // post-await `if (cancelled) return;` short-circuits and never reaches
      // setDisplayedSrcSet / setImageLoaded.
      for (const img of pending) img._fire();

      // Let the microtask queue drain so any racing setState would run.
      await Promise.resolve();
      await Promise.resolve();

      // No throws and no console.error noise (the only thing a regression
      // could surface in React 18+; the legacy warning is gone but a stray
      // setState on an unmounted tree still logs in dev under certain paths).
      expect(consoleSpy).not.toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
      (globalThis as unknown as { Image: typeof Image }).Image = originalImage;
    }
  });

  it("re-renders with new sources when src prop changes", async () => {
    const { rerender } = render(
      <Pixel
        src="/image1.jpg"
        loader={false}
        avif={false}
        webp={false}
        mimeType="jpeg"
      />,
    );
    const img1 = await screen.findByRole("img");
    expect(img1.getAttribute("src")).toContain("src=%2Fimage1.jpg");

    rerender(
      <Pixel
        src="/image2.jpg"
        loader={false}
        avif={false}
        webp={false}
        mimeType="jpeg"
      />,
    );
    const img2 = await screen.findByRole("img");
    expect(img2.getAttribute("src")).toContain("src=%2Fimage2.jpg");
  });

  it("applies fixed dimensions when dynamicDimension is false", async () => {
    render(
      <Pixel
        src="/image.jpg"
        width={300}
        height={200}
        dynamicDimension={false}
        loader={false}
      />,
    );
    await waitForLoad();
    const img = screen.getByRole("img");
    expect(img.style.width).toBe("300px");
    expect(img.style.height).toBe("200px");
  });

  it("does not apply fixed dimensions when dynamicDimension is true", async () => {
    render(
      <Pixel
        src="/image.jpg"
        width={300}
        height={200}
        dynamicDimension={true}
        loader={false}
      />,
    );
    await waitForLoad();
    const img = screen.getByRole("img");
    expect(img.style.width).not.toBe("300px");
    expect(img.style.height).not.toBe("200px");
  });

  it("renders direct mode with data URL", async () => {
    const dataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    render(<Pixel src={dataUrl} direct loader={false} />);
    const img = await screen.findByRole("img");
    expect(img.getAttribute("src")).toBe(dataUrl);
  });

  it("falls back to normal placeholder when all sources fail and type is normal", async () => {
    render(
      <Pixel
        src="fail-all.jpg"
        type="normal"
        avif={false}
        webp={false}
        mimeType="jpeg"
        loader={false}
      />,
    );
    const img = await screen.findByRole("img");
    expect(img.getAttribute("src")).toContain("noimage");
  });

  it("renders picture element with multiple sources when formats enabled", async () => {
    render(
      <Pixel
        src="/image.jpg"
        avif={true}
        webp={true}
        mimeType="jpeg"
        loader={false}
      />,
    );
    await waitForLoad();
    const picture = document.querySelector("picture");
    expect(picture).toBeInTheDocument();
    const sources = picture?.querySelectorAll("source");
    expect(sources?.length).toBeGreaterThanOrEqual(2);
  });

  it("passes onClick handler to img element", async () => {
    const handleClick = vi.fn();
    render(<Pixel src="/image.jpg" onClick={handleClick} loader={false} />);
    await waitForLoad();
    const img = screen.getByRole("img");
    img.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("uses fallbackSrc for source generation instead of src", async () => {
    render(
      <Pixel
        src="/original.jpg"
        fallbackSrc="/override.jpg"
        avif={false}
        webp={false}
        mimeType="jpeg"
        loader={false}
      />,
    );
    const img = await screen.findByRole("img");
    // fallbackSrc should be used in the URL, not original src
    expect(img.getAttribute("src")).toContain("src=%2Foverride.jpg");
    expect(img.getAttribute("src")).not.toContain("src=%2Foriginal.jpg");
  });

  it("hides image with 1px dimensions while loading", () => {
    render(
      <Pixel src="/loading-image.jpg" width={300} height={200} loader={true} />,
    );
    // While loading, image should not be visible (no img role yet or hidden)
    const imgs = screen.queryAllByRole("img");
    // No img should be rendered yet since displayedSrcSet is empty
    expect(imgs.length).toBe(0);
  });

  it("onError handler triggers fallback for normal type", async () => {
    render(<Pixel src="/will-error.jpg" direct loader={false} type="normal" />);
    const img = await screen.findByRole("img");
    // Initially the image should have the direct src
    expect(img.getAttribute("src")).toBe("/will-error.jpg");

    // Simulate the browser reporting an image load error
    fireEvent.error(img);

    // After the error, the component should switch to the noimage fallback
    await waitFor(() => {
      const updatedImg = screen.getByRole("img");
      expect(updatedImg.getAttribute("src")).toContain("noimage");
    });
  });

  it("onError handler triggers avatar fallback for avatar type", async () => {
    render(
      <Pixel
        src="/will-error-avatar.jpg"
        direct
        loader={false}
        type="avatar"
      />,
    );
    const img = await screen.findByRole("img");
    // Initially the image should have the direct src
    expect(img.getAttribute("src")).toBe("/will-error-avatar.jpg");

    // Simulate the browser reporting an image load error
    fireEvent.error(img);

    // After the error, the component should switch to the noavatar fallback
    await waitFor(() => {
      const updatedImg = screen.getByRole("img");
      expect(updatedImg.getAttribute("src")).toContain("noavatar");
    });
  });

  it("StrictMode rapid src change shows only the final src without flicker", async () => {
    const { rerender } = render(
      <StrictMode>
        <Pixel
          src="/strict1.jpg"
          loader={false}
          avif={false}
          webp={false}
          mimeType="jpeg"
        />
      </StrictMode>,
    );
    rerender(
      <StrictMode>
        <Pixel
          src="/strict2.jpg"
          loader={false}
          avif={false}
          webp={false}
          mimeType="jpeg"
        />
      </StrictMode>,
    );

    await waitFor(() => {
      const img = screen.getByRole("img");
      expect(img.getAttribute("src")).toContain("src=%2Fstrict2.jpg");
    });
    // Verify the stale first-src never wins the race
    const finalImg = screen.getByRole("img");
    expect(finalImg.getAttribute("src")).not.toContain("src=%2Fstrict1.jpg");
  });

  it("resolves preload immediately for cached images (img.complete=true)", async () => {
    // Replace the default mock with one whose `complete` flips to true
    // synchronously after the consumer assigns `src`.
    class CachedImage {
      public complete = false;
      public naturalWidth = 0;
      public onload: (() => void) | null = null;
      public onerror: (() => void) | null = null;
      set src(_value: string) {
        this.complete = true;
        this.naturalWidth = 100;
      }
    }
    const originalImage = (globalThis as unknown as { Image: typeof Image })
      .Image;
    (globalThis as unknown as { Image: unknown }).Image = CachedImage;

    try {
      render(
        <Pixel
          src="/cached.jpg"
          avif={false}
          webp={false}
          mimeType="jpeg"
          loader={true}
          width={50}
          height={50}
        />,
      );
      // Image should appear without ever needing the async preload tick.
      const img = await screen.findByRole("img");
      expect(img.getAttribute("src")).toContain("src=%2Fcached.jpg");
    } finally {
      (globalThis as unknown as { Image: typeof Image }).Image = originalImage;
    }
  });

  it("caller-supplied style.width overrides prop width", async () => {
    render(
      <Pixel
        src="/style-prio.jpg"
        width={100}
        height={100}
        style={{ width: "50%", height: "75%" }}
        loader={false}
      />,
    );
    await waitForLoad();
    const img = screen.getByRole("img");
    expect(img.style.width).toBe("50%");
    expect(img.style.height).toBe("75%");
  });

  it("renders style props verbatim when width and height are not provided", async () => {
    render(
      <Pixel
        src="/no-dims.jpg"
        style={{ width: "75%", margin: "10px" }}
        loader={false}
      />,
    );
    await waitForLoad();
    const img = screen.getByRole("img");
    expect(img.style.width).toBe("75%");
    expect(img.style.margin).toBe("10px");
  });

  it("sets numeric width/height HTML attributes on img when provided", async () => {
    render(
      <Pixel
        src="/attrs.jpg"
        width={320}
        height={240}
        loader={false}
        avif={false}
        webp={false}
      />,
    );
    const img = await screen.findByRole("img");
    expect(img.getAttribute("width")).toBe("320");
    expect(img.getAttribute("height")).toBe("240");
  });

  it("omits width/height HTML attributes when props are undefined", async () => {
    render(
      <Pixel src="/no-attrs.jpg" loader={false} avif={false} webp={false} />,
    );
    const img = await screen.findByRole("img");
    expect(img.hasAttribute("width")).toBe(false);
    expect(img.hasAttribute("height")).toBe(false);
  });

  it("forwards crossOrigin and referrerPolicy to the preload Image instance", async () => {
    const assignments: Array<{
      crossOrigin: string | null;
      referrerPolicy: string;
    }> = [];

    class TrackingImage {
      private _crossOrigin: string | null = null;
      private _referrerPolicy = "";
      public onload: (() => void) | null = null;
      public onerror: (() => void) | null = null;
      public complete = false;
      public naturalWidth = 0;
      set crossOrigin(value: string | null) {
        this._crossOrigin = value;
      }
      get crossOrigin(): string | null {
        return this._crossOrigin;
      }
      set referrerPolicy(value: string) {
        this._referrerPolicy = value;
      }
      get referrerPolicy(): string {
        return this._referrerPolicy;
      }
      set src(_value: string) {
        assignments.push({
          crossOrigin: this._crossOrigin,
          referrerPolicy: this._referrerPolicy,
        });
        setTimeout(() => this.onload?.(), 0);
      }
    }

    const originalImage = (globalThis as unknown as { Image: typeof Image })
      .Image;
    (globalThis as unknown as { Image: unknown }).Image = TrackingImage;

    try {
      render(
        <Pixel
          src="/cors.jpg"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          avif={false}
          webp={false}
          mimeType="jpeg"
          loader={false}
        />,
      );
      await screen.findByRole("img");
      // Every preload instance must have received the explicit attributes
      // BEFORE the src assignment (so the browser uses them on the fetch).
      expect(assignments.length).toBeGreaterThan(0);
      for (const a of assignments) {
        expect(a.crossOrigin).toBe("anonymous");
        expect(a.referrerPolicy).toBe("no-referrer");
      }
    } finally {
      (globalThis as unknown as { Image: typeof Image }).Image = originalImage;
    }
  });

  describe("Pixel resilience (Task 14)", () => {
    it("survives rapid src changes and renders the final src", async () => {
      // Multiple rerenders in quick succession previously could let an
      // earlier preload "win" via the mounted ref. With cancellation scoped
      // per effect run, only the last src must end up in the DOM.
      const { rerender } = render(
        <Pixel
          src="/rapid1.jpg"
          loader={false}
          avif={false}
          webp={false}
          mimeType="jpeg"
        />,
      );
      rerender(
        <Pixel
          src="/rapid2.jpg"
          loader={false}
          avif={false}
          webp={false}
          mimeType="jpeg"
        />,
      );
      rerender(
        <Pixel
          src="/rapid3.jpg"
          loader={false}
          avif={false}
          webp={false}
          mimeType="jpeg"
        />,
      );
      rerender(
        <Pixel
          src="/rapid4.jpg"
          loader={false}
          avif={false}
          webp={false}
          mimeType="jpeg"
        />,
      );

      await waitFor(() => {
        const img = screen.getByRole("img");
        expect(img.getAttribute("src")).toContain("src=%2Frapid4.jpg");
      });
      const finalImg = screen.getByRole("img");
      // No stale src must win the race even with four back-to-back rerenders.
      expect(finalImg.getAttribute("src")).not.toContain("src=%2Frapid1.jpg");
      expect(finalImg.getAttribute("src")).not.toContain("src=%2Frapid2.jpg");
      expect(finalImg.getAttribute("src")).not.toContain("src=%2Frapid3.jpg");
    });

    it("falls back gracefully when the Image constructor throws (SSR-like)", async () => {
      const originalImage = (globalThis as unknown as { Image: typeof Image })
        .Image;
      // Simulate an environment where calling `new Image()` raises (e.g. a
      // misbehaving SSR polyfill). The preload helper must catch the throw
      // so the component still renders without crashing the test harness.
      (globalThis as unknown as { Image: unknown }).Image = function (): never {
        throw new Error("Image constructor unavailable");
      };
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      try {
        render(
          <Pixel
            src="/throws.jpg"
            avif={false}
            webp={false}
            mimeType="jpeg"
            loader={false}
          />,
        );
        // The component should still surface an <img> via the fallback path
        // (the all-sources-failed branch renders the bundled placeholder).
        const img = await screen.findByRole("img");
        // Either fallback noimage asset is acceptable here — the assertion is
        // that the component recovered to a real <img> tag without throwing.
        expect(img.getAttribute("src")).toBeTruthy();
      } finally {
        consoleSpy.mockRestore();
        (globalThis as unknown as { Image: typeof Image }).Image =
          originalImage;
      }
    });

    it('treats width=0 / height=0 as explicit dimensions (renders 0px and width="0" attribute)', async () => {
      // Documented behavior: width=0 and height=0 are *valid* numbers, not
      // sentinel falsy values. The dimensions branch (`width !== undefined`)
      // fires, the inline style emits "0px", and the HTML attribute is "0".
      // The schema server-side would reject these at the bounds check, but
      // the client component is permissive and forwards them verbatim.
      render(
        <Pixel
          src="/zero.jpg"
          width={0}
          height={0}
          loader={false}
          avif={false}
          webp={false}
          mimeType="jpeg"
        />,
      );
      const img = await screen.findByRole("img");
      expect(img.getAttribute("width")).toBe("0");
      expect(img.getAttribute("height")).toBe("0");
      expect(img.style.width).toBe("0px");
      expect(img.style.height).toBe("0px");
    });
  });

  it("eagerLoad renders picture immediately without preload chain", async () => {
    // Force any accidental preload to fail — the eager path must not run it.
    class HostileImage {
      public onload: (() => void) | null = null;
      public onerror: (() => void) | null = null;
      public complete = false;
      public naturalWidth = 0;
      set src(_value: string) {
        setTimeout(() => this.onerror?.(), 0);
      }
    }
    const originalImage = (globalThis as unknown as { Image: typeof Image })
      .Image;
    (globalThis as unknown as { Image: unknown }).Image = HostileImage;

    try {
      render(
        <Pixel
          src="/eager.jpg"
          eagerLoad
          loader
          width={100}
          height={100}
          avif={true}
          webp={true}
          mimeType="jpeg"
        />,
      );
      // Skeleton must NOT appear because imageLoaded starts true in eagerLoad.
      expect(
        screen.queryByRole("presentation", { hidden: true }),
      ).not.toBeInTheDocument();
      // Picture + <source> elements must be in the DOM straight away.
      const picture = document.querySelector("picture");
      expect(picture).toBeInTheDocument();
      const img = screen.getByRole("img");
      expect(img.getAttribute("src")).toContain("src=%2Feager.jpg");
    } finally {
      (globalThis as unknown as { Image: typeof Image }).Image = originalImage;
    }
  });
});

afterEach(() => {
  // Reset any per-test mutations to globals.
  vi.restoreAllMocks();
});

describe("helpers", () => {
  it("builds pixel urls and sources with defaults", () => {
    const url = buildPixelUrl({ src: "/foo.jpg" });
    expect(url).toContain("src=%2Ffoo.jpg");
    expect(url).toContain("folder=public");

    const sources = buildPixelSources({ src: "/foo.jpg" });
    expect(sources.find((s) => s.type === "image/avif")).toBeDefined();
    expect(sources.find((s) => s.type === "image/webp")).toBeDefined();
  });

  it("builds sources respecting format toggles and user params", () => {
    const sources = buildPixelSources({
      src: "/bar.png",
      avif: false,
      webp: false,
      mimeType: "png",
      userId: "u1",
      folder: "private",
    });
    expect(sources).toHaveLength(1);
    expect(sources[0].type).toBe("image/png");

    const url = buildPixelUrl({
      src: "/bar.png",
      userId: "u1",
      folder: "private",
    });
    expect(url).toContain("userId=u1");
    expect(url).toContain("folder=private");
  });

  it("builds pixel url with dimensions and quality", () => {
    const url = buildPixelUrl({
      src: "/baz.jpg",
      width: 800,
      height: 600,
      quality: 90,
      format: "webp",
    });
    expect(url).toContain("width=800");
    expect(url).toContain("height=600");
    expect(url).toContain("quality=90");
    expect(url).toContain("format=webp");
  });

  it("builds avatar fallbacks and direct source", () => {
    const avatarSources = buildPixelSources({
      src: "/avatar.jpg",
      type: "avatar",
      avif: true,
      webp: true,
      mimeType: "jpeg",
    });
    expect(avatarSources.some((s) => s.type === "image/avif")).toBe(true);
    const directSources = buildPixelSources({
      src: "/only.jpg",
      direct: true,
      mimeType: "png",
    });
    expect(directSources).toHaveLength(1);
    expect(directSources[0].type).toBe("image/png");
  });
});

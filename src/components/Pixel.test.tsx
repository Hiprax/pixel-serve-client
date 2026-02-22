import { describe, expect, it, vi } from "vitest";
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
      />
    );

    expect(
      screen.getByRole("presentation", { hidden: true })
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
      />
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
      />
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
      />
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
      />
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
      />
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
      <Pixel src="/image.jpg" style={{ borderRadius: "10px" }} loader={false} />
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
      />
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
      />
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
      />
    );
    await waitForLoad();
    const img = screen.getByRole("img");
    expect(img.getAttribute("data-testid")).toBe("custom-id");
    expect(img.getAttribute("title")).toBe("Image title");
  });

  it("renders skeleton with correct dimensions", () => {
    render(
      <Pixel src="/loading-image.jpg" width={300} height={200} loader={true} />
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
      />
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

  it("cleans up on unmount without errors", async () => {
    const consoleSpy = vi.spyOn(console, "error");
    const { unmount } = render(<Pixel src="/image.jpg" loader={false} />);
    await waitForLoad();
    unmount();
    // Verify no React state-update-after-unmount warnings
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("re-renders with new sources when src prop changes", async () => {
    const { rerender } = render(
      <Pixel src="/image1.jpg" loader={false} avif={false} webp={false} mimeType="jpeg" />
    );
    const img1 = await screen.findByRole("img");
    expect(img1.getAttribute("src")).toContain("src=%2Fimage1.jpg");

    rerender(
      <Pixel src="/image2.jpg" loader={false} avif={false} webp={false} mimeType="jpeg" />
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
      />
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
      />
    );
    await waitForLoad();
    const img = screen.getByRole("img");
    expect(img.style.width).not.toBe("300px");
    expect(img.style.height).not.toBe("200px");
  });

  it("renders direct mode with data URL", async () => {
    const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
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
      />
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
      />
    );
    await waitForLoad();
    const picture = document.querySelector("picture");
    expect(picture).toBeInTheDocument();
    const sources = picture?.querySelectorAll("source");
    expect(sources?.length).toBeGreaterThanOrEqual(2);
  });

  it("passes onClick handler to img element", async () => {
    const handleClick = vi.fn();
    render(
      <Pixel src="/image.jpg" onClick={handleClick} loader={false} />
    );
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
      />
    );
    const img = await screen.findByRole("img");
    // fallbackSrc should be used in the URL, not original src
    expect(img.getAttribute("src")).toContain("src=%2Foverride.jpg");
    expect(img.getAttribute("src")).not.toContain("src=%2Foriginal.jpg");
  });

  it("hides image with 1px dimensions while loading", () => {
    render(
      <Pixel src="/loading-image.jpg" width={300} height={200} loader={true} />
    );
    // While loading, image should not be visible (no img role yet or hidden)
    const imgs = screen.queryAllByRole("img");
    // No img should be rendered yet since displayedSrcSet is empty
    expect(imgs.length).toBe(0);
  });

  it("onError handler triggers fallback for normal type", async () => {
    render(
      <Pixel
        src="/will-error.jpg"
        direct
        loader={false}
        type="normal"
      />
    );
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
      />
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

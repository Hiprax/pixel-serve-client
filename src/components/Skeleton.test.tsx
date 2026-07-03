import { describe, expect, it, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";
import Skeleton from "./Skeleton";

describe("Skeleton", () => {
  beforeEach(() => {
    // Clean up any existing style tags between tests
    const existingStyle = document.getElementById("pixel-serve-skeleton-style");
    if (existingStyle) {
      existingStyle.remove();
    }
  });

  it("renders with default rect style", () => {
    const { container } = render(<Skeleton width={50} height={20} />);
    const div = container.querySelector(
      ".pixel-serve-skeleton",
    ) as HTMLDivElement | null;
    expect(div).toBeInTheDocument();
    expect(div?.style.width).toBe("50px");
    expect(div?.style.height).toBe("20px");
    expect(div?.style.borderRadius).toBe("4px");
  });

  it("reuses injected styles without duplicating tag", () => {
    render(<Skeleton width={10} height={10} />);
    const initialStyleCount = document.querySelectorAll(
      "#pixel-serve-skeleton-style",
    ).length;
    expect(initialStyleCount).toBe(1);

    render(<Skeleton width={12} height={12} />);
    const newStyleCount = document.querySelectorAll(
      "#pixel-serve-skeleton-style",
    ).length;
    expect(newStyleCount).toBe(1);
  });

  it("renders circle with background positioning", () => {
    const { container } = render(
      <Skeleton
        width={40}
        height={40}
        isCircle
        background
        className="custom-class"
      />,
    );
    const div = container.querySelector(
      ".pixel-serve-skeleton",
    ) as HTMLDivElement | null;
    expect(div?.style.borderRadius).toBe("50%");
    expect(div?.style.position).toBe("absolute");
    expect(div?.style.inset).toMatch(/^0(px)?$/);
    expect(div?.className.includes("custom-class")).toBe(true);
  });

  it("renders with string width and height", () => {
    const { container } = render(<Skeleton width="100%" height="50vh" />);
    const div = container.querySelector(
      ".pixel-serve-skeleton",
    ) as HTMLDivElement | null;
    expect(div?.style.width).toBe("100%");
    expect(div?.style.height).toBe("50vh");
  });

  it("renders without background class when not background mode", () => {
    const { container } = render(
      <Skeleton width={100} height={100} background={false} />,
    );
    const div = container.querySelector(
      ".pixel-serve-skeleton",
    ) as HTMLDivElement | null;
    expect(div?.style.position).toBe("");
    expect(div?.style.inset).toBe("");
  });

  it("renders without isCircle for rect shape", () => {
    const { container } = render(
      <Skeleton width={100} height={50} isCircle={false} />,
    );
    const div = container.querySelector(
      ".pixel-serve-skeleton",
    ) as HTMLDivElement | null;
    expect(div?.style.borderRadius).toBe("4px");
  });

  it("has correct accessibility attributes", () => {
    const { container } = render(<Skeleton width={100} height={100} />);
    const div = container.querySelector(
      ".pixel-serve-skeleton",
    ) as HTMLDivElement | null;
    expect(div?.getAttribute("role")).toBe("presentation");
    expect(div?.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders without custom className", () => {
    const { container } = render(<Skeleton width={100} height={100} />);
    const div = container.querySelector(
      ".pixel-serve-skeleton",
    ) as HTMLDivElement | null;
    expect(div?.className).toBe("pixel-serve-skeleton");
  });

  it("applies zIndex when in background mode", () => {
    const { container } = render(
      <Skeleton width={100} height={100} background />,
    );
    const div = container.querySelector(
      ".pixel-serve-skeleton",
    ) as HTMLDivElement | null;
    expect(div?.style.zIndex).toBe("0");
  });

  it("skips style injection when document is unavailable (ensureStyles SSR guard)", () => {
    // React resolves the owner document for new host nodes from
    // `container.ownerDocument` (this is how it supports rendering into
    // iframes/other documents) rather than by re-reading the bare
    // `document` global at mount time. So we can build the container
    // against the real jsdom document first, then stub `document` away,
    // and the mount below still succeeds while ensureStyles()'s own
    // `typeof document === "undefined"` check flips true.
    //
    // If the guard failed to return early here, the very next line inside
    // ensureStyles (`document.getElementById(...)`) would throw a
    // ReferenceError from inside the effect and this render would throw
    // too - so a clean, non-throwing render is direct evidence the guard
    // fired, not just incidental coverage.
    const container = document.createElement("div");
    document.body.appendChild(container);

    try {
      vi.stubGlobal("document", undefined);
      render(<Skeleton width={10} height={10} />, { container });
    } finally {
      // Restore unconditionally - even if render() or an assertion above
      // throws - so a stubbed-out `document` can never leak into later
      // tests.
      vi.unstubAllGlobals();
    }

    const div = container.querySelector(
      ".pixel-serve-skeleton",
    ) as HTMLDivElement | null;
    expect(div).toBeInTheDocument();
    expect(document.getElementById("pixel-serve-skeleton-style")).toBeNull();
  });
});

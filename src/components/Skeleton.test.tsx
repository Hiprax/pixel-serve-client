import { describe, expect, it, beforeEach } from "vitest";
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
      ".pixel-serve-skeleton"
    ) as HTMLDivElement | null;
    expect(div).toBeInTheDocument();
    expect(div?.style.width).toBe("50px");
    expect(div?.style.height).toBe("20px");
    expect(div?.style.borderRadius).toBe("4px");
  });

  it("reuses injected styles without duplicating tag", () => {
    render(<Skeleton width={10} height={10} />);
    const initialStyleCount = document.querySelectorAll(
      "#pixel-serve-skeleton-style"
    ).length;
    expect(initialStyleCount).toBe(1);

    render(<Skeleton width={12} height={12} />);
    const newStyleCount = document.querySelectorAll(
      "#pixel-serve-skeleton-style"
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
      />
    );
    const div = container.querySelector(
      ".pixel-serve-skeleton"
    ) as HTMLDivElement | null;
    expect(div?.style.borderRadius).toBe("50%");
    expect(div?.style.position).toBe("absolute");
    expect(div?.style.inset).toMatch(/^0(px)?$/);
    expect(div?.className.includes("custom-class")).toBe(true);
  });

  it("renders with string width and height", () => {
    const { container } = render(<Skeleton width="100%" height="50vh" />);
    const div = container.querySelector(
      ".pixel-serve-skeleton"
    ) as HTMLDivElement | null;
    expect(div?.style.width).toBe("100%");
    expect(div?.style.height).toBe("50vh");
  });

  it("renders without background class when not background mode", () => {
    const { container } = render(
      <Skeleton width={100} height={100} background={false} />
    );
    const div = container.querySelector(
      ".pixel-serve-skeleton"
    ) as HTMLDivElement | null;
    expect(div?.style.position).toBe("");
    expect(div?.style.inset).toBe("");
  });

  it("renders without isCircle for rect shape", () => {
    const { container } = render(
      <Skeleton width={100} height={50} isCircle={false} />
    );
    const div = container.querySelector(
      ".pixel-serve-skeleton"
    ) as HTMLDivElement | null;
    expect(div?.style.borderRadius).toBe("4px");
  });

  it("has correct accessibility attributes", () => {
    const { container } = render(<Skeleton width={100} height={100} />);
    const div = container.querySelector(
      ".pixel-serve-skeleton"
    ) as HTMLDivElement | null;
    expect(div?.getAttribute("role")).toBe("presentation");
    expect(div?.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders without custom className", () => {
    const { container } = render(<Skeleton width={100} height={100} />);
    const div = container.querySelector(
      ".pixel-serve-skeleton"
    ) as HTMLDivElement | null;
    expect(div?.className).toBe("pixel-serve-skeleton");
  });

  it("applies zIndex when in background mode", () => {
    const { container } = render(
      <Skeleton width={100} height={100} background />
    );
    const div = container.querySelector(
      ".pixel-serve-skeleton"
    ) as HTMLDivElement | null;
    expect(div?.style.zIndex).toBe("0");
  });
});

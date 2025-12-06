import { useEffect, type CSSProperties, type FC } from "react";

type SkeletonProps = {
  width: string | number;
  height: string | number;
  isCircle?: boolean;
  background?: boolean;
  className?: string;
};

const styleTagId = "pixel-serve-skeleton-style";

const ensureStyles = (): void => {
  if (typeof document === "undefined") return;
  if (document.getElementById(styleTagId)) return;
  const style = document.createElement("style");
  style.id = styleTagId;
  style.textContent = `
    @keyframes pixelServeShimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .pixel-serve-skeleton {
      background: linear-gradient(90deg, #eee 25%, #ddd 50%, #eee 75%);
      background-size: 200% 100%;
      animation: pixelServeShimmer 1.5s infinite linear;
      border-radius: 4px;
    }
  `;
  document.head.appendChild(style);
};

const Skeleton: FC<SkeletonProps> = ({
  width,
  height,
  isCircle,
  background,
  className,
}) => {
  useEffect(() => {
    ensureStyles();
  }, []);

  const style: CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    borderRadius: isCircle ? "50%" : "4px",
    position: background ? "absolute" : undefined,
    inset: background ? 0 : undefined,
    zIndex: background ? 0 : undefined,
  };

  return (
    <div
      className={`pixel-serve-skeleton${className ? ` ${className}` : ""}`}
      style={style}
      role="presentation"
      aria-hidden="true"
    />
  );
};

export default Skeleton;

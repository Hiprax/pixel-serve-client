/** @jsxImportSource @emotion/react */
import { FC } from "react";
import { css, keyframes } from "@emotion/react";
import styled from "@emotion/styled";

const SkeletonAnimation = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

const SkeletonDiv = styled.div`
  background: #ccc;
  background: linear-gradient(90deg, #eee 25%, #ddd 50%, #eee 75%);
  background-size: 200% 100%;
  animation: ${SkeletonAnimation} 1.5s infinite linear;
  border-radius: 4px;
`;

interface SkeletonProps {
  width: string | number;
  height: string | number;
  borderRadius?: string | number;
  className?: string;
  customCss?: ReturnType<typeof css> | string;
}

const Skeleton: FC<SkeletonProps> = ({
  width,
  height,
  borderRadius,
  className,
  customCss,
}) => {
  return (
    <SkeletonDiv
      className={className}
      css={css`
        width: ${typeof width === "number" ? `${width}px` : width};
        height: ${typeof height === "number" ? `${height}px` : height};
        border-radius: ${typeof borderRadius === "number"
          ? `${borderRadius}px`
          : borderRadius};
        ${customCss}
      `}
    />
  );
};

export default Skeleton;

import { useState, useRef, useEffect, memo, CSSProperties } from "react";
import type { JSX } from "@emotion/react/jsx-runtime";
import type { PixelProps } from "../types";
import Skeleton from "./Skeleton";
import { srcGenerator, getMimeType } from "../functions";

const NotFoundAvif = new URL("../assets/noimage.avif", import.meta.url).href;
const NotFoundWebp = new URL("../assets/noimage.webp", import.meta.url).href;
const NotFoundJpg = new URL("../assets/noimage.jpg", import.meta.url).href;

const NoAvatarAvif = new URL("../assets/noavatar.avif", import.meta.url).href;
const NoAvatarWebp = new URL("../assets/noavatar.webp", import.meta.url).href;
const NoAvatarPng = new URL("../assets/noavatar.png", import.meta.url).href;

/**
 * Pixel component for displaying images with support for multiple formats and lazy loading.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {string} props.src - The source URL of the image.
 * @param {string} [props.className] - The CSS class for the component.
 * @param {string} [props.alt="image"] - The alt text for the image.
 * @param {Object} [props.style] - Inline styles for the component.
 * @param {boolean} [props.background=false] - Whether the image is used as a background.
 * @param {boolean} [props.lazy=true] - Whether to lazy load the image.
 * @param {number} [props.width] - The width of the image.
 * @param {number} [props.height] - The height of the image.
 * @param {number} [props.quality] - The quality of the image.
 * @param {string} [props.userId] - The user ID of the image owner.
 * @param {boolean} [props.avif=true] - Whether to support AVIF format.
 * @param {boolean} [props.webp=true] - Whether to support WebP format.
 * @param {string} [props.mimeType="jpeg"] - The MIME type of the image.
 * @param {boolean} [props.direct=false] - Whether to directly load the image without conversion.
 * @param {boolean} [props.loader=true] - Whether to display a loading skeleton.
 * @param {boolean} [props.dynamicDimension=false] - Whether the image dimensions are dynamic.
 * @param {string} [props.backendUrl="/api/v1/pixel/serve"] - The backend URL for the image.
 * @param {string} [props.folder="public"] - The folder where the image is stored.
 * @param {string} [props.type="normal"] - The type of image (e.g., 'normal', 'avatar').
 * @returns {JSX.Element} The rendered component.
 */
const Pixel = memo(
  ({
    src,
    className,
    alt = "image",
    style = {},
    background = false,
    lazy = true,
    width,
    height,
    quality,
    userId,
    avif = true,
    webp = true,
    mimeType = "jpeg",
    direct = false,
    loader = true,
    dynamicDimension = false,
    backendUrl = "/api/v1/pixel/serve",
    folder = "public",
    type = "normal",
    ...props
  }: PixelProps): JSX.Element => {
    const [displayedSrcSet, setDisplayedSrcSet] = useState<
      { src: string; type: string }[]
    >([]);
    const [imageLoaded, setImageLoaded] = useState(false);
    const isFirstRender = useRef(true);

    useEffect(() => {
      let isCancelled = false;

      const generateSrcSet = (): { src: string; type: string }[] => {
        const newSrcSet: { src: string; type: string }[] = [];
        if (!direct) {
          if (avif) {
            newSrcSet.push({
              src: srcGenerator({
                src,
                width,
                height,
                quality,
                format: "avif",
                userId,
                folder,
                type,
              }),
              type: "image/avif",
            });
          }
          if (webp) {
            newSrcSet.push({
              src: srcGenerator({
                src,
                width,
                height,
                quality,
                format: "webp",
                userId,
                folder,
                type,
              }),
              type: "image/webp",
            });
          }
          newSrcSet.push({
            src: srcGenerator({
              src,
              width,
              height,
              quality,
              format: mimeType,
              userId,
              folder,
              type,
            }),
            type: getMimeType(mimeType),
          });
        }
        return newSrcSet;
      };

      if (isFirstRender.current) {
        isFirstRender.current = false;
        const initialSrcSet = generateSrcSet();
        setDisplayedSrcSet(initialSrcSet);
        setImageLoaded(true);
      } else {
        setImageLoaded(false);
        const newSrcSet = generateSrcSet();

        const preloadImages = newSrcSet.map((source) => {
          return new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.src = source.src;
            img.onload = () => resolve();
            img.onerror = (e) =>
              reject(new Error(`Failed to load image: ${source.src}`));
          });
        });

        Promise.all(preloadImages)
          .then(() => {
            if (!isCancelled) {
              setDisplayedSrcSet(newSrcSet);
              setImageLoaded(true);
            }
          })
          .catch(() => {
            if (!isCancelled) {
              const placeholderSrcSet: { src: string; type: string }[] = [];
              if (avif) {
                placeholderSrcSet.push({
                  src: type === "avatar" ? NoAvatarAvif : NotFoundAvif,
                  type: "image/avif",
                });
              }
              if (webp) {
                placeholderSrcSet.push({
                  src: type === "avatar" ? NoAvatarWebp : NotFoundWebp,
                  type: "image/webp",
                });
              }
              placeholderSrcSet.push({
                src: type === "avatar" ? NoAvatarPng : NotFoundJpg,
                type: type === "avatar" ? "image/png" : "image/jpeg",
              });

              setDisplayedSrcSet(placeholderSrcSet);
              setImageLoaded(true);
            }
          });
      }

      return () => {
        isCancelled = true;
      };
    }, [
      src,
      width,
      height,
      quality,
      mimeType,
      avif,
      webp,
      direct,
      folder,
      type,
      userId,
    ]);

    const backgroundStyles: CSSProperties = {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "center",
      zIndex: -1,
    };

    const imageStyle: CSSProperties = {
      ...((width || height) && !dynamicDimension
        ? {
            width: width ? `${width}px` : "auto",
            height: height ? `${height}px` : "auto",
            ...style,
          }
        : { ...style }),
      ...(background ? backgroundStyles : {}),
    };

    return (
      <>
        {!imageLoaded && loader ? (
          <Skeleton
            customCss={
              background
                ? `position: absolute;top: 0;right:0;bottom:0;left:0;z-index:0;${
                    type === "avatar" ? "border-radius:50%;" : ""
                  }`
                : `${type === "avatar" ? "border-radius:50%;" : ""}`
            }
            width={width ? `${width}px` : "100%"}
            height={height ? `${height}px` : "100%"}
          />
        ) : null}
        {direct ? (
          <img
            className={className}
            alt={alt}
            src={
              displayedSrcSet.length
                ? displayedSrcSet[displayedSrcSet.length - 1].src
                : src
            }
            style={imageLoaded ? imageStyle : { width: "1px", height: "1px" }}
            loading={lazy ? "lazy" : "eager"}
            {...props}
          />
        ) : displayedSrcSet && displayedSrcSet.length ? (
          <picture
            className={className}
            style={imageLoaded ? imageStyle : { width: "1px", height: "1px" }}
          >
            {displayedSrcSet.map((source, index) => (
              <source key={index} srcSet={source.src} type={source.type} />
            ))}
            <img
              className={className}
              alt={alt}
              src={displayedSrcSet[displayedSrcSet.length - 1].src}
              style={imageLoaded ? imageStyle : { width: "1px", height: "1px" }}
              loading={lazy ? "lazy" : "eager"}
              {...props}
            />
          </picture>
        ) : null}
      </>
    );
  }
);

Pixel.displayName = "Pixel";

export default Pixel;

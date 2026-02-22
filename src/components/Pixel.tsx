import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
  type CSSProperties,
} from "react";
import type { JSX } from "react";
import type { PixelProps, PixelSource } from "../types";
import Skeleton from "./Skeleton";
import { buildPixelSources } from "../functions";

import noimageAvif from "../assets/noimage.avif";
import noimageWebp from "../assets/noimage.webp";
import noimageJpg from "../assets/noimage.jpg";
import noavatarAvif from "../assets/noavatar.avif";
import noavatarWebp from "../assets/noavatar.webp";
import noavatarPng from "../assets/noavatar.png";

const getFallbackSources = (
  type: PixelProps["type"],
  avif: boolean,
  webp: boolean
): PixelSource[] => {
  const sources: PixelSource[] = [];
  if (avif) {
    sources.push({
      src: type === "avatar" ? noavatarAvif : noimageAvif,
      type: "image/avif",
    });
  }
  if (webp) {
    sources.push({
      src: type === "avatar" ? noavatarWebp : noimageWebp,
      type: "image/webp",
    });
  }
  sources.push({
    src: type === "avatar" ? noavatarPng : noimageJpg,
    type: type === "avatar" ? "image/png" : "image/jpeg",
  });
  return sources;
};

const preload = (source: PixelSource): Promise<void> => {
  if (typeof Image === "undefined") {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = source.src;
    img.onload = (): void => resolve();
    img.onerror = (): void =>
      reject(new Error(`Failed to load image: ${source.src}`));
  });
};

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
    fallbackSrc,
    ...props
  }: PixelProps): JSX.Element => {
    const [displayedSrcSet, setDisplayedSrcSet] = useState<PixelSource[]>([]);
    const [imageLoaded, setImageLoaded] = useState(false);
    const mounted = useRef(false);

    const desiredSources = useMemo(
      () =>
        buildPixelSources({
          src: fallbackSrc ?? src,
          width,
          height,
          quality,
          userId,
          backendUrl,
          folder,
          type,
          direct,
          avif,
          webp,
          mimeType,
        }),
      [
        src,
        width,
        height,
        quality,
        userId,
        backendUrl,
        folder,
        type,
        direct,
        avif,
        webp,
        mimeType,
        fallbackSrc,
      ]
    );

    useEffect(() => {
      mounted.current = true;
      const run = async (): Promise<void> => {
        setImageLoaded(false);
        const results = await Promise.allSettled(desiredSources.map(preload));
        if (!mounted.current) return;

        const successfulSources = desiredSources.filter(
          (_, i) => results[i].status === "fulfilled"
        );

        if (successfulSources.length > 0) {
          setDisplayedSrcSet(successfulSources);
        } else {
          setDisplayedSrcSet(
            getFallbackSources(type, avif, webp)
          );
        }
        setImageLoaded(true);
      };

      void run();
      return (): void => {
        mounted.current = false;
      };
    }, [desiredSources, type, avif, webp, mimeType]);

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

    const handleImgError = useCallback((): void => {
      const fallbacks = getFallbackSources(type, avif, webp);
      const lastFallback = fallbacks[fallbacks.length - 1];
      if (lastFallback) {
        setDisplayedSrcSet([lastFallback]);
      }
    }, [type, avif, webp]);

    const renderImage = (sourceList: PixelSource[]): JSX.Element | null => {
      if (!sourceList.length) return null;
      const fallback = sourceList[sourceList.length - 1]?.src ?? src;

      if (direct || sourceList.length === 1) {
        return (
          <img
            className={className}
            alt={alt}
            src={fallback}
            style={imageLoaded ? imageStyle : { width: "1px", height: "1px" }}
            loading={lazy ? "lazy" : "eager"}
            onError={handleImgError}
            {...props}
          />
        );
      }

      return (
        <picture
          className={className}
          style={imageLoaded ? imageStyle : { width: "1px", height: "1px" }}
        >
          {sourceList.map((source) => (
            <source key={source.type} srcSet={source.src} type={source.type} />
          ))}
          <img
            className={className}
            alt={alt}
            src={fallback}
            style={imageLoaded ? imageStyle : { width: "1px", height: "1px" }}
            loading={lazy ? "lazy" : "eager"}
            onError={handleImgError}
            {...props}
          />
        </picture>
      );
    };

    return (
      <>
        {!imageLoaded && loader ? (
          <Skeleton
            isCircle={type === "avatar"}
            width={width ? `${width}px` : "100%"}
            height={height ? `${height}px` : "100%"}
            background={background}
          />
        ) : null}
        {renderImage(displayedSrcSet)}
      </>
    );
  }
);

Pixel.displayName = "Pixel";

export default Pixel;

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  memo,
  type CSSProperties,
} from "react";
import type { ReactElement, SyntheticEvent } from "react";
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
  webp: boolean,
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

type PreloadAttributes = {
  crossOrigin?: PixelProps["crossOrigin"];
  referrerPolicy?: PixelProps["referrerPolicy"];
};

const preload = (
  source: PixelSource,
  attrs: PreloadAttributes = {},
): Promise<void> => {
  if (typeof Image === "undefined") {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (attrs.crossOrigin) img.crossOrigin = attrs.crossOrigin;
    if (attrs.referrerPolicy) img.referrerPolicy = attrs.referrerPolicy;
    img.onload = (): void => resolve();
    img.onerror = (): void =>
      reject(new Error(`Failed to load image: ${source.src}`));
    img.src = source.src;
    // If the browser already has the image cached, `complete` flips to true
    // synchronously after assigning `src`. Resolve immediately to avoid a
    // skeleton flash for cached images.
    if (img.complete && img.naturalWidth > 0) {
      resolve();
    }
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
    eagerLoad = false,
    dynamicDimension = false,
    backendUrl = "/api/v1/pixel/serve",
    folder = "public",
    type = "normal",
    fallbackSrc,
    crossOrigin,
    referrerPolicy,
    onError: userOnError,
    loading,
    ...rest
  }: PixelProps): ReactElement => {
    // `format` is no longer part of the public PixelProps type (`mimeType` is
    // the one functional format prop — see types.ts), but an untyped caller
    // can still pass it at runtime. Strip it defensively so it can never
    // reach `...props` and leak onto the DOM <img> below.
    const { format: _format, ...props } = rest as typeof rest & {
      format?: unknown;
    };
    void _format;

    const [displayedSrcSet, setDisplayedSrcSet] = useState<PixelSource[]>(() =>
      eagerLoad
        ? buildPixelSources({
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
          })
        : [],
    );
    const [imageLoaded, setImageLoaded] = useState(eagerLoad);

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
      ],
    );

    useEffect(() => {
      // eagerLoad skips the per-format preload chain entirely. The component
      // renders <picture> directly using `desiredSources` and relies on the
      // native onError handler for fallbacks. Tradeoff: format-by-format
      // success detection is not available in this mode.
      if (eagerLoad) {
        setDisplayedSrcSet(desiredSources);
        setImageLoaded(true);
        return;
      }

      let cancelled = false;
      const run = async (): Promise<void> => {
        setImageLoaded(false);
        const results = await Promise.allSettled(
          desiredSources.map((source) =>
            preload(source, { crossOrigin, referrerPolicy }),
          ),
        );
        if (cancelled) return;

        const successfulSources = desiredSources.filter(
          (_, i) => results[i].status === "fulfilled",
        );

        if (successfulSources.length > 0) {
          setDisplayedSrcSet(successfulSources);
        } else {
          setDisplayedSrcSet(getFallbackSources(type, avif, webp));
        }
        setImageLoaded(true);
      };

      void run();
      return (): void => {
        cancelled = true;
      };
      // `desiredSources` is the sole dependency: it is a memoized reference
      // that already encodes every input which affects preloading (src,
      // width, height, quality, userId, backendUrl, folder, type, direct,
      // avif, webp, mimeType, fallbackSrc). `eagerLoad`, `crossOrigin`, and
      // `referrerPolicy` are intentionally captured at effect-run time —
      // changing them mid-lifecycle is not a supported workflow.
    }, [desiredSources]);

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

    const hasExplicitDimensions = width !== undefined || height !== undefined;

    const imageStyle: CSSProperties = {
      ...(hasExplicitDimensions && !dynamicDimension
        ? {
            width: width !== undefined ? `${width}px` : "auto",
            height: height !== undefined ? `${height}px` : "auto",
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

    // Composes the internal graceful-fallback handler with any caller-supplied
    // `onError`. Both `<img>` elements below render this instead of
    // `handleImgError` directly and spread `{...props}` after it — since
    // `onError` is destructured out of `props`, the caller's handler can no
    // longer clobber the internal fallback (it now always runs first).
    const onImgError = useCallback(
      (event: SyntheticEvent<HTMLImageElement>): void => {
        handleImgError();
        userOnError?.(event);
      },
      [handleImgError, userOnError],
    );

    const renderImage = (sourceList: PixelSource[]): ReactElement | null => {
      if (!sourceList.length) return null;
      const fallback = sourceList[sourceList.length - 1]?.src ?? src;

      if (direct || sourceList.length === 1) {
        return (
          <img
            className={className}
            alt={alt}
            src={fallback}
            {...(width !== undefined ? { width } : {})}
            {...(height !== undefined ? { height } : {})}
            {...(crossOrigin ? { crossOrigin } : {})}
            {...(referrerPolicy ? { referrerPolicy } : {})}
            style={imageLoaded ? imageStyle : { width: "1px", height: "1px" }}
            loading={loading ?? (lazy ? "lazy" : "eager")}
            onError={onImgError}
            {...props}
          />
        );
      }

      return (
        <picture style={{ display: "contents" }}>
          {sourceList.map((source) => (
            <source key={source.type} srcSet={source.src} type={source.type} />
          ))}
          <img
            className={className}
            alt={alt}
            src={fallback}
            {...(width !== undefined ? { width } : {})}
            {...(height !== undefined ? { height } : {})}
            {...(crossOrigin ? { crossOrigin } : {})}
            {...(referrerPolicy ? { referrerPolicy } : {})}
            style={imageLoaded ? imageStyle : { width: "1px", height: "1px" }}
            loading={loading ?? (lazy ? "lazy" : "eager")}
            onError={onImgError}
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
  },
);

Pixel.displayName = "Pixel";

export default Pixel;

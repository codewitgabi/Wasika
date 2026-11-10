"use client";

import { useState } from "react";

type Props = {
  cutoutUrl: string;
  portraitUrl: string;
  alt: string;
  width: number;
  height: number;
};

/**
 * Shows the cut-out postcard, and falls back to the portrait style if the
 * cut-out fails to render (e.g. background removal errors on this selfie).
 */
export function PostcardImage({ cutoutUrl, portraitUrl, alt, width, height }: Props) {
  const [src, setSrc] = useState(cutoutUrl);

  return (
    // Cloudinary already resizes and picks the format (f_auto,q_auto), so
    // next/image's optimizer would only add a second, redundant pass.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className="block h-auto w-full shadow-[0_24px_48px_-20px_rgb(59_36_18/0.45)]"
      onError={() => {
        if (src !== portraitUrl) setSrc(portraitUrl);
      }}
    />
  );
}

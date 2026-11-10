"use client";

import { useState } from "react";

/** The cut-out image and its portrait-style fallback, for one light. */
export type PostcardSources = { cutout: string; portrait: string };

type Props = {
  day: PostcardSources;
  /** Present only when the landmark has a golden-hour photo. */
  golden?: PostcardSources;
  alt: string;
  width: number;
  height: number;
};

type Light = "day" | "golden";

/**
 * Shows the postcard, with an optional Daylight / Golden hour switch. Falls
 * back to the portrait style if a cut-out fails to render (e.g. background
 * removal errors on this selfie). The golden version is only requested once
 * someone picks it, so it costs nothing until it's viewed.
 */
export function PostcardImage({ day, golden, alt, width, height }: Props) {
  const [light, setLight] = useState<Light>("day");
  const [failed, setFailed] = useState<Record<Light, boolean>>({ day: false, golden: false });

  const sources = light === "golden" && golden ? golden : day;
  const src = failed[light] ? sources.portrait : sources.cutout;

  return (
    <div className="flex flex-col gap-3">
      {golden && (
        <div role="group" aria-label="Light" className="flex self-start rounded-sm bg-earth/10 p-1">
          {(["day", "golden"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={light === option}
              onClick={() => setLight(option)}
              className={`rounded-[3px] px-4 py-1.5 text-sm font-bold transition-colors ${
                light === option ? "bg-card text-indigo shadow-sm" : "text-earth hover:bg-earth/10"
              }`}
            >
              {option === "day" ? "Daylight" : "Golden hour"}
            </button>
          ))}
        </div>
      )}
      {/* Cloudinary already resizes and picks the format (f_auto,q_auto), so
          next/image's optimizer would only add a second, redundant pass. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={light}
        src={src}
        alt={light === "golden" ? `${alt}, at golden hour` : alt}
        width={width}
        height={height}
        className="block h-auto w-full bg-earth/10 shadow-[0_24px_48px_-20px_rgb(59_36_18/0.45)]"
        onError={() => {
          if (!failed[light]) setFailed((f) => ({ ...f, [light]: true }));
        }}
      />
    </div>
  );
}

"use client";

import { useState } from "react";

/** The postcard for one light: cut-out image, portrait fallback and video. */
export type PostcardSources = {
  cutout: string;
  portrait: string;
  video: string;
  videoDownload: string;
};

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
 * Shows the postcard, with an optional Daylight / Golden hour switch and a
 * "Play as video" toggle. Falls back to the portrait style if a cut-out fails
 * to render. Golden hour and video are only requested once someone picks
 * them, so they cost nothing until they're viewed.
 */
export function PostcardImage({ day, golden, alt, width, height }: Props) {
  const [light, setLight] = useState<Light>("day");
  const [video, setVideo] = useState(false);
  const [failed, setFailed] = useState<Record<Light, boolean>>({ day: false, golden: false });

  const sources = light === "golden" && golden ? golden : day;
  const src = failed[light] ? sources.portrait : sources.cutout;
  const description = light === "golden" ? `${alt}, at golden hour` : alt;
  const frame = "block h-auto w-full bg-earth/10 shadow-[0_24px_48px_-20px_rgb(59_36_18/0.45)]";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {golden && (
          <div role="group" aria-label="Light" className="flex rounded-sm bg-earth/10 p-1">
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
        <button
          type="button"
          aria-pressed={video}
          onClick={() => setVideo((v) => !v)}
          className={`rounded-sm px-4 py-2 text-sm font-bold transition-colors ${
            video ? "bg-card text-indigo shadow-sm" : "bg-earth/10 text-earth hover:bg-earth/15"
          }`}
        >
          {video ? "Show photo" : "Play as video"}
        </button>
      </div>

      {video ? (
        <>
          <video
            key={`video-${light}`}
            src={sources.video}
            poster={src}
            width={width}
            height={height}
            autoPlay
            muted
            loop
            playsInline
            controls
            aria-label={`${description}, as a short video`}
            className={frame}
          />
          <p className="text-sm text-earth/85">
            The first play can take a few seconds while the video is made.{" "}
            <a
              href={sources.videoDownload}
              className="font-bold text-earth underline underline-offset-4"
            >
              Download the video
            </a>{" "}
            to send it on WhatsApp.
          </p>
        </>
      ) : (
        // Cloudinary already resizes and picks the format (f_auto,q_auto), so
        // next/image's optimizer would only add a second, redundant pass.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`image-${light}`}
          src={src}
          alt={description}
          width={width}
          height={height}
          className={frame}
          onError={() => {
            if (!failed[light]) setFailed((f) => ({ ...f, [light]: true }));
          }}
        />
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { LANDMARKS } from "@/lib/landmarks";
import { MINNA, projectToMap } from "@/lib/map";
import { MAP_VIEWBOX, NEIGHBOUR_PATHS, NIGER_STATE_PATH } from "@/lib/map-data";
import { landmarkThumbUrl } from "@/lib/postcard";

export const metadata: Metadata = {
  title: "Stories from Niger State",
  description:
    "Five places in Niger State, from Zuma Rock to Kainji Lake, and the stories behind them.",
};

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

/** Neighbours the pins touch, labelled for context (approximate label spots). */
const NEIGHBOUR_LABELS = [
  { text: "FCT", lat: 8.78, lon: 7.12 },
  { text: "Kebbi", lat: 11.3, lon: 4.05 },
] as const;

const LABEL_SIZE = 34; // viewBox units; ~12px on a phone

function StoryMap() {
  const minna = projectToMap(MINNA.lat, MINNA.lon);
  return (
    <svg
      viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
      role="img"
      aria-labelledby="map-title"
      className="block h-auto w-full"
    >
      <title id="map-title">
        Map of Niger State showing Zuma Rock, Gurara Falls, Kainji Lake and Zungeru Dam
      </title>

      <g fill="none" stroke="var(--color-granite)" strokeOpacity="0.35" strokeWidth="1.5">
        {NEIGHBOUR_PATHS.map((n) => (
          <path key={n.name} d={n.d} />
        ))}
      </g>
      {NEIGHBOUR_LABELS.map((l) => {
        const p = projectToMap(l.lat, l.lon);
        return (
          <text
            key={l.text}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            fontSize="28"
            fontStyle="italic"
            fill="var(--color-granite)"
            fillOpacity="0.8"
          >
            {l.text}
          </text>
        );
      })}

      <path
        d={NIGER_STATE_PATH}
        fill="var(--color-sun)"
        fillOpacity="0.16"
        stroke="var(--color-indigo)"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Minna, for orientation */}
      <g>
        <rect x={minna.x - 7} y={minna.y - 7} width="14" height="14" fill="var(--color-earth)" />
        <text
          x={minna.x + 16}
          y={minna.y + 10}
          fontSize={LABEL_SIZE - 4}
          fill="var(--color-earth)"
          className="map-label"
        >
          Minna
        </text>
      </g>

      {LANDMARKS.map((place) => {
        if (!place.coords) return null;
        const p = projectToMap(place.coords.lat, place.coords.lon);
        const left = place.labelSide === "left";
        return (
          <a key={place.slug} href={`#${place.slug}`} className="map-pin">
            <circle cx={p.x} cy={p.y} r="13" fill="var(--color-indigo)" stroke="var(--color-card)" strokeWidth="4" />
            <text
              x={left ? p.x - 22 : p.x + 22}
              y={p.y + 11}
              textAnchor={left ? "end" : "start"}
              fontSize={LABEL_SIZE}
              fontWeight="700"
              fill="var(--color-indigo)"
              className="map-label"
            >
              {place.name}
            </text>
          </a>
        );
      })}
    </svg>
  );
}

export default function MapPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pt-6 pb-16 sm:pt-10">
      <Link href="/" className="self-start italic text-earth/80 hover:text-earth">
        Postcard from Minna
      </Link>

      <header className="flex flex-col gap-3">
        <h1 className="max-w-[20ch] text-[clamp(2rem,1.4rem+3vw,3.25rem)] leading-[1.05] font-bold text-earth">
          Stories from Niger State
        </h1>
        <p className="max-w-[52ch] text-lg text-earth/85">
          Each postcard is set somewhere real. Tap a place on the map to read its story, then send
          yourself there.
        </p>
      </header>

      <figure className="flex flex-col gap-2 bg-card p-3 shadow-[0_24px_48px_-20px_rgb(59_36_18/0.45)] sm:p-6">
        <StoryMap />
        <figcaption className="text-xs text-granite">
          Boundaries: GRID3 Nigeria state boundaries (2022), via geoBoundaries, CC BY 4.0. Locations
          from Wikipedia. Zuma Rock sits on the border with the FCT, and Kainji Lake reaches into
          Kebbi.
        </figcaption>
      </figure>

      <section aria-label="The places" className="flex flex-col gap-6">
        {LANDMARKS.map((place) => (
          <article
            key={place.slug}
            id={place.slug}
            className="grid scroll-mt-6 gap-4 bg-card p-5 text-indigo shadow-[0_24px_48px_-24px_rgb(59_36_18/0.45)] target:ring-3 target:ring-indigo sm:grid-cols-[9rem_1fr] sm:p-6"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary-sized */}
            <img
              src={landmarkThumbUrl(CLOUD_NAME, place.slug, 360, 300)}
              alt={place.name}
              width={360}
              height={300}
              loading="lazy"
              className="aspect-[6/5] w-full border-[6px] border-stamp object-cover shadow-sm sm:w-36"
            />
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold">{place.name}</h2>
              {place.area && <p className="text-sm text-granite">{place.area}, Niger State</p>}
              {place.storyEn ? (
                <p className="max-w-[60ch] leading-relaxed">{place.storyEn}</p>
              ) : (
                <p className="text-granite italic">Story coming soon.</p>
              )}
              {place.storyHa && (
                <p lang="ha" className="max-w-[60ch] leading-relaxed italic">
                  {place.storyHa}
                </p>
              )}
              <Link
                href={`/?place=${place.slug}`}
                className="mt-2 self-start rounded-sm bg-indigo px-5 py-2.5 font-bold text-card hover:bg-[#2a3a80]"
              >
                Make a postcard here
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

// The back of the postcard: handwritten message on the left, stamp, postmark
// and address lines on the right, printed caption at the foot. Same proportions
// as the photo on the front, so the two read as one card.

type Props = {
  message: string;
  signOff: string;
  landmarkName: string;
  area: string;
  storyEn: string;
  storyHa: string | null;
  stampUrl: string;
  /** Date shown in the postmark, already formatted, e.g. "10 Nov 2026" */
  postedOn: string;
};

export function CardBack({
  message,
  signOff,
  landmarkName,
  area,
  storyEn,
  storyHa,
  stampUrl,
  postedOn,
}: Props) {
  return (
    <article
      aria-label="Back of the postcard"
      className="grid gap-6 bg-card p-5 text-indigo shadow-[0_24px_48px_-20px_rgb(59_36_18/0.45)] sm:p-8 md:aspect-[1232/832] md:grid-cols-[minmax(0,1fr)_1px_minmax(0,15rem)] md:gap-8"
    >
      {/* Right column first on small screens: stamp sits top right, as on a real card. */}
      <div className="flex flex-col gap-6 md:order-3">
        <div className="relative self-end">
          <Stamp url={stampUrl} />
          <Postmark postedOn={postedOn} />
        </div>
        <AddressLines />
      </div>

      <div aria-hidden className="hidden bg-granite/30 md:order-2 md:block" />

      <div className="flex flex-col gap-6 md:order-1">
        <p className="font-hand text-[clamp(1.3rem,1rem+1.4vw,1.85rem)] leading-[1.55]">
          {message}
        </p>
        <p className="font-hand text-[clamp(1.15rem,1rem+0.8vw,1.45rem)]">{signOff}</p>

        <footer className="mt-auto max-w-[42ch] text-[0.8125rem] leading-[1.55] text-granite">
          <p className="font-bold">
            {landmarkName}
            {area && `, ${area}`}, Niger State
          </p>
          {storyEn && <p>{storyEn}</p>}
          {storyHa && (
            <p lang="ha" className="italic">
              {storyHa}
            </p>
          )}
        </footer>
      </div>
    </article>
  );
}

function Stamp({ url }: { url: string }) {
  return (
    // The dotted border in the card colour, over the stamp's own white, reads
    // as a perforated edge.
    <div className="w-[6.5rem] rotate-2 border-[6px] border-dotted border-card bg-stamp p-1.5 shadow-sm sm:w-[7.5rem]">
      <div className="border border-brass p-1">
        {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary-sized */}
        <img
          src={url}
          alt=""
          width={180}
          height={216}
          className="block aspect-[5/6] w-full object-cover"
        />
      </div>
    </div>
  );
}

function Postmark({ postedOn }: { postedOn: string }) {
  // "10 Nov 2026" -> "10 Nov" over "2026"
  const year = postedOn.slice(-4);
  const dayMonth = postedOn.slice(0, -4).trim();
  return (
    <svg
      viewBox="0 0 200 120"
      role="img"
      aria-label={`Postmarked Minna, ${postedOn}`}
      className="postmark pointer-events-none absolute -bottom-6 -left-20 w-44 text-indigo sm:-left-24 sm:w-52"
    >
      <defs>
        <path id="postmark-ring" d="M 60 60 m -38 0 a 38 38 0 1 1 76 0 a 38 38 0 1 1 -76 0" />
      </defs>
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="60" cy="60" r="50" />
        <path d="M 30 50 h 60 M 30 72 h 60" strokeWidth="1.25" />
        {/* Wavy cancellation lines running off to the right */}
        {[38, 52, 66, 80].map((y) => (
          <path key={y} d={`M 116 ${y} q 10 -7 20 0 t 20 0 t 20 0 t 20 0`} />
        ))}
      </g>
      <text
        fill="currentColor"
        fontSize="11"
        letterSpacing="1.5"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        <textPath href="#postmark-ring" startOffset="2%">
          Minna, Niger State
        </textPath>
      </text>
      {/* Date between two bars, day and month over year, as on a real postmark */}
      <text
        textAnchor="middle"
        fill="currentColor"
        fontSize="11"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        <tspan x="60" y="60">
          {dayMonth}
        </tspan>
        <tspan x="60" y="69" fontSize="9">
          {year}
        </tspan>
      </text>
    </svg>
  );
}

function AddressLines() {
  return (
    // Only on the wide, two-column card; on a phone they'd sit above the message.
    <div className="hidden flex-col gap-5 md:flex" aria-hidden>
      <p className="border-b border-granite/40 pb-1 font-hand text-lg">To you</p>
      <span className="border-b border-granite/40" />
      <span className="border-b border-granite/40" />
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { LANDMARKS, isLandmarkSlug, type LandmarkSlug } from "@/lib/landmarks";
import { MESSAGE_MAX, NAME_MAX } from "@/lib/limits";
import { landmarkThumbUrl } from "@/lib/postcard";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

/** What POST /api/postcards needs to verify the selfie is a genuine upload. */
type Upload = { public_id: string; version: number; signature: string };

/** Round face crop of the selfie, as a cheap preview (no background removal). */
function selfiePreviewUrl(publicId: string) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_thumb,g_faces,w_240,h_240,z_0.75/r_max/f_auto,q_auto/${publicId}`;
}

export function CreateForm() {
  const router = useRouter();
  // "Make a postcard here" on the story map links to /?place=<slug>.
  const place = useSearchParams().get("place");
  const [upload, setUpload] = useState<Upload | null>(null);
  const [landmark, setLandmark] = useState<LandmarkSlug | null>(
    place && isLandmarkSlug(place) ? place : null,
  );
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Background removal starts as soon as the selfie is uploaded (it can take
  // ~15s), so it runs while the visitor fills in the rest of the form.
  const cutoutRequest = useRef<Promise<unknown> | null>(null);

  function startCutout(selfie: Upload) {
    cutoutRequest.current = fetch("/api/cutouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ upload: selfie }),
    }).catch(() => undefined); // best effort: the create route retries it
  }

  const missing = [
    !upload && "a selfie",
    !landmark && "a place",
    !name.trim() && "your name",
  ].filter(Boolean) as string[];

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (missing.length > 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      // Usually long finished; if not, wait so the postcard gets its cut-out.
      await cutoutRequest.current;
      const res = await fetch("/api/postcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upload, landmark, name, message, isPublic }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "The postcard couldn't be made. Try again.");
        setSubmitting(false);
        return;
      }
      router.push(data.url);
    } catch {
      setError("You seem to be offline. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-10 bg-card p-5 text-indigo shadow-[0_24px_48px_-20px_rgb(59_36_18/0.45)] sm:p-8"
    >
      {/* 1. Selfie */}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-4 flex items-baseline gap-3 text-xl font-bold">
          <StepNumber n={1} /> Your selfie
        </legend>
        <CldUploadWidget
          signatureEndpoint="/api/sign-upload"
          options={{
            folder: "selfies",
            sources: ["local", "camera"],
            multiple: false,
            maxFiles: 1,
            maxFileSize: 10_000_000, // Cloudinary free plan image limit
            // Resize in the browser before upload: phones shoot ~50 MP, which
            // is slow to send and over the free plan's 25 MP transform limit.
            maxImageWidth: 2000,
            maxImageHeight: 2000,
            clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "heic"],
          }}
          onSuccess={(result, { widget }) => {
            const info = result.info;
            if (typeof info === "object" && info?.signature) {
              const selfie = {
                public_id: info.public_id,
                version: info.version,
                signature: info.signature,
              };
              setUpload(selfie);
              startCutout(selfie);
              setError(null);
              widget.close();
            }
          }}
          onError={() =>
            setError("The photo didn't upload. Try again, or pick a smaller one (under 10 MB).")
          }
        >
          {({ open }) =>
            upload ? (
              <div className="flex items-center gap-5">
                {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary-sized */}
                <img
                  src={selfiePreviewUrl(upload.public_id)}
                  alt="Your selfie"
                  width={240}
                  height={240}
                  className="size-24 rounded-full border-4 border-stamp shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => open()}
                  className="text-granite underline underline-offset-4 hover:text-indigo"
                >
                  Use a different photo
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-2">
                <button
                  type="button"
                  onClick={() => open()}
                  className="rounded-sm bg-indigo px-6 py-3 font-bold text-card hover:bg-[#2a3a80]"
                >
                  Upload a selfie
                </button>
                <p className="text-sm text-granite">
                  Take one with your camera or choose a photo. Face the camera in good light.
                </p>
              </div>
            )
          }
        </CldUploadWidget>
      </fieldset>

      {/* 2. Landmark */}
      <fieldset className="flex flex-col">
        <legend className="mb-4 flex items-baseline gap-3 text-xl font-bold">
          <StepNumber n={2} /> Pick a place
        </legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {LANDMARKS.map((place) => {
            const selected = landmark === place.slug;
            return (
              <label
                key={place.slug}
                className={`group relative cursor-pointer bg-stamp p-1.5 shadow-sm transition-shadow has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo ${
                  selected ? "ring-3 ring-indigo" : "hover:shadow-md"
                }`}
              >
                <input
                  type="radio"
                  name="landmark"
                  value={place.slug}
                  checked={selected}
                  onChange={() => setLandmark(place.slug)}
                  className="sr-only"
                />
                {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary-sized */}
                <img
                  src={landmarkThumbUrl(CLOUD_NAME, place.slug, 400, 260)}
                  alt=""
                  width={400}
                  height={260}
                  loading="lazy"
                  className="block aspect-[400/260] w-full object-cover"
                />
                <span className="block px-1 pt-2 pb-1 font-bold leading-tight">{place.name}</span>
                {place.area && (
                  <span className="block px-1 pb-1 text-sm text-granite">{place.area}</span>
                )}
                {selected && (
                  <span
                    aria-hidden
                    className="absolute top-3 right-3 grid size-7 place-items-center rounded-full bg-indigo text-card"
                  >
                    ✓
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* 3. Sign it */}
      <fieldset className="flex flex-col gap-5">
        <legend className="mb-4 flex items-baseline gap-3 text-xl font-bold">
          <StepNumber n={3} /> Sign it
        </legend>

        <label className="flex flex-col gap-1.5">
          <span className="font-bold">Your name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={NAME_MAX}
            autoComplete="given-name"
            placeholder="Amina"
            className="w-full min-w-0 border-b-2 border-granite/50 bg-transparent py-2 font-hand text-2xl placeholder:text-granite/50 focus:border-indigo focus:outline-none"
          />
          <span className="text-sm text-granite">Signed as &ldquo;Love, {name.trim() || "Amina"}&rdquo;</span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-bold">
            Message <span className="font-normal text-granite">(optional)</span>
          </span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={MESSAGE_MAX}
            rows={3}
            placeholder="Wish you were here!"
            className="w-full min-w-0 resize-none border-b-2 border-granite/50 bg-transparent py-2 font-hand text-xl leading-relaxed placeholder:text-granite/50 focus:border-indigo focus:outline-none"
          />
          <span className="self-end text-sm text-granite" aria-live="polite">
            {message.length}/{MESSAGE_MAX}
          </span>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="mt-1 size-5 accent-indigo"
          />
          <span>
            Show my postcard in the public gallery
            <span className="block text-sm text-granite">
              Off by default. Without it, only people you send the link to can see it.
            </span>
          </span>
        </label>
      </fieldset>

      <div className="flex flex-col items-start gap-3 border-t border-granite/25 pt-6">
        <button
          type="submit"
          disabled={missing.length > 0 || submitting}
          className="rounded-sm bg-indigo px-7 py-3.5 text-lg font-bold text-card hover:bg-[#2a3a80] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Making your postcard…" : "Make my postcard"}
        </button>
        {missing.length > 0 && !submitting && (
          <p className="text-sm text-granite">Add {listOf(missing)} to continue.</p>
        )}
        {error && (
          <p role="alert" className="font-bold text-[#a3261b]">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span
      aria-hidden
      className="grid size-8 shrink-0 translate-y-1 place-items-center rounded-full border-2 border-indigo font-hand text-base"
    >
      {n}
    </span>
  );
}

/** ["a", "b", "c"] -> "a, b and c" */
function listOf(items: string[]) {
  return items.length <= 1
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

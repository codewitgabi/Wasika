// Makes a "golden hour" version of each landmark photo with Cloudinary's
// generative replace (sky -> sunset sky), and stores it as its own image at
// landmarks/golden/<slug>. Postcards then use that image as their background,
// so the generative effect runs once per landmark, never per visitor.
//
//   pnpm landmarks:golden              all landmarks
//   pnpm landmarks:golden gurara-falls only the named landmark(s)
//
// Generative replace isn't available in the Asia Pacific data center, and has
// its own transformation count: check the Usage page after running.

import { LANDMARKS, goldenPublicId, isLandmarkSlug, landmarkPublicId } from "@/lib/landmarks";
import { configuredCloudinary, errorMessage } from "./cloudinary-env";

const GOLDEN_TRANSFORMATION = [
  "c_limit,w_2048,h_2048", // generative replace works at up to 2048px anyway
  "e_gen_replace:from_the sky;to_a warm golden hour sunset sky with soft orange clouds;preserve-geometry_true",
  "e_tint:18:orange", // warm the ground to match the new light
].join("/");

const POLL_SECONDS = 10;
const MAX_WAIT_SECONDS = 180;

/** Fetches the derived image, waiting while Cloudinary answers 423 (still generating). */
async function waitForDerived(url: string): Promise<void> {
  for (let waited = 0; waited <= MAX_WAIT_SECONDS; waited += POLL_SECONDS) {
    const res = await fetch(url, { method: "GET" });
    if (res.ok) return;
    if (res.status !== 423) {
      throw new Error(`${res.status} ${res.headers.get("x-cld-error") ?? res.statusText}`);
    }
    process.stdout.write(`  still generating (${waited}s)...\n`);
    await new Promise((r) => setTimeout(r, POLL_SECONDS * 1000));
  }
  throw new Error(`not ready after ${MAX_WAIT_SECONDS}s`);
}

async function main() {
  const requested = process.argv.slice(2);
  const unknown = requested.filter((s) => !isLandmarkSlug(s));
  if (unknown.length > 0) {
    console.error(`Unknown landmark(s): ${unknown.join(", ")}`);
    process.exit(1);
  }
  const targets = requested.length > 0 ? LANDMARKS.filter((l) => requested.includes(l.slug)) : LANDMARKS;

  const cloudinary = configuredCloudinary();
  let failed = 0;
  for (const { slug } of targets) {
    try {
      const url = cloudinary.url(landmarkPublicId(slug), {
        raw_transformation: GOLDEN_TRANSFORMATION,
        format: "jpg",
        secure: true,
      });
      console.log(`${slug}: generating...`);
      await waitForDerived(url);
      const result = await cloudinary.uploader.upload(url, {
        public_id: goldenPublicId(slug),
        asset_folder: "landmarks/golden",
        overwrite: true,
        invalidate: true,
      });
      console.log(`✔ ${slug} -> ${result.public_id} (${result.width}x${result.height})`);
    } catch (error) {
      failed++;
      console.error(`✘ ${slug}: ${errorMessage(error)}`);
    }
  }
  console.log(`\nDone: ${targets.length - failed} ok, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main();

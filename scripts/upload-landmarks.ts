// Uploads the landmark photos in assets/landmarks/ to Cloudinary.
//
//   pnpm landmarks:upload            upload every landmark that has a photo
//   pnpm landmarks:upload zuma-rock  upload only the named landmark(s)
//
// Each photo is stored at a fixed public_id (landmarks/<slug>) with overwrite on,
// so re-running the script replaces a photo instead of creating a duplicate.

import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { LANDMARKS, isLandmarkSlug, landmarkPublicId } from "@/lib/landmarks";
import { configuredCloudinary, errorMessage } from "./cloudinary-env";

const ASSET_DIR = path.join(process.cwd(), "assets", "landmarks");
const EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_BYTES = 10 * 1024 * 1024; // Cloudinary free plan image limit
const MIN_WIDTH = 1200; // below this the postcard background looks soft

function findPhoto(slug: string): string | undefined {
  return EXTENSIONS.map((ext) => path.join(ASSET_DIR, slug + ext)).find(existsSync);
}

async function main() {
  const requested = process.argv.slice(2);
  const unknown = requested.filter((slug) => !isLandmarkSlug(slug));
  if (unknown.length > 0) {
    console.error(`Unknown landmark(s): ${unknown.join(", ")}`);
    console.error(`Known: ${LANDMARKS.map((l) => l.slug).join(", ")}`);
    process.exit(1);
  }
  const targets =
    requested.length > 0 ? LANDMARKS.filter((l) => requested.includes(l.slug)) : LANDMARKS;

  const missing: string[] = [];
  const tooBig: string[] = [];
  const ready: { slug: (typeof LANDMARKS)[number]["slug"]; file: string }[] = [];
  for (const { slug } of targets) {
    const file = findPhoto(slug);
    if (!file) missing.push(slug);
    else if (statSync(file).size > MAX_BYTES) tooBig.push(path.basename(file));
    else ready.push({ slug, file });
  }

  if (missing.length > 0) {
    console.warn(`No photo for: ${missing.join(", ")}`);
    console.warn(`  Expected assets/landmarks/<slug>${EXTENSIONS[0]} (or ${EXTENSIONS.slice(1).join(", ")})`);
  }
  if (tooBig.length > 0) {
    console.warn(`Over 10 MB, skipped (resize first): ${tooBig.join(", ")}`);
  }
  if (ready.length === 0) {
    console.error("Nothing to upload.");
    process.exit(1);
  }

  const cloudinary = configuredCloudinary();

  let failed = 0;
  for (const { slug, file } of ready) {
    try {
      const result = await cloudinary.uploader.upload(file, {
        public_id: landmarkPublicId(slug),
        asset_folder: "landmarks", // Media Library folder (dynamic folder mode)
        overwrite: true,
        invalidate: true, // purge CDN copies of the old photo
        resource_type: "image",
      });
      console.log(`✔ ${slug} -> ${result.public_id} (${result.width}x${result.height})`);
      if (result.width < MIN_WIDTH) {
        console.warn(`  ⚠ only ${result.width}px wide; postcards need ${MIN_WIDTH}px+ or they look blurry`);
      }
    } catch (error) {
      failed++;
      console.error(`✘ ${slug}: ${errorMessage(error)}`);
    }
  }

  const skipped = missing.length + tooBig.length;
  console.log(`\nUploaded ${ready.length - failed}, failed ${failed}, skipped ${skipped}.`);
  if (failed > 0) process.exit(1);
}

main();

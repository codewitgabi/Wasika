// Uploads the postcard fonts in assets/fonts/ to Cloudinary so text overlays
// (l_text) can use them. Cloudinary requires custom fonts to be raw,
// authenticated assets; they're referenced as l_text:fonts:<file>.ttf_<size>:...
//
//   pnpm fonts:upload
//
// Re-running replaces the files (fixed public_ids, overwrite on).

import { readdirSync } from "node:fs";
import path from "node:path";
import { POSTCARD_FONTS } from "@/lib/postcard";
import { configuredCloudinary, errorMessage } from "./cloudinary-env";

const FONT_DIR = path.join(process.cwd(), "assets", "fonts");

async function main() {
  const onDisk = new Set(readdirSync(FONT_DIR));
  const wanted = Object.values(POSTCARD_FONTS).map((id) => id.replace(/^fonts\//, ""));
  const missing = wanted.filter((file) => !onDisk.has(file));
  if (missing.length > 0) {
    console.error(`Missing from assets/fonts/: ${missing.join(", ")}`);
    process.exit(1);
  }

  const cloudinary = configuredCloudinary();
  let failed = 0;
  for (const file of wanted) {
    try {
      const result = await cloudinary.uploader.upload(path.join(FONT_DIR, file), {
        resource_type: "raw",
        type: "authenticated",
        public_id: `fonts/${file}`, // raw public_ids keep the extension
        asset_folder: "fonts",
        overwrite: true,
        invalidate: true,
      });
      console.log(`✔ ${file} -> ${result.public_id} (${Math.round(result.bytes / 1024)} KB)`);
    } catch (error) {
      failed++;
      console.error(`✘ ${file}: ${errorMessage(error)}`);
    }
  }
  console.log(`\nUploaded ${wanted.length - failed}, failed ${failed}.`);
  if (failed > 0) process.exit(1);
}

main();

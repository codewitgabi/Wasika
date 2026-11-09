// Prints a postcard URL for manual testing (M1).
//
//   pnpm postcard:url <selfie-public-id> <landmark-slug> [name]
//   pnpm postcard:url selfies/abc123 zuma-rock Amina

import { config } from "dotenv";
import { LANDMARKS, isLandmarkSlug } from "@/lib/landmarks";
import { postcardUrl } from "@/lib/postcard";

config({ path: [".env.local", ".env"], quiet: true });

const [selfiePublicId, landmark, name] = process.argv.slice(2);
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

if (!selfiePublicId || !landmark) {
  console.error(
    "Usage: pnpm postcard:url <selfie-public-id> <landmark-slug> [name]",
  );
  process.exit(1);
}
if (!isLandmarkSlug(landmark)) {
  console.error(
    `Unknown landmark "${landmark}". Known: ${LANDMARKS.map((l) => l.slug).join(", ")}`,
  );
  process.exit(1);
}
if (!cloudName) {
  console.error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set in .env.local");
  process.exit(1);
}

console.log(postcardUrl({ cloudName, selfiePublicId, landmark, name }));

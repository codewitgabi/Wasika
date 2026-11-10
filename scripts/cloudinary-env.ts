// Shared setup for the one-off scripts: loads .env.local and configures the
// Cloudinary SDK. (lib/cloudinary.ts is `server-only`, which throws outside Next.)

import { config } from "dotenv";
import { v2 as cloudinary } from "cloudinary";

config({ path: [".env.local", ".env"], quiet: true });

export function configuredCloudinary() {
  const {
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
  } = process.env;
  if (!NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !NEXT_PUBLIC_CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error("Cloudinary env vars are missing. Fill them in .env.local (see .env.example).");
    process.exit(1);
  }
  cloudinary.config({
    cloud_name: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

export function errorMessage(error: unknown): string {
  return (error as { message?: string })?.message ?? String(error);
}

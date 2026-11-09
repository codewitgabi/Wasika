import "server-only";
import { v2 as cloudinary } from "cloudinary";

/** Folder every visitor selfie is uploaded into. The signing route enforces it. */
export const SELFIE_FOLDER = "selfies";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export function getApiSecret(): string {
  return requireEnv("CLOUDINARY_API_SECRET");
}

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

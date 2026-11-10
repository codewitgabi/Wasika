import "server-only";
import { timingSafeEqual } from "node:crypto";
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

/**
 * True if `signature` is Cloudinary's signature for this upload, i.e. the asset
 * really was uploaded to our account (and not just an ID someone typed).
 * Same check as the SDK's verify_api_response_signature, which is untyped.
 */
export function isGenuineUpload(publicId: string, version: number | string, signature: string): boolean {
  const expected = cloudinary.utils.api_sign_request(
    { public_id: publicId, version: String(version) },
    getApiSecret(),
  );
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

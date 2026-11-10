import "server-only";
import { timingSafeEqual } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { CUTOUT_TRANSFORMATION, cutoutPublicIdFor } from "@/lib/postcard";

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

/**
 * Removes the selfie's background once and stores the result as a transparent
 * PNG at cutouts/<id>, so postcard URLs can layer it without paying for
 * background removal again. Returns the cut-out's public_id, or null if it
 * didn't finish in time (postcards then cut out on the fly instead).
 */
export async function createCutout(
  selfiePublicId: string,
  { timeoutMs = 25_000, pollMs = 2_000 } = {},
): Promise<string | null> {
  const derivedUrl = cloudinary.url(selfiePublicId, {
    raw_transformation: CUTOUT_TRANSFORMATION,
    format: "png",
    secure: true,
  });
  const deadline = Date.now() + timeoutMs;
  try {
    // Request the derived image first; Cloudinary answers 423 while it's still
    // processing. Once it's 200 it's cached, and the upload below is quick.
    for (;;) {
      const res = await fetch(derivedUrl, { signal: AbortSignal.timeout(Math.max(1, deadline - Date.now())) });
      if (res.ok) break;
      if (res.status !== 423 || Date.now() + pollMs > deadline) {
        console.error(`Cut-out failed for ${selfiePublicId}: ${res.status} ${res.headers.get("x-cld-error") ?? ""}`);
        return null;
      }
      await new Promise((r) => setTimeout(r, pollMs));
    }
    const result = await cloudinary.uploader.upload(derivedUrl, {
      public_id: cutoutPublicIdFor(selfiePublicId),
      asset_folder: "cutouts",
      overwrite: true,
    });
    return result.public_id;
  } catch (error) {
    console.error(`Cut-out failed for ${selfiePublicId}:`, error);
    return null;
  }
}

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

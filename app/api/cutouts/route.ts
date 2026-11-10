import { createCutout, verifySelfieUpload } from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit";

// Starts the selfie's background removal as soon as the upload finishes, so
// it runs while the visitor picks a place and signs the card. By the time they
// press "Make my postcard", POST /api/postcards usually finds it ready.
//
// Body (JSON): { upload: { public_id, version, signature } } from the widget.
// Returns 200 { ready: boolean }. Safe to call twice: an existing cut-out is
// reused, so repeats cost no background removal. Rate limited per IP
// (lib/rate-limit.ts), since each new selfie costs Cloudinary credits.

export const maxDuration = 60;

export async function POST(request: Request) {
  const limited = await rateLimit("cutouts", request);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const selfie = verifySelfieUpload((body as Record<string, unknown> | null)?.upload);
  if ("error" in selfie) return Response.json({ error: selfie.error }, { status: 400 });

  const cutoutPublicId = await createCutout(selfie.publicId);
  return Response.json({ ready: cutoutPublicId !== null });
}

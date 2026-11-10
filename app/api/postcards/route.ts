import { randomInt } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { isGenuineUpload, SELFIE_FOLDER } from "@/lib/cloudinary";
import { isLandmarkSlug } from "@/lib/landmarks";
import { MESSAGE_MAX, NAME_MAX } from "@/lib/limits";

// Creates a postcard from a finished selfie upload.
//
// Body (JSON):
//   upload    { public_id, version, signature } straight from the upload widget result
//   landmark  a slug from lib/landmarks.ts
//   name      1-40 characters, shown as "Love, <name>"
//   message   optional, up to 200 characters
//   isPublic  optional, opt-in to the gallery (default false)
//
// Returns 201 { slug, url } where url is the share page.
//
// TODO (before launch): rate limit per IP, as with /api/sign-upload.


const SLUG_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // no 0/o, 1/l
const SLUG_LENGTH = 8;

function newSlug(): string {
  let slug = "";
  for (let i = 0; i < SLUG_LENGTH; i++) slug += SLUG_ALPHABET[randomInt(SLUG_ALPHABET.length)];
  return slug;
}

function bad(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

/** Trim and collapse whitespace; returns "" for non-strings. */
function cleanText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error();
    body = parsed;
  } catch {
    return bad("Body must be a JSON object");
  }

  // The selfie: must be a genuine upload into the selfies folder.
  const upload = body.upload as Record<string, unknown> | undefined;
  const publicId = upload?.public_id;
  const version = upload?.version;
  const signature = upload?.signature;
  if (
    typeof publicId !== "string" ||
    (typeof version !== "number" && typeof version !== "string") ||
    typeof signature !== "string"
  ) {
    return bad("upload must include public_id, version and signature");
  }
  if (!publicId.startsWith(`${SELFIE_FOLDER}/`)) {
    return bad(`Selfie must be in the ${SELFIE_FOLDER} folder`);
  }
  if (!isGenuineUpload(publicId, version, signature)) {
    return bad("Upload signature is invalid");
  }

  const landmark = body.landmark;
  if (typeof landmark !== "string" || !isLandmarkSlug(landmark)) {
    return bad("Unknown landmark");
  }

  const name = cleanText(body.name);
  if (name.length < 1 || name.length > NAME_MAX) {
    return bad(`name must be 1-${NAME_MAX} characters`);
  }

  const message = cleanText(body.message);
  if (message.length > MESSAGE_MAX) {
    return bad(`message must be at most ${MESSAGE_MAX} characters`);
  }

  if (body.isPublic !== undefined && typeof body.isPublic !== "boolean") {
    return bad("isPublic must be true or false");
  }

  // Random slugs rarely collide; retry a few times if one does.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const postcard = await db.postcard.create({
        data: {
          slug: newSlug(),
          landmark,
          name,
          message: message || null,
          selfiePublicId: publicId,
          isPublic: body.isPublic === true,
        },
        select: { slug: true },
      });
      return Response.json(
        { slug: postcard.slug, url: `/p/${postcard.slug}` },
        { status: 201 },
      );
    } catch (error) {
      const slugTaken =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!slugTaken) throw error;
    }
  }
  return Response.json({ error: "Could not create postcard, try again" }, { status: 503 });
}

import { db } from "@/lib/db";

// Per-IP rate limiting backed by Postgres, so every serverless instance sees
// the same counts (in-memory counters would reset per instance).
//
// Fixed window: the first request starts a window, each request in it adds
// one, and the first request after it ends starts a fresh one. A single
// atomic upsert does all of that, so concurrent requests can't both slip in.

type Limit = { limit: number; windowSeconds: number };

// Generous on purpose: many Nigerian mobile users share one carrier IP.
export const LIMITS = {
  // One signature per upload attempt, retakes included.
  "sign-upload": { limit: 30, windowSeconds: 60 * 60 },
  // Each new selfie costs a background removal (~0.19 Cloudinary credits).
  cutouts: { limit: 15, windowSeconds: 60 * 60 },
  postcards: { limit: 15, windowSeconds: 60 * 60 },
} satisfies Record<string, Limit>;

export type RateLimitedRoute = keyof typeof LIMITS;

/** The caller's IP. Vercel sets x-forwarded-for itself, so it can't be spoofed there. */
function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

/**
 * Counts this request against the route's limit. Returns null if it's
 * allowed, or a 429 response to send back if it isn't.
 */
export async function rateLimit(
  route: RateLimitedRoute,
  request: Request,
): Promise<Response | null> {
  const { limit, windowSeconds } = LIMITS[route];
  const key = `${route}:${clientIp(request)}`;

  let rows: { count: number; windowStart: Date }[];
  try {
    rows = await db.$queryRaw`
      INSERT INTO "RateLimit" ("key", "count", "windowStart")
      VALUES (${key}, 1, now())
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimit"."windowStart" <= now() - make_interval(secs => ${windowSeconds})
          THEN 1 ELSE "RateLimit"."count" + 1 END,
        "windowStart" = CASE
          WHEN "RateLimit"."windowStart" <= now() - make_interval(secs => ${windowSeconds})
          THEN now() ELSE "RateLimit"."windowStart" END
      RETURNING "count", "windowStart"`;
  } catch (error) {
    // Fail open: a database hiccup shouldn't stop people making postcards.
    console.error("rate limit check failed", error);
    return null;
  }

  const { count, windowStart } = rows[0];
  if (count <= limit) return null;

  const resetsAt = windowStart.getTime() + windowSeconds * 1000;
  const retryAfter = Math.max(1, Math.ceil((resetsAt - Date.now()) / 1000));
  const minutes = Math.ceil(retryAfter / 60);
  return Response.json(
    {
      error: `That's a lot of postcards! Please wait about ${minutes} minute${minutes === 1 ? "" : "s"} and try again.`,
    },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

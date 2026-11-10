import { cloudinary, getApiSecret, SELFIE_FOLDER } from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit";

// Signs upload parameters for the Cloudinary upload widget (next-cloudinary's
// `signatureEndpoint`). The widget POSTs { paramsToSign } and expects
// { signature }.
//
// Anyone can call this route, so it only signs a narrow, known shape: a fresh
// timestamp, the widget's `source` marker, and the fixed selfie folder. Any
// other parameter (public_id, overwrite, type, transformations...) is refused,
// so a signature from here can't be reused to write anywhere else in the account.
// Rate limited per IP (lib/rate-limit.ts).

const ALLOWED_PARAMS = new Set(["timestamp", "source", "folder"]);
const MAX_CLOCK_SKEW_SECONDS = 10 * 60;

type SignRequest = { paramsToSign?: unknown };

function bad(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  const limited = await rateLimit("sign-upload", request);
  if (limited) return limited;

  let body: SignRequest;
  try {
    body = await request.json();
  } catch {
    return bad("Body must be JSON");
  }

  const params = body.paramsToSign;
  if (typeof params !== "object" || params === null || Array.isArray(params)) {
    return bad("paramsToSign must be an object");
  }
  const entries = Object.entries(params as Record<string, unknown>);

  const unexpected = entries
    .map(([key]) => key)
    .filter((key) => !ALLOWED_PARAMS.has(key));
  if (unexpected.length > 0) {
    return bad(`Parameters not allowed: ${unexpected.join(", ")}`);
  }

  const { timestamp, source, folder } = params as Record<string, unknown>;

  const ts = Number(timestamp);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isInteger(ts) || Math.abs(now - ts) > MAX_CLOCK_SKEW_SECONDS) {
    return bad("timestamp missing or out of range");
  }
  if (folder !== SELFIE_FOLDER) {
    return bad(`folder must be "${SELFIE_FOLDER}"`);
  }
  if (source !== undefined && source !== "uw") {
    return bad('source must be "uw"');
  }

  const toSign: Record<string, string | number> = { timestamp: ts, folder };
  if (source !== undefined) toSign.source = source;

  const signature = cloudinary.utils.api_sign_request(toSign, getApiSecret());
  return Response.json({ signature });
}

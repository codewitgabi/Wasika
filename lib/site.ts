/**
 * Absolute base URL of the site, for metadata (og:url and friends).
 * Vercel sets these at build and run time; locally it falls back to localhost.
 */
export function siteUrl(): URL {
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const preview = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;

  if (process.env.VERCEL_ENV === "production" && production)
    return new URL(`https://${production}`);
  if (process.env.VERCEL_ENV === "preview" && preview)
    return new URL(`https://${preview}`);
  return new URL(`http://localhost:${process.env.PORT || 3000}`);
}

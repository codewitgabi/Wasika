import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

/** Slugs are 8 characters from the alphabet used by POST /api/postcards. */
const SLUG_PATTERN = /^[a-km-np-z2-9]{8}$/;

export type SavedPostcard = {
  slug: string;
  landmark: string;
  name: string;
  message: string | null;
  selfiePublicId: string;
  createdAt: string;
};

/**
 * Loads a postcard by slug. Postcards never change after they're created, so
 * the lookup is cached; tagged so a deleted postcard can be evicted with
 * revalidateTag(`postcard:<slug>`).
 */
export async function getPostcard(slug: string): Promise<SavedPostcard | null> {
  "use cache";
  cacheLife("days");
  cacheTag(`postcard:${slug}`);

  // Skip the database for anything that can't be a real slug.
  if (!SLUG_PATTERN.test(slug)) return null;

  const row = await db.postcard.findUnique({
    where: { slug },
    select: {
      slug: true,
      landmark: true,
      name: true,
      message: true,
      selfiePublicId: true,
      createdAt: true,
    },
  });
  return row ? { ...row, createdAt: row.createdAt.toISOString() } : null;
}

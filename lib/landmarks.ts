// Static landmark config. Landmarks are not database rows: a postcard stores the
// landmark slug, and everything else about the place lives here.

export type Landmark = {
  slug: string;
  name: string;
  /** Local government area in Niger State */
  area: string;
  /** One-line English story. Full stories come in M3. */
  storyEn: string;
  /** Hausa story. Left empty until written or proofread by a Hausa speaker. */
  storyHa: string | null;
};

export const LANDMARKS = [
  {
    slug: "zuma-rock",
    name: "Zuma Rock",
    area: "Suleja",
    storyEn:
      "A giant granite monolith beside the Abuja-Kaduna road, pictured on the 100 naira note.",
    storyHa: null,
  },
  {
    slug: "gurara-falls",
    name: "Gurara Falls",
    area: "Gurara",
    storyEn:
      "The Gurara River tumbles over a wide rock ledge, at its fullest in the rainy season.",
    storyHa: null,
  },
  {
    slug: "kainji-lake",
    name: "Kainji Lake",
    area: "Borgu",
    storyEn:
      "A vast lake on the River Niger, formed by the Kainji Dam and bordered by Kainji Lake National Park.",
    storyHa: null,
  },
  {
    slug: "shiroro-dam",
    name: "Shiroro Dam",
    area: "Shiroro",
    storyEn:
      "A hydroelectric dam on the Kaduna River, set among rocky hills.",
    storyHa: null,
  },
  {
    slug: "bida",
    name: "Bida",
    area: "Bida",
    storyEn:
      "Seat of the Nupe kingdom, known for generations of brass, glass and bead craft.",
    storyHa: null,
  },
] as const satisfies readonly Landmark[];

export type LandmarkSlug = (typeof LANDMARKS)[number]["slug"];

export const LANDMARK_SLUGS = LANDMARKS.map((l) => l.slug) as LandmarkSlug[];

export function isLandmarkSlug(value: string): value is LandmarkSlug {
  return (LANDMARK_SLUGS as string[]).includes(value);
}

export function getLandmark(slug: string): Landmark | undefined {
  return LANDMARKS.find((l) => l.slug === slug);
}

/** Cloudinary public_id of the landmark photo, uploaded by `pnpm landmarks:upload`. */
export function landmarkPublicId(slug: LandmarkSlug): string {
  return `landmarks/${slug}`;
}

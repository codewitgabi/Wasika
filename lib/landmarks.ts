// Static landmark config. Landmarks are not database rows: a postcard stores the
// landmark slug, and everything else about the place lives here.

export type Landmark = {
  slug: string;
  name: string;
  /** Local government area in Niger State */
  area: string;
  /**
   * Short English story (2-3 sentences), printed on the card back and used by
   * the story map. DRAFT: facts to be checked before launch.
   */
  storyEn: string;
  /** Hausa story. Left empty until written by a Hausa speaker. */
  storyHa: string | null;
  /** Where the pin goes on the story map (from Wikipedia); null hides the pin. */
  coords: { lat: number; lon: number } | null;
  /** Which side of the pin the map label sits on, to avoid overlaps. */
  labelSide: "left" | "right";
};

export const LANDMARKS = [
  {
    slug: "zuma-rock",
    coords: { lat: 9.1303, lon: 7.2339 },
    labelSide: "left",
    name: "Zuma Rock",
    area: "Suleja",
    storyEn:
      "A giant granite monolith that rises beside the Abuja-Kaduna road, often called the gateway to Abuja. " +
      "Look closely and you may see a face in the rock. The Gbagyi people once took refuge on it in times of war, " +
      "and it appears on the 100 naira note.",
    storyHa: null,
  },
  {
    slug: "gurara-falls",
    coords: { lat: 9.3144, lon: 7.0211 },
    labelSide: "left",
    name: "Gurara Falls",
    area: "Gurara",
    storyEn:
      "The Gurara River spills over a long, stepped ledge of rock in wide white curtains. " +
      "The falls are at their fullest late in the rainy season, and a favourite spot for picnics and day trips.",
    storyHa: null,
  },
  {
    slug: "kainji-lake",
    coords: { lat: 10.3667, lon: 4.55 },
    labelSide: "right",
    name: "Kainji Lake",
    area: "Borgu",
    storyEn:
      "When the Kainji Dam closed the River Niger in the 1960s, it made one of Nigeria's largest lakes. " +
      "The waters covered old Bussa, near the rapids where the explorer Mungo Park drowned in 1806. " +
      "Today the lake borders Kainji Lake National Park.",
    storyHa: null,
  },
  {
    slug: "zungeru-dam",
    coords: { lat: 9.905, lon: 6.2922 },
    labelSide: "right",
    name: "Zungeru Dam",
    area: "Wushishi",
    storyEn:
      "One of Nigeria's newest and largest hydropower dams, on the Kaduna River. " +
      "Nearby Zungeru was the capital of the Northern Nigeria Protectorate in the early 1900s, " +
      "and the birthplace of Nnamdi Azikiwe, Nigeria's first president.",
    storyHa: null,
  },
  {
    slug: "juju-rock",
    coords: null, // TODO: location unknown; no Wikipedia entry,
    labelSide: "right",
    name: "Juju Rock",
    // TODO: confirm the local government area and write the story.
    area: "",
    storyEn: "",
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

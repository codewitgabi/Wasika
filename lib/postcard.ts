// Builds the postcard image as a single Cloudinary delivery URL: the landmark
// photo is the base, the selfie is cut out and layered on top, then a caption.
// Plain string building, no secret needed, so it works on server and client.

import {
  getLandmark,
  goldenPublicId,
  landmarkPublicId,
  type LandmarkSlug,
} from "@/lib/landmarks";

export const POSTCARD_WIDTH = 1200;
export const POSTCARD_HEIGHT = 800;

/**
 * Custom fonts for the captions, uploaded by `pnpm fonts:upload` as raw,
 * authenticated Cloudinary assets. Same faces as the site, and unlike Arial
 * they cover Hausa's hooked letters (ɓ ɗ ƙ).
 */
export const POSTCARD_FONTS = {
  display: "fonts/CharisSIL-Bold.ttf",
  hand: "fonts/PlaypenSans-Medium.ttf",
} as const;

export type PostcardInput = {
  cloudName: string;
  selfiePublicId: string;
  /** Stored cut-out (no background). When set, no background removal runs. */
  cutoutPublicId?: string | null;
  landmark: LandmarkSlug;
  /** Optional sign-off, e.g. "Amina" renders as "Love, Amina" */
  name?: string;
  /**
   * "cutout" (default): background removed, person stands in the scene.
   * "portrait": fallback when the cut-out fails or looks wrong; a round
   * face crop with a white rim, no background removal.
   */
  style?: PostcardStyle;
  /**
   * "auto" (default) lets Cloudinary pick WebP/AVIF per browser. "jpg" is for
   * link previews (og:image), since some preview bots mishandle modern formats.
   */
  format?: "auto" | "jpg";
  /**
   * "day" (default) uses the landmark photo as taken. "golden" uses the
   * golden-hour version (landmarks/golden/<slug>) and warms the selfie to match.
   * Only for landmarks with `golden: true`.
   */
  light?: PostcardLight;
};

export type PostcardStyle = "cutout" | "portrait";
export type PostcardLight = "day" | "golden";

/**
 * Turns a selfie into a cut-out: shrink first (modern phones shoot ~50 MP and
 * the free plan refuses transformations over 25 MP; background removal works
 * at full size), remove the background, then trim the empty margin.
 * Used once at creation to store the cut-out (see createCutout), and inline as
 * a fallback for postcards without a stored cut-out.
 */
export const CUTOUT_TRANSFORMATION = "c_limit,w_1600,h_1600/e_background_removal/e_trim";

/** Where a selfie's stored cut-out lives: selfies/abc -> cutouts/abc. */
export function cutoutPublicIdFor(selfiePublicId: string): string {
  return selfiePublicId.replace(/^selfies\//, "cutouts/");
}

/** Warm tint so the selfie sits in golden-hour light like the scene around it. */
const GOLDEN_SELFIE_TINT = "e_tint:22:orange";

/** Transformation steps that place the selfie layer for each style. */
function selfieLayer(
  selfiePublicId: string,
  cutoutPublicId: string | null | undefined,
  style: PostcardStyle,
  light: PostcardLight,
): string[] {
  const layer = `l_${layerId(selfiePublicId)}`;
  const tint = light === "golden" ? [GOLDEN_SELFIE_TINT] : [];

  if (style === "portrait") {
    return [
      layer,
      // Square crop around all faces (works for groups), zoomed out a little
      // so hair and chin aren't clipped, then made round with a white rim.
      "c_thumb,g_faces,w_400,h_400,z_0.75",
      ...tint,
      // Radius and border in the same step, so the border follows the circle.
      "r_max,bo_10px_solid_white",
      "e_shadow:50,x_6,y_8",
      "fl_layer_apply,g_south_east,x_110,y_90",
    ];
  }

  return [
    // The stored cut-out if there is one; otherwise cut out on the fly (costs a
    // background removal for every distinct URL).
    ...(cutoutPublicId ? [`l_${layerId(cutoutPublicId)}`] : [layer, CUTOUT_TRANSFORMATION]),
    // Fit (never crop, so no straight cut edges at the sides) and stand it on
    // the bottom edge, right of centre.
    "c_fit,w_620,h_640",
    ...tint,
    "fl_layer_apply,g_south_east,x_90,y_0",
  ];
}

/** A public_id used inside a layer (l_) writes folder slashes as colons. */
function layerId(publicId: string): string {
  return publicId.replace(/\//g, ":");
}

/**
 * Text for l_text: URL-encode it, then double-encode commas and slashes,
 * which Cloudinary would otherwise read as parameter and component separators.
 */
function layerText(text: string): string {
  return encodeURIComponent(text)
    .replace(/%2C/gi, "%252C")
    .replace(/%2F/gi, "%252F");
}

/** A white text overlay in one of the uploaded fonts. */
function textLayer(font: string, size: number, text: string): string {
  return `l_text:${layerId(font)}_${size}:${layerText(text)},co_white`;
}

export function postcardUrl({
  cloudName,
  selfiePublicId,
  cutoutPublicId,
  landmark,
  name,
  style = "cutout",
  format = "auto",
  light = "day",
}: PostcardInput): string {
  const place = getLandmark(landmark);
  if (!place) throw new Error(`Unknown landmark: ${landmark}`);
  if (light === "golden" && !place.golden) {
    throw new Error(`No golden-hour photo for ${landmark}; run pnpm landmarks:golden`);
  }

  const steps = [
    // 1. Landmark photo fills the 3:2 postcard, cropped around its most interesting part.
    `c_fill,g_auto,w_${POSTCARD_WIDTH},h_${POSTCARD_HEIGHT}`,

    // 2. The selfie, as a cut-out or a round portrait.
    ...selfieLayer(selfiePublicId, cutoutPublicId, style, light),

    // 3. Caption, top left: a handwritten "Greetings from" over the place name
    //    set large in the display face, like a vintage postcard.
    textLayer(POSTCARD_FONTS.hand, 40, "Greetings from"),
    "e_shadow:50,x_2,y_2",
    "fl_layer_apply,g_north_west,x_50,y_40",
    textLayer(POSTCARD_FONTS.display, 88, place.name),
    "e_shadow:50,x_3,y_3",
    "fl_layer_apply,g_north_west,x_46,y_88",
  ];

  if (name?.trim()) {
    steps.push(
      textLayer(POSTCARD_FONTS.hand, 44, `Love, ${name.trim()}`),
      "e_shadow:50,x_2,y_2",
      "fl_layer_apply,g_south_west,x_50,y_40",
    );
  }

  // 4. White postcard border, then let Cloudinary pick format and quality.
  steps.push("bo_16px_solid_white", `f_${format},q_auto`);

  const base = light === "golden" ? goldenPublicId(landmark) : landmarkPublicId(landmark);
  return `https://res.cloudinary.com/${cloudName}/image/upload/${steps.join("/")}/${base}`;
}

/** A small crop of a landmark photo, e.g. for the stamp on the card back. */
export function landmarkThumbUrl(
  cloudName: string,
  landmark: LandmarkSlug,
  width: number,
  height: number,
): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,g_auto,w_${width},h_${height}/f_auto,q_auto/${landmarkPublicId(landmark)}`;
}

// Builds the postcard image as a single Cloudinary delivery URL: the landmark
// photo is the base, the selfie is cut out and layered on top, then a caption.
// Plain string building, no secret needed, so it works on server and client.

import {
  getLandmark,
  landmarkPublicId,
  type LandmarkSlug,
} from "@/lib/landmarks";

export const POSTCARD_WIDTH = 1200;
export const POSTCARD_HEIGHT = 800;

export type PostcardInput = {
  cloudName: string;
  selfiePublicId: string;
  landmark: LandmarkSlug;
  /** Optional sign-off, e.g. "Amina" renders as "Love, Amina" */
  name?: string;
};

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

export function postcardUrl({
  cloudName,
  selfiePublicId,
  landmark,
  name,
}: PostcardInput): string {
  const place = getLandmark(landmark);
  if (!place) throw new Error(`Unknown landmark: ${landmark}`);

  const steps = [
    // 1. Landmark photo fills the 3:2 postcard, cropped around its most interesting part.
    `c_fill,g_auto,w_${POSTCARD_WIDTH},h_${POSTCARD_HEIGHT}`,

    // 2. Selfie: remove the background, trim the empty space around the person,
    //    fit (never crop, so no straight cut edges at the sides), and stand it
    //    on the bottom edge, right of centre.
    `l_${layerId(selfiePublicId)}`,
    "e_background_removal",
    "e_trim",
    "c_fit,w_620,h_640",
    "fl_layer_apply,g_south_east,x_90,y_0",

    // 3. Caption, top left.
    `l_text:Arial_60_bold:${layerText(`Greetings from ${place.name}`)},co_white`,
    "e_shadow:60,x_2,y_2",
    "fl_layer_apply,g_north_west,x_48,y_44",
  ];

  if (name?.trim()) {
    steps.push(
      `l_text:Arial_40_italic:${layerText(`Love, ${name.trim()}`)},co_white`,
      "e_shadow:60,x_2,y_2",
      "fl_layer_apply,g_south_west,x_48,y_40",
    );
  }

  // 4. White postcard border, then let Cloudinary pick format and quality.
  steps.push("bo_16px_solid_white", "f_auto,q_auto");

  return `https://res.cloudinary.com/${cloudName}/image/upload/${steps.join("/")}/${landmarkPublicId(landmark)}`;
}

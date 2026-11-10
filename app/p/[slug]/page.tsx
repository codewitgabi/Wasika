import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getLandmark, isLandmarkSlug } from "@/lib/landmarks";
import {
  POSTCARD_HEIGHT,
  POSTCARD_WIDTH,
  landmarkThumbUrl,
  postcardUrl,
  postcardVideoUrl,
  type PostcardInput,
  type PostcardLight,
} from "@/lib/postcard";
import { getPostcard, type SavedPostcard } from "@/lib/postcards";
import { CardBack } from "./card-back";
import { PostcardImage, type PostcardSources } from "./postcard-image";
import { ShareButton } from "./share-button";

// The postcard image has a 16px border on each side.
const IMAGE_WIDTH = POSTCARD_WIDTH + 32;
const IMAGE_HEIGHT = POSTCARD_HEIGHT + 32;

function cloudName(): string {
  const name = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!name) throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set");
  return name;
}

/** Postcard plus its landmark, or null if either is missing. */
async function loadPostcard(slug: string) {
  const postcard = await getPostcard(slug);
  if (!postcard || !isLandmarkSlug(postcard.landmark)) return null;
  const landmark = getLandmark(postcard.landmark)!;
  return { postcard, landmark, landmarkSlug: postcard.landmark };
}

function title(postcard: SavedPostcard, landmarkName: string) {
  return `${postcard.name} sent you a postcard from ${landmarkName}`;
}

/** Image, fallback and video URLs for one light. */
function sourcesFor(base: PostcardInput, light: PostcardLight): PostcardSources {
  return {
    cutout: postcardUrl({ ...base, style: "cutout", light }),
    portrait: postcardUrl({ ...base, style: "portrait", light }),
    video: postcardVideoUrl({ ...base, light }),
    videoDownload: postcardVideoUrl({ ...base, light }, { download: true }),
  };
}

/** "10 Nov 2026", in Minna's time zone, like a real postmark. */
function postmarkDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(iso));
}

export async function generateMetadata({
  params,
}: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadPostcard(slug);
  // Metadata is resolved before the response starts for link-preview bots, so
  // this gives them a real 404. Browsers get the not-found UI via streaming.
  if (!loaded) notFound();

  const { postcard, landmark, landmarkSlug } = loaded;
  const image = postcardUrl({
    cloudName: cloudName(),
    selfiePublicId: postcard.selfiePublicId,
    cutoutPublicId: postcard.cutoutPublicId,
    landmark: landmarkSlug,
    name: postcard.name,
    format: "jpg",
  });
  const description =
    postcard.message ??
    `Greetings from ${landmark.name}, Niger State. Make your own postcard.`;

  return {
    title: title(postcard, landmark.name),
    description,
    // Selfies are unlisted: shareable by link, but kept out of search results.
    robots: { index: false, follow: false },
    openGraph: {
      title: title(postcard, landmark.name),
      description,
      url: `/p/${postcard.slug}`,
      type: "website",
      images: [
        {
          url: image,
          width: IMAGE_WIDTH,
          height: IMAGE_HEIGHT,
          alt: `Postcard from ${landmark.name}`,
        },
      ],
    },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

async function Postcard({
  params,
}: {
  params: PageProps<"/p/[slug]">["params"];
}) {
  const { slug } = await params;
  const loaded = await loadPostcard(slug);
  if (!loaded) notFound();

  const { postcard, landmark, landmarkSlug } = loaded;
  const base: PostcardInput = {
    cloudName: cloudName(),
    selfiePublicId: postcard.selfiePublicId,
    cutoutPublicId: postcard.cutoutPublicId,
    landmark: landmarkSlug,
    name: postcard.name,
  };

  return (
    <>
      <h1 className="max-w-[30ch] text-[clamp(1.375rem,1.1rem+1.2vw,2rem)] leading-tight text-earth">
        {title(postcard, landmark.name)}
      </h1>

      <PostcardImage
        day={sourcesFor(base, "day")}
        golden={landmark.golden ? sourcesFor(base, "golden") : undefined}
        alt={`${postcard.name} at ${landmark.name}`}
        width={IMAGE_WIDTH}
        height={IMAGE_HEIGHT}
      />

      <CardBack
        message={postcard.message ?? `Greetings from ${landmark.name}!`}
        signOff={`Love, ${postcard.name}`}
        landmarkName={landmark.name}
        area={landmark.area}
        storyEn={landmark.storyEn}
        storyHa={landmark.storyHa}
        stampUrl={landmarkThumbUrl(cloudName(), landmarkSlug, 180, 216)}
        postedOn={postmarkDate(postcard.createdAt)}
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-2">
        <ShareButton title={title(postcard, landmark.name)} />
        <Link
          href="/"
          className="text-earth underline decoration-earth/40 underline-offset-4 hover:decoration-earth"
        >
          Make your own postcard
        </Link>
      </div>
    </>
  );
}

function PostcardSkeleton() {
  return (
    <>
      <div className="h-8 w-2/3 rounded-sm bg-sun-deep" />
      <div
        className="w-full animate-pulse bg-sun-deep motion-reduce:animate-none"
        style={{ aspectRatio: `${IMAGE_WIDTH} / ${IMAGE_HEIGHT}` }}
      />
      <div
        className="w-full bg-card/40"
        style={{ aspectRatio: `${IMAGE_WIDTH} / ${IMAGE_HEIGHT}` }}
      />
    </>
  );
}

export default function PostcardPage({ params }: PageProps<"/p/[slug]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-6 pb-16 sm:gap-8 sm:pt-10">
      <Link href="/" className="self-start italic text-earth/80 hover:text-earth">
        Postcard from Minna
      </Link>
      <Suspense fallback={<PostcardSkeleton />}>
        <Postcard params={params} />
      </Suspense>
    </main>
  );
}

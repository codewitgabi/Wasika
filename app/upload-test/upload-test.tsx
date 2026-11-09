"use client";

import { useState } from "react";
import { CldImage, CldUploadWidget } from "next-cloudinary";

type Uploaded = { publicId: string; width: number; height: number };

export function UploadTest() {
  const [uploaded, setUploaded] = useState<Uploaded | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <CldUploadWidget
        signatureEndpoint="/api/sign-upload"
        options={{
          folder: "selfies",
          sources: ["local", "camera"],
          multiple: false,
          maxFiles: 1,
          maxFileSize: 10_000_000, // Cloudinary free plan limit for images
          clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "heic"],
        }}
        onSuccess={(result) => {
          const info = result.info;
          if (typeof info === "object" && info !== null) {
            setError(null);
            setUploaded({
              publicId: info.public_id,
              width: info.width,
              height: info.height,
            });
          }
        }}
        onError={(err) => {
          setError(typeof err === "string" ? err : JSON.stringify(err));
        }}
      >
        {({ open }) => (
          <button
            type="button"
            onClick={() => open()}
            className="rounded-full bg-black px-5 py-3 text-white dark:bg-white dark:text-black"
          >
            Upload a selfie
          </button>
        )}
      </CldUploadWidget>

      {error && <p className="text-sm text-red-600">Upload failed: {error}</p>}

      {uploaded && (
        <div className="flex flex-col gap-2">
          <p className="break-all text-sm">
            Uploaded: <code>{uploaded.publicId}</code>
          </p>
          <CldImage
            src={uploaded.publicId}
            width={uploaded.width}
            height={uploaded.height}
            sizes="(max-width: 448px) 100vw, 448px"
            alt="Uploaded selfie"
            className="h-auto w-full rounded-lg"
          />
        </div>
      )}
    </>
  );
}

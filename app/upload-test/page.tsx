// M0 check: proves a signed selfie upload works end to end (widget -> /api/sign-upload
// -> Cloudinary). Temporary: remove once the real upload flow lands in M2.

import { Suspense } from "react";
import { UploadTest } from "./upload-test";

export default function UploadTestPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Upload test</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Signed upload into the <code>selfies</code> folder.
      </p>
      {/* next-cloudinary's widget calls Math.random() while rendering, which Cache
          Components won't prerender. Suspense renders it at request time instead. */}
      <Suspense>
        <UploadTest />
      </Suspense>
    </main>
  );
}

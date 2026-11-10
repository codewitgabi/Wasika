import { Suspense } from "react";
import { CreateForm } from "./create-form";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pt-6 pb-16 sm:pt-10">
      <p className="italic text-earth/80">Postcard from Minna</p>

      <header className="flex flex-col gap-3">
        <h1 className="max-w-[18ch] text-[clamp(2rem,1.4rem+3vw,3.5rem)] leading-[1.05] font-bold text-earth">
          Send a postcard from Niger State
        </h1>
        <p className="max-w-[52ch] text-lg text-earth/85">
          Upload a selfie and pick a landmark. We&rsquo;ll put you at Zuma Rock,
          Gurara Falls or Kainji Lake, and give you a link to send home.
        </p>
      </header>

      {/* next-cloudinary's upload widget calls Math.random() while rendering,
          which Cache Components won't prerender; Suspense renders it per request. */}
      <Suspense fallback={<div className="min-h-[40rem] bg-card/40" />}>
        <CreateForm />
      </Suspense>
    </main>
  );
}

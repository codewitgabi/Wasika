import Link from "next/link";

export default function PostcardNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-16 pb-16">
      <h1 className="text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)] leading-tight text-earth">
        This postcard never arrived
      </h1>
      <p className="max-w-[55ch] text-earth/80">
        The link may be incomplete. Check that you copied all of it, or make a
        postcard of your own.
      </p>
      <Link
        href="/"
        className="self-start rounded-sm bg-indigo px-6 py-3 font-bold text-card hover:bg-[#2a3a80]"
      >
        Make your own postcard
      </Link>
    </main>
  );
}

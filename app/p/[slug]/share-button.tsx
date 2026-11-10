"use client";

import { useState } from "react";

/** Uses the phone's share sheet where available, otherwise copies the link. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User closed the share sheet; nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (e.g. insecure context); the URL bar still works.
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="rounded-sm bg-indigo px-6 py-3 font-bold text-card transition-colors hover:bg-[#2a3a80] active:translate-y-px"
    >
      {copied ? "Link copied" : "Share postcard"}
    </button>
  );
}

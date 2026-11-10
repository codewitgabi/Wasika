import type { Metadata } from "next";
import { Charis_SIL, Playpen_Sans } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

// Both faces cover Hausa's hooked letters (ɓ ɗ ƙ) via latin-ext; most
// Google fonts, including the usual handwriting faces, don't.
const charis = Charis_SIL({
  variable: "--font-charis",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const playpen = Playpen_Sans({
  variable: "--font-playpen",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: "Postcard from Minna",
  description:
    "Drop yourself into a Niger State landmark and send a postcard home.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${charis.variable} ${playpen.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}

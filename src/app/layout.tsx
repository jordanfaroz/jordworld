import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Pixelify_Sans,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Self-hosted via next/font (preloaded, no runtime fetch or FOUC) instead of
// the classic hero's own injected Google Fonts <link>, which was a real,
// measured CLS source (the headline reflowing once the font swapped in).
// Only ever referenced by the classic hero's headline accent — see
// src/components/hero.tsx — not a site-wide typeface.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

// Headings only. Its "fi" ligature renders as a single glyph that reads like
// "Antech" instead of "fintech" — disabled globally for this font in
// globals.css's `.font-pixel` rule, not something a per-element fix away.
const pixelifySans = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jord World — Jordan Faroz",
  description:
    "Jordan Faroz's personal site: an explorable voxel world and a classic portfolio.",
  metadataBase: new URL("https://jordworld.com"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${pixelifySans.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}

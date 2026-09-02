import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Clipora — Turn Long Videos Into Ready-to-Post Clips",
    template: "%s · Clipora",
  },
  description:
    "Paste a YouTube video, choose your clip length, and split it into perfectly sized clips for TikTok, YouTube Shorts, and Instagram Reels.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Clipora — One video in. Multiple clips out.",
    description:
      "Paste a YouTube video and get ready-to-post clips for Shorts, TikTok, and Reels in minutes.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}

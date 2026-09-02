"use client";

import { MarketingShell } from "@/components/layout/MarketingShell";
import { useState } from "react";

const FAQS = [
  {
    q: "What kind of videos can I use?",
    a: "You can process YouTube videos you own or have permission to use. Public videos work best. Private, age-restricted, or region-locked videos may not be available.",
  },
  {
    q: "How long does processing take?",
    a: "Most videos are ready in a few minutes. Longer videos take a little more time. You'll see live progress the whole way through.",
  },
  {
    q: "What clip lengths can I choose?",
    a: "15, 30, 60, or 90 seconds — or pick a custom length. 60 seconds is recommended for Shorts and TikTok.",
  },
  {
    q: "Can I create vertical clips?",
    a: "Yes. 9:16 vertical is the default, built for TikTok, YouTube Shorts, and Instagram Reels. Landscape and square are available too.",
  },
  {
    q: "Can I download all clips at once?",
    a: "Yes. On Creator and above, you can download every clip together as one package.",
  },
  {
    q: "Do I need video editing experience?",
    a: "No. Paste a link, choose a length, and download. That's the whole product.",
  },
  {
    q: "Can I process videos I don't own?",
    a: "Only process content you own or have permission to use. Clipora is a productivity tool for creators, not a way to reuse other people's work.",
  },
  {
    q: "What happens if my video cannot be processed?",
    a: "We'll tell you clearly and let you try another video. Common reasons are unavailable videos, missing permission, or a plan limit.",
  },
];

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-semibold tracking-tight">Questions, answered.</h1>
        <p className="mt-3 text-ink-soft">Short answers to the things people actually ask.</p>
        <div className="mt-10 divide-y divide-[var(--line)] rounded-[28px] border border-[var(--line)] bg-white">
          {FAQS.map((item, i) => (
            <div key={item.q}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-semibold">{item.q}</span>
                <span className="text-ink-faint">{open === i ? "–" : "+"}</span>
              </button>
              {open === i && <p className="px-5 pb-5 text-sm leading-6 text-ink-soft">{item.a}</p>}
            </div>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}

import { MarketingShell } from "@/components/layout/MarketingShell";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PricingTeaser } from "@/components/landing/PricingTeaser";

export default function HomePage() {
  return (
    <MarketingShell>
      <Hero />
      <HowItWorks />
      <section className="px-4 py-8 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {[
            { k: "No editor required", v: "If you can paste a link, you can create clips." },
            { k: "Built for short-form", v: "Vertical 9:16 by default for Shorts, TikTok, and Reels." },
            { k: "Download everything", v: "Grab one clip or the full set in a single package." },
          ].map((item) => (
            <div key={item.k} className="rounded-3xl border border-[var(--line)] bg-white/70 p-6">
              <h3 className="font-semibold">{item.k}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{item.v}</p>
            </div>
          ))}
        </div>
      </section>
      <PricingTeaser />
    </MarketingShell>
  );
}

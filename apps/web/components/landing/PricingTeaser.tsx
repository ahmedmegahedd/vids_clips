import { PLAN_DEFINITIONS } from "@clipora/shared";
import Link from "next/link";

export function PricingTeaser() {
  const creator = PLAN_DEFINITIONS.creator;
  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-ink px-6 py-12 text-white sm:px-12">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-white/60">Simple pricing</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Choose the plan that fits your content.
            </h2>
            <p className="mt-3 max-w-md text-white/70">
              Start small, upgrade when you need more. Pay for the videos you actually process.
            </p>
            <Link
              href="/pricing"
              className="mt-6 inline-flex h-11 items-center rounded-2xl bg-accent px-5 text-sm font-semibold"
            >
              See pricing
            </Link>
          </div>
          <div className="rounded-3xl bg-white/8 p-6 ring-1 ring-white/10">
            <p className="text-sm text-white/60">Most creators choose</p>
            <p className="mt-1 text-2xl font-semibold">{creator.name}</p>
            <p className="mt-1 text-white/70">{creator.videosPerMonth} videos / month</p>
            <p className="mt-6 text-4xl font-semibold">
              ${creator.monthlyPrice}
              <span className="text-base font-medium text-white/50"> /mo</span>
            </p>
            <p className="mt-2 text-sm text-white/50">EGP {creator.egpMonthly.toLocaleString()} billed at checkout</p>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { MarketingShell } from "@/components/layout/MarketingShell";
import { Button } from "@/components/ui/Button";
import { useCheckoutDraft } from "@/lib/checkout-store";
import { cx } from "@/lib/cn";
import {
  PLAN_DEFINITIONS,
  PLANS,
  YEARLY_SAVINGS_PERCENT,
  equivalentMonthly,
  formatMoney,
  type BillingInterval,
  type PlanId,
} from "@clipora/shared";
import { Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const FAQ = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. You'll keep access until the end of your current billing period.",
  },
  {
    q: "What happens when I reach my limit?",
    a: "You can still open existing clips. To process more videos, upgrade your plan.",
  },
  {
    q: "Can I upgrade later?",
    a: "Yes. Upgrades take effect as soon as payment is confirmed.",
  },
  {
    q: "Can I downgrade?",
    a: "Yes. The change takes effect at the end of your current billing period.",
  },
  {
    q: "How does yearly billing work?",
    a: `You pay once for the year and save ${YEARLY_SAVINGS_PERCENT}%. The amount shown at checkout is the amount charged today.`,
  },
  {
    q: "What payment methods are supported?",
    a: "Payments are processed securely by Paymob. Available methods typically include bank cards and mobile wallets.",
  },
  {
    q: "What happens if my payment fails?",
    a: "No subscription is activated and you can try again or choose another method. You won't be charged twice.",
  },
  {
    q: "Can I get an invoice?",
    a: "Yes. Every successful payment appears in Billing & Subscription, where you can view receipts.",
  },
];

const COMPARE = [
  ["Video processing / month", "1 video", "20 videos", "80 videos", "300 videos"],
  ["Clip lengths", "Up to 60s", "Custom lengths", "Custom lengths", "Custom lengths"],
  ["Output formats", "Vertical", "All formats", "All formats", "All formats"],
  ["Projects", "Limited", "Multiple", "More projects", "Large capacity"],
  ["Downloads", "One by one", "Download all", "Batch downloads", "Batch downloads"],
  ["Priority processing", "—", "Faster", "Priority", "Priority"],
  ["Team access", "1 seat", "1 seat", "1 seat", "10 seats"],
];

function PricingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const currentPlan = (params.get("current") as PlanId | null) ?? null;
  const [interval, setInterval] = useState<BillingInterval>(params.get("interval") === "yearly" ? "yearly" : "monthly");
  const [open, setOpen] = useState<number | null>(0);
  const setPlan = useCheckoutDraft((s) => s.setPlan);

  const yearly = interval === "yearly";

  function select(planId: PlanId) {
    if (planId === "free") {
      router.push("/create");
      return;
    }
    setPlan(planId, interval);
    router.push(`/checkout?plan=${planId}&interval=${interval}`);
  }

  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Choose the plan that fits your content</h1>
          <p className="mt-4 text-ink-soft">Start small, upgrade when you need more.</p>
          <p className="mt-2 text-sm text-ink-faint">How many videos do you need to process?</p>
          <div className="mt-8 inline-flex rounded-full bg-white p-1 ring-1 ring-[var(--line)]">
            <button
              type="button"
              onClick={() => setInterval("monthly")}
              className={cx("rounded-full px-4 py-2 text-sm font-semibold", !yearly && "bg-ink text-white")}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval("yearly")}
              className={cx("rounded-full px-4 py-2 text-sm font-semibold", yearly && "bg-ink text-white")}
            >
              Yearly — Save {YEARLY_SAVINGS_PERCENT}%
            </button>
          </div>
          {yearly && (
            <p className="mt-3 text-sm font-medium text-success">Save {YEARLY_SAVINGS_PERCENT}% with yearly billing</p>
          )}
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-4">
          {PLANS.map((id) => {
            const plan = PLAN_DEFINITIONS[id];
            const isCurrent = currentPlan === id;
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
            const egp = yearly ? plan.egpYearly : plan.egpMonthly;
            return (
              <article
                key={id}
                className={cx(
                  "card relative flex flex-col p-6",
                  plan.recommended && "ring-2 ring-ink lg:-translate-y-1 lg:shadow-[var(--shadow-hover)]",
                  isCurrent && "ring-2 ring-success",
                )}
              >
                {plan.recommended && (
                  <span className="absolute -top-3 left-6 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    Most Popular
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-3 right-6 rounded-full bg-success px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    Current Plan
                  </span>
                )}
                <p className="text-sm font-semibold">{plan.name}</p>
                <p className="mt-1 min-h-10 text-sm text-ink-soft">{plan.tagline}</p>
                <p className="mt-5 text-4xl font-semibold tracking-tight">
                  {plan.monthlyPrice === 0 ? "$0" : `$${price}`}
                  <span className="text-base font-medium text-ink-faint">{plan.monthlyPrice === 0 ? " / month" : yearly ? " / year" : " / month"}</span>
                </p>
                {yearly && plan.monthlyPrice > 0 && (
                  <p className="mt-1 text-sm text-ink-faint">Equivalent to ${equivalentMonthly(plan, "USD").toFixed(2)}/month</p>
                )}
                <p className="mt-2 text-sm font-medium">
                  {plan.monthlyPrice === 0 ? "No charge" : `${formatMoney(egp, "EGP")} billed today`}
                </p>
                <p className="mt-4 text-sm font-semibold">Process up to {plan.videosPerMonth} video{plan.videosPerMonth === 1 ? "" : "s"} per month</p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-ink-soft">
                  {plan.benefits.map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check size={16} className="mt-0.5 shrink-0 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.recommended ? "primary" : "secondary"}
                  className="mt-6 w-full"
                  onClick={() => select(id)}
                >
                  {plan.cta}
                </Button>
                {id === "business" && (
                  <a href="/contact" className="mt-3 text-center text-sm font-medium text-ink-soft hover:text-ink">
                    Contact us
                  </a>
                )}
              </article>
            );
          })}
        </div>

        <div className="mt-20 overflow-x-auto">
          <h2 className="text-2xl font-semibold tracking-tight">Compare plans</h2>
          <table className="mt-6 w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)]">
                {["", "Free", "Creator", "Pro", "Business"].map((h) => (
                  <th key={h} className="px-3 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row) => (
                <tr key={row[0]} className="border-b border-[var(--line)]">
                  {row.map((cell, i) => (
                    <td key={i} className={cx("px-3 py-3", i === 0 ? "text-ink-soft" : "font-medium")}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mx-auto mt-20 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight">Questions about billing</h2>
          <div className="mt-6 divide-y divide-[var(--line)] rounded-[28px] border border-[var(--line)] bg-white">
            {FAQ.map((item, i) => (
              <div key={item.q}>
                <button type="button" className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left" onClick={() => setOpen(open === i ? null : i)}>
                  <span className="font-semibold">{item.q}</span>
                  <span className="text-ink-faint">{open === i ? "–" : "+"}</span>
                </button>
                {open === i && <p className="px-5 pb-5 text-sm leading-6 text-ink-soft">{item.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingInner />
    </Suspense>
  );
}

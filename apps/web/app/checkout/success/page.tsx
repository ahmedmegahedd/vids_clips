"use client";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { PLAN_DEFINITIONS, formatMoney } from "@clipora/shared";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { CheckoutSession } from "@clipora/shared";

function SuccessInner() {
  const params = useSearchParams();
  const [session, setSession] = useState<CheckoutSession | null>(null);

  useEffect(() => {
    const id = params.get("session");
    if (!id) return;
    api.getCheckout(id).then((res) => setSession(res.session)).catch(() => undefined);
  }, [params]);

  const plan = session ? PLAN_DEFINITIONS[session.planId] : PLAN_DEFINITIONS.creator;
  const next = session?.nextBillingDate
    ? new Date(session.nextBillingDate).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : "—";

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
      <Logo />
      <p className="mt-8 text-sm font-semibold text-success">Your {plan.name} plan is active.</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Payment successful 🎉</h1>
      <p className="mt-3 text-ink-soft">Welcome to {plan.name}. Your subscription is now active.</p>
      <div className="card mt-8 divide-y divide-[var(--line)]">
        {[
          ["Plan", plan.name],
          ["Billing", session?.interval === "yearly" ? "Yearly" : "Monthly"],
          ["Amount paid", session ? formatMoney(session.total, "EGP") : "—"],
          ["Next billing date", next],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between px-5 py-3 text-sm">
            <span className="text-ink-soft">{k}</span>
            <span className="font-semibold">{v}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-ink-soft">
        You can now process up to {plan.videosPerMonth} videos per month.
        {session?.email ? ` Payment confirmation sent to ${session.email}.` : ""}
      </p>
      <Button href="/create" size="lg" className="mt-8 w-full">
        Start Creating Clips →
      </Button>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button href="/account/billing" variant="secondary" className="flex-1">
          View My Subscription
        </Button>
        <Button href="/account/billing" variant="ghost" className="flex-1">
          View Receipt
        </Button>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessInner />
    </Suspense>
  );
}

"use client";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function PendingInner() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session");
  const [checking, setChecking] = useState(false);

  async function check() {
    if (!sessionId) return;
    setChecking(true);
    try {
      const { session } = await api.getCheckout(sessionId);
      if (session.status === "paid" || session.status === "already_paid") router.replace(`/checkout/success?session=${sessionId}`);
      else if (session.status === "failed") router.replace(`/checkout/failed?session=${sessionId}`);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12 text-center">
      <Logo />
      <h1 className="mt-8 text-4xl font-semibold tracking-tight">Payment pending</h1>
      <p className="mt-3 text-ink-soft">We&apos;re waiting for confirmation of your payment.</p>
      <p className="mt-2 text-sm text-ink-faint">
        You don&apos;t need to pay again. We&apos;ll update your subscription once the payment is confirmed.
      </p>
      <Button href="/account/billing" size="lg" className="mt-8 w-full">
        Go to My Account
      </Button>
      <Button variant="secondary" className="mt-3 w-full" onClick={() => void check()} disabled={checking}>
        {checking ? "Checking..." : "Check Payment Status"}
      </Button>
    </div>
  );
}

export default function PendingPage() {
  return (
    <Suspense>
      <PendingInner />
    </Suspense>
  );
}

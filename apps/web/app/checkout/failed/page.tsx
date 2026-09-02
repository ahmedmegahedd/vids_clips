"use client";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function FailedInner() {
  const params = useSearchParams();
  const sessionId = params.get("session");
  const [reason, setReason] = useState("Your payment wasn't completed. No subscription has been activated.");

  useEffect(() => {
    if (!sessionId) return;
    api.getCheckout(sessionId).then(({ session }) => {
      if (session.failureReason) setReason(session.failureReason);
    }).catch(() => undefined);
  }, [sessionId]);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12 text-center">
      <Logo />
      <h1 className="mt-8 text-4xl font-semibold tracking-tight">We couldn&apos;t complete your payment</h1>
      <p className="mt-3 text-ink-soft">{reason}</p>
      <Button href={sessionId ? `/checkout` : "/pricing"} size="lg" className="mt-8 w-full">
        Try Payment Again
      </Button>
      <Button href="/checkout" variant="secondary" className="mt-3 w-full">
        Choose Another Payment Method
      </Button>
      <Button href="/checkout" variant="ghost" className="mt-2 w-full">
        Back to Checkout
      </Button>
    </div>
  );
}

export default function FailedPage() {
  return (
    <Suspense>
      <FailedInner />
    </Suspense>
  );
}

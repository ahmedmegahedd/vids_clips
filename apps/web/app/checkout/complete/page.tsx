"use client";

import { StatusScreen } from "@/components/billing/StatusScreen";
import { Logo } from "@/components/brand/Logo";
import { api } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

const STEPS = ["Payment initiated", "Payment received", "Confirming subscription", "Plan activation"];

function CompleteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session") ?? "";
  const demo = params.get("demo") === "1";
  const cancelled = params.get("success") === "false" || params.get("cancelled") === "true";
  const [step, setStep] = useState(0);
  const [missing, setMissing] = useState(false);
  const demoStarted = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      setMissing(true);
      return;
    }
    if (cancelled) {
      router.replace(`/checkout/cancelled?session=${sessionId}`);
      return;
    }

    let stopped = false;
    const timer = setInterval(() => setStep((s) => Math.min(3, s + 1)), 700);
    if (demo && !demoStarted.current) {
      demoStarted.current = true;
      window.setTimeout(() => {
        void api.demoComplete(sessionId).catch(() => undefined);
      }, 1800);
    }

    async function tick() {
      try {
        const { session } = await api.getCheckout(sessionId);
        if (stopped) return;
        if (session.status === "paid" || session.status === "already_paid") {
          router.replace(`/checkout/success?session=${sessionId}`);
        } else if (session.status === "failed") {
          router.replace(`/checkout/failed?session=${sessionId}`);
        } else if (session.status === "cancelled") {
          router.replace(`/checkout/cancelled?session=${sessionId}`);
        } else if (session.status === "pending") {
          router.replace(`/checkout/pending?session=${sessionId}`);
        }
      } catch {
        /* keep showing processing until we know */
      }
    }

    void tick();
    const poll = setInterval(() => void tick(), 1200);
    return () => {
      stopped = true;
      clearInterval(timer);
      clearInterval(poll);
    };
  }, [sessionId, demo, cancelled, router]);

  if (missing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <Logo />
        <h1 className="mt-8 text-3xl font-semibold">We&apos;re checking your payment status...</h1>
        <p className="mt-3 text-ink-soft">Return to checkout to continue. Don&apos;t start a new payment yet.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo />
      <div className="mt-8 h-12 w-12 animate-spin rounded-full border-2 border-ink/15 border-t-ink" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Processing your payment</h1>
      <p className="mt-3 max-w-md text-ink-soft">Please don&apos;t close this page while we confirm your payment.</p>
      <ol className="mt-8 w-full max-w-sm space-y-3 text-left">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-3 text-sm">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${i <= step ? "bg-success text-white" : "bg-[var(--bg-warm)] text-ink-faint"}`}>
              {i < step ? "✓" : i + 1}
            </span>
            <span className={i <= step ? "font-medium" : "text-ink-faint"}>
              {label}
              {i === step ? "..." : i < step ? " ✓" : ""}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function CheckoutCompletePage() {
  return (
    <Suspense fallback={<StatusScreen title="Processing your payment" body="Please don't close this page while we confirm your payment." />}>
      <CompleteInner />
    </Suspense>
  );
}

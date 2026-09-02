"use client";

import { StatusScreen } from "@/components/billing/StatusScreen";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useCheckoutDraft } from "@/lib/checkout-store";
import { cx } from "@/lib/cn";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  PLAN_DEFINITIONS,
  formatMoney,
  type BillingInterval,
  type PlanId,
} from "@clipora/shared";
import { CreditCard, Lock, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function CheckoutInner() {
  const router = useRouter();
  const params = useSearchParams();
  const planId = ((params.get("plan") as PlanId) || useCheckoutDraft.getState().planId);
  const interval = ((params.get("interval") as BillingInterval) || useCheckoutDraft.getState().interval);
  const setPlan = useCheckoutDraft((s) => s.setPlan);
  const setCustomer = useCheckoutDraft((s) => s.setCustomer);
  const setSessionId = useCheckoutDraft((s) => s.setSessionId);
  const storedName = useCheckoutDraft((s) => s.name);
  const storedEmail = useCheckoutDraft((s) => s.email);
  const storedPhone = useCheckoutDraft((s) => s.phone);
  const storedMethod = useCheckoutDraft((s) => s.method);
  const plan = PLAN_DEFINITIONS[planId] ?? PLAN_DEFINITIONS.creator;

  const [name, setName] = useState(storedName);
  const [email, setEmail] = useState(storedEmail);
  const [phone, setPhone] = useState(storedPhone);
  const [method, setMethod] = useState(storedMethod || "card");
  const [signedIn, setSignedIn] = useState<string | null>(null);
  const [methods, setMethods] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [demo, setDemo] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = interval === "yearly" ? plan.egpYearly : plan.egpMonthly;
  const amountLabel = formatMoney(amount, "EGP");

  useEffect(() => {
    setPlan(planId, interval);
  }, [planId, interval, setPlan]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase?.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setSignedIn(data.user.email);
        setEmail(data.user.email);
      }
    });
    api.billingConfig().then((config) => {
      setDemo(config.demo);
      setMethods(config.methods);
      if (config.methods[0] && !config.methods.some((item) => item.id === method)) {
        setMethod(config.methods[0].id);
      }
    }).catch(() => {
      setMethods([
        { id: "card", name: "Bank card", description: "Visa, Mastercard, and Meeza" },
        { id: "wallet", name: "Mobile wallet", description: "Vodafone Cash, Orange Cash, and others" },
      ]);
    });
  }, [method]);

  async function pay() {
    setError(null);
    if (!name.trim() || !email.trim() || phone.trim().length < 8) {
      setError("Please add your name, email, and mobile number so we can confirm your payment.");
      return;
    }
    setSubmitting(true);
    setCustomer({ name, email, phone, method });
    try {
      const supabase = getSupabaseBrowserClient();
      const token = (await supabase?.auth.getSession())?.data.session?.access_token;
      const { session } = await api.createCheckout({ planId, interval, name, email, phone }, token);
      setSessionId(session.id);
      const result = await api.payCheckout(session.id, method);
      if (result.alreadyPaid) {
        router.push(`/checkout/success?session=${session.id}`);
        return;
      }
      setRedirecting(true);
      const target = result.checkoutUrl || result.redirectUrl;
      if (target?.startsWith("http")) {
        window.location.href = target;
        return;
      }
      router.push(target || `/checkout/complete?session=${session.id}&demo=1`);
    } catch (err) {
      setSubmitting(false);
      setRedirecting(false);
      setError(err instanceof Error ? err.message : "We couldn't start payment. Please try again.");
    }
  }

  if (redirecting) {
    return (
      <StatusScreen
        title="Redirecting you to secure payment..."
        body="Paymob is opening a secure checkout. Please don't close this page."
      />
    );
  }

  return (
    <div className="min-h-screen">
      <header className="flex h-14 items-center justify-between border-b border-[var(--line)] bg-white/70 px-4">
        <Logo />
        <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
          <Lock size={13} /> Secure payment
        </p>
      </header>
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-12">
        <div>
          <Link href={`/pricing?interval=${interval}`} className="text-sm font-medium text-ink-soft hover:text-ink">
            ← Back to pricing
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Complete your purchase</h1>
          <p className="mt-2 text-ink-soft">You&apos;re one step away from unlocking your {plan.name} plan.</p>
          <p className="mt-3 text-sm font-medium text-success">{plan.name} Plan selected ✓</p>
          <p className="text-sm text-ink-soft">Let&apos;s get your account ready.</p>

          <div className="card mt-8 p-5">
            <h2 className="font-semibold">Your details</h2>
            {signedIn ? (
              <p className="mt-2 text-sm text-ink-soft">
                You&apos;re purchasing as: <span className="font-semibold text-ink">{signedIn}</span>
              </p>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">We only need what&apos;s required to confirm your payment.</p>
            )}
            <div className="mt-4 space-y-3">
              <Field label="Full Name" value={name} onChange={setName} placeholder="Your name" />
              <Field label="Email Address" value={email} onChange={setEmail} placeholder="you@email.com" type="email" />
              <Field label="Mobile number" value={phone} onChange={setPhone} placeholder="+20 1..." />
            </div>
          </div>

          <div className="card mt-5 p-5">
            <h2 className="font-semibold">Payment method</h2>
            <p className="mt-1 text-sm text-ink-soft">Secure payment powered by Paymob</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(methods.length ? methods : [
                { id: "card", name: "Bank card", description: "Visa, Mastercard, and Meeza" },
                { id: "wallet", name: "Mobile wallet", description: "Vodafone Cash, Orange Cash, and others" },
              ]).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMethod(item.id)}
                  className={cx(
                    "rounded-2xl border p-4 text-left",
                    method === item.id ? "border-ink shadow-[0_0_0_1px_#121211]" : "border-[var(--line)]",
                  )}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    {item.id === "wallet" ? <Smartphone size={16} /> : <CreditCard size={16} />}
                    {item.name}
                  </span>
                  <span className="mt-1 block text-sm text-ink-soft">{item.description}</span>
                </button>
              ))}
            </div>
            {demo && (
              <p className="mt-4 rounded-2xl bg-[var(--bg-warm)] px-3 py-2 text-sm text-ink-soft">
                Paymob keys aren&apos;t configured yet, so checkout will use a secure demo confirmation. Live charges happen only with Paymob credentials.
              </p>
            )}
          </div>
        </div>

        <aside className="h-fit lg:sticky lg:top-8">
          <div className="card p-5">
            <h2 className="font-semibold">Order Summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <Row k="Plan" v={`${plan.name} Plan`} />
              <Row k="Billing frequency" v={interval === "yearly" ? "Yearly" : "Monthly"} />
              <Row k="Subscription" v={amountLabel} />
              <Row k="Subtotal" v={amountLabel} />
              <Row k="Tax" v="EGP 0" />
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-4">
              <p className="font-semibold">Total</p>
              <p className="text-2xl font-semibold">{amountLabel}</p>
            </div>
            <p className="mt-3 text-xs text-ink-faint">
              You&apos;re paying {plan.name} Plan. {interval === "yearly" ? "Charged once today for 12 months." : "Charged today, then monthly until you cancel."} Cancel anytime from Billing.
            </p>
            <Link href={`/pricing?interval=${interval}`} className="mt-3 inline-block text-sm font-medium text-ink-soft">
              Change plan
            </Link>
            {error && <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>}
            <Button className="mt-5 w-full" size="lg" onClick={() => void pay()} disabled={submitting}>
              {submitting ? "Processing payment..." : `Continue to secure payment →`}
            </Button>
            <p className="mt-3 text-center text-xs text-ink-faint">
              Your payment information is handled securely. Powered by Paymob.
            </p>
          </div>
        </aside>
      </div>
      <div className="sticky-cta sticky bottom-0 border-t border-[var(--line)] bg-[var(--bg)] px-4 py-3 lg:hidden">
        <Button className="w-full" size="lg" onClick={() => void pay()} disabled={submitting}>
          {submitting ? "Processing payment..." : `Pay ${amountLabel}`}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 h-12 w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--bg)] px-4 outline-none focus:shadow-[0_0_0_4px_var(--accent-soft)]"
      />
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-ink-soft">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutInner />
    </Suspense>
  );
}


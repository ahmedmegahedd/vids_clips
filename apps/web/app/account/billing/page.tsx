"use client";

import { UsageMeter } from "@/components/billing/UsageMeter";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PLAN_DEFINITIONS, formatMoney, type InvoiceRecord, type SubscriptionRecord, type UsageResponse } from "@clipora/shared";
import { useEffect, useState } from "react";

export default function BillingPage() {
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [sub, setSub] = useState<SubscriptionRecord | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [busy, setBusy] = useState(false);

  async function token() {
    const supabase = getSupabaseBrowserClient();
    return (await supabase?.auth.getSession())?.data.session?.access_token;
  }

  useEffect(() => {
    async function load() {
      const access = await token();
      try {
        const [u, s] = await Promise.all([api.getUsage(access), api.getSubscription(access)]);
        setUsage(u);
        setSub(s.subscription);
        setInvoices(s.invoices);
      } catch {
        /* Demo mode still shows a free plan state. */
      }
    }
    void load();
  }, []);

  async function cancel() {
    setBusy(true);
    try {
      const next = await api.cancelSubscription(await token());
      setSub(next.subscription);
      setCancelOpen(false);
      setCancelled(true);
    } finally {
      setBusy(false);
    }
  }

  async function reactivate() {
    setBusy(true);
    try {
      const next = await api.reactivateSubscription(await token());
      setSub(next.subscription);
      setCancelled(false);
    } finally {
      setBusy(false);
    }
  }

  const plan = PLAN_DEFINITIONS[sub?.planId ?? "free"];
  const ends = sub?.cancelAt || sub?.renewsAt;
  const endsLabel = ends
    ? new Date(ends).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : "the end of your billing period";

  return (
    <div className="min-h-screen">
      <AppHeader billing />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Billing & Subscription</h1>
        {cancelled && (
          <div className="card mt-6 p-5">
            <h2 className="text-xl font-semibold">Subscription cancelled</h2>
            <p className="mt-2 text-ink-soft">Your subscription will remain active until {endsLabel}.</p>
            <p className="mt-1 text-sm text-ink-soft">You can continue using your remaining allowance until then.</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button href="/create">Continue Creating Clips</Button>
              <Button variant="secondary" onClick={() => void reactivate()} disabled={busy}>
                Reactivate Subscription
              </Button>
            </div>
          </div>
        )}

        <div className="card mt-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-ink-faint">Current plan</p>
              <h2 className="text-2xl font-semibold">
                {plan.name} Plan — {sub?.status === "cancelling" ? "Cancelling" : sub?.status === "active" ? "Active" : "Free"}
              </h2>
              <p className="mt-1 text-ink-soft">
                {sub && sub.amount > 0 ? `${formatMoney(sub.amount, "EGP")} / ${sub.interval === "yearly" ? "year" : "month"}` : "No charge"}
              </p>
              {sub?.renewsAt && sub.status === "active" && (
                <p className="mt-1 text-sm text-ink-soft">
                  Next billing date: {new Date(sub.renewsAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                </p>
              )}
              {sub?.status === "cancelling" && <p className="mt-1 text-sm">Access ends: {endsLabel}</p>}
              {sub?.paymentMethod && <p className="mt-1 text-sm text-ink-faint">Payment method: {sub.paymentMethod}</p>}
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button href={`/pricing?current=${plan.id}&upgrade=1`} variant="secondary">
              Change Plan
            </Button>
            {sub?.status === "active" && (
              <Button variant="ghost" onClick={() => setCancelOpen(true)}>
                Cancel Subscription
              </Button>
            )}
          </div>
        </div>

        {usage && <div className="mt-6"><UsageMeter usage={usage} /></div>}

        <div className="mt-10">
          <h2 className="text-xl font-semibold">Payment History</h2>
          {invoices.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">No payments yet.</p>
          ) : (
            <div className="card mt-4 divide-y divide-[var(--line)]">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
                  <span>{new Date(invoice.date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</span>
                  <span className="font-medium">{PLAN_DEFINITIONS[invoice.planId].name}</span>
                  <span>{formatMoney(invoice.amount, invoice.currency)}</span>
                  <span className="capitalize text-success">{invoice.status}</span>
                  <button type="button" className="font-semibold">View Invoice</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setCancelOpen(false)}>
          <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold">Cancel your subscription?</h2>
            <p className="mt-2 text-sm text-ink-soft">You&apos;ll keep access to your current plan until the end of your billing period.</p>
            <p className="mt-3 text-sm font-medium">Access ends: {endsLabel}</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" className="flex-1" onClick={() => void cancel()} disabled={busy}>
                Cancel Subscription
              </Button>
              <Button className="flex-1" onClick={() => setCancelOpen(false)}>
                Keep My Plan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

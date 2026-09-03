"use client";

import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { PageHeader } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatEgp } from "@/lib/admin/format";
import { savingsCopy, useAdminStore } from "@/lib/admin/store";
import { useState } from "react";

export default function PlansPage() {
  const plans = useAdminStore((s) => s.plans);
  const duplicate = useAdminStore((s) => s.duplicatePlan);
  const disable = useAdminStore((s) => s.disablePlan);
  const [disableId, setDisableId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-5">
      <PageHeader title="Plans & Pricing" description="Control the plans customers see and subscribe to.">
        <Button href="/admin/plans/new">+ Create Plan</Button>
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => (
          <article key={plan.id} className="admin-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                <p className="mt-1 text-sm text-ink-soft">{plan.description}</p>
              </div>
              <StatusBadge kind="plan" value={plan.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Price</p><p className="font-semibold">{formatEgp(plan.monthlyPrice)} / mo</p></div>
              <div><p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Billing period</p><p className="font-semibold">Monthly or yearly</p></div>
              <div><p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Usage limit</p><p className="font-semibold">{plan.videosPerMonth} videos / month</p></div>
              <div><p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Subscribers</p><p className="font-semibold">{plan.subscribers.toLocaleString()}</p></div>
            </dl>
            <p className="mt-3 text-xs text-ink-faint">Revenue {formatEgp(plan.revenue)} · {savingsCopy(plan.monthlyPrice, plan.yearlyPrice)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" href={`/admin/plans/${plan.id}`}>Edit</Button>
              <Button size="sm" variant="secondary" onClick={() => duplicate(plan.id)}>Duplicate</Button>
              {plan.status === "active" && (
                <Button size="sm" variant="secondary" onClick={() => setDisableId(plan.id)}>Disable</Button>
              )}
            </div>
          </article>
        ))}
      </div>
      <ConfirmModal
        open={Boolean(disableId)}
        title="Disable this plan?"
        body="New users will no longer be able to subscribe to this plan. Existing subscribers will not automatically be affected."
        confirmLabel="Disable Plan"
        loadingLabel="Disabling..."
        danger
        confirming={busy}
        onClose={() => setDisableId(null)}
        onConfirm={() => {
          if (!disableId) return;
          setBusy(true);
          window.setTimeout(() => {
            disable(disableId);
            setBusy(false);
            setDisableId(null);
          }, 400);
        }}
      />
    </div>
  );
}

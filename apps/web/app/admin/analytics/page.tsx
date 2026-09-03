"use client";

import { AreaChart, Funnel, GroupedBars } from "@/components/admin/Charts";
import { KpiCard } from "@/components/admin/KpiCard";
import { PageHeader } from "@/components/admin/EmptyState";
import { DATE_PRESETS } from "@/components/admin/FilterPanel";
import { Button } from "@/components/ui/Button";
import { exportCsv } from "@/lib/admin/csv";
import { formatEgp, formatNumber } from "@/lib/admin/format";
import { useAdminStore } from "@/lib/admin/store";
import { useState } from "react";

export default function AnalyticsPage() {
  const analytics = useAdminStore((s) => s.analytics);
  const revenueSeries = useAdminStore((s) => s.revenueSeries);
  const growthSeries = useAdminStore((s) => s.growthSeries);
  const [range, setRange] = useState("30d");

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Deeper analysis of users, revenue, subscriptions, and product usage.">
        <div className="flex flex-wrap gap-2">
          <select value={range} onChange={(e) => setRange(e.target.value)} className="h-10 rounded-xl border border-[var(--line-strong)] bg-white px-3 text-sm font-semibold">
            {DATE_PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <Button size="sm" variant="secondary" onClick={() => exportCsv("analytics.csv", [
            { metric: "Total users", value: analytics.users.total },
            { metric: "Monthly revenue", value: analytics.revenue.thisMonth },
            { metric: "Active subscriptions", value: analytics.subscriptions.active },
            { metric: "Videos processed", value: analytics.product.videosProcessed },
          ])}>Export CSV</Button>
        </div>
      </PageHeader>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Users</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard label="Total users" value={formatNumber(analytics.users.total)} />
          <KpiCard label="New registrations" value={formatNumber(analytics.users.newRegistrations)} />
          <KpiCard label="Active users" value={formatNumber(analytics.users.active)} />
          <KpiCard label="Returning users" value={formatNumber(analytics.users.returning)} />
          <KpiCard label="User growth" value={`${analytics.users.growth}%`} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Revenue</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Revenue this month" value={formatEgp(analytics.revenue.thisMonth)} />
          <KpiCard label="Revenue last month" value={formatEgp(analytics.revenue.lastMonth)} />
          <KpiCard label="Growth" value={`${analytics.revenue.growth}%`} />
          <KpiCard label="Average customer value" value={formatEgp(analytics.revenue.arpu)} />
          <KpiCard label="Recurring revenue" value={formatEgp(analytics.revenue.recurring)} />
          <KpiCard label="Refunds" value={formatEgp(analytics.revenue.refunds)} />
          <KpiCard label="Failed payments" value={formatNumber(analytics.revenue.failedPayments)} />
          <KpiCard label="Payment success rate" value={`${analytics.revenue.successRate}%`} />
        </div>
        <div className="admin-card p-5">
          <h3 className="font-semibold">Revenue over time</h3>
          <div className="mt-4"><AreaChart data={revenueSeries["12m"]} /></div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="admin-card p-5">
          <h2 className="text-lg font-semibold">Subscriptions</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              ["Active subscriptions", analytics.subscriptions.active],
              ["New subscriptions", analytics.subscriptions.created],
              ["Cancellations", analytics.subscriptions.cancellations],
              ["Expired subscriptions", analytics.subscriptions.expired],
              ["Upgrades", analytics.subscriptions.upgrades],
              ["Downgrades", analytics.subscriptions.downgrades],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-2xl bg-[var(--bg)] px-3 py-3">
                <p className="text-xs text-ink-soft">{k}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{Number(v).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-card p-5">
          <h2 className="text-lg font-semibold">Plan performance</h2>
          <div className="mt-4 space-y-4">
            {analytics.planPerformance.map((plan) => (
              <div key={plan.planId} className="rounded-2xl border border-[var(--line)] p-3">
                <p className="font-semibold">{plan.name}</p>
                <p className="mt-1 text-sm text-ink-soft">Users: {plan.users.toLocaleString()}</p>
                <p className="text-sm text-ink-soft">Revenue: {formatEgp(plan.revenue)}</p>
                <p className="text-sm text-ink-soft">Share: {plan.percent}%</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="admin-card p-5">
          <h2 className="text-lg font-semibold">User retention</h2>
          <p className="mt-1 text-xs text-ink-faint">Compare new, returning, active, and churned users.</p>
          <div className="mt-4">
            <GroupedBars
              data={analytics.retention}
              keys={[
                { key: "newUsers", label: "New Users", color: "#121211" },
                { key: "returningUsers", label: "Returning Users", color: "#6a6860" },
                { key: "activeUsers", label: "Active Users", color: "#1f8a5b" },
                { key: "churnedUsers", label: "Churned Users", color: "#ff3d2e" },
              ]}
            />
          </div>
        </div>
        <div className="admin-card p-5">
          <h2 className="text-lg font-semibold">Conversion funnel</h2>
          <div className="mt-4"><Funnel steps={analytics.funnel} /></div>
        </div>
      </section>

      <section className="admin-card p-5">
        <h2 className="text-lg font-semibold">Product usage</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Videos processed" value={formatNumber(analytics.product.videosProcessed)} />
          <KpiCard label="Clips created" value={formatNumber(analytics.product.clipsCreated)} />
          <KpiCard label="Average clips per user" value={String(analytics.product.avgClipsPerUser)} />
          <KpiCard label="Processing volume" value={formatNumber(analytics.product.processingVolume)} />
        </div>
        <div className="mt-6">
          <GroupedBars
            data={growthSeries.monthly}
            keys={[
              { key: "newUsers", label: "New Users", color: "#121211" },
              { key: "activeUsers", label: "Active Users", color: "#6a6860" },
              { key: "payingUsers", label: "Paying Users", color: "#ff3d2e" },
            ]}
          />
        </div>
      </section>
    </div>
  );
}

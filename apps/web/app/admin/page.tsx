"use client";

import { AreaChart, GroupedBars } from "@/components/admin/Charts";
import { KpiCard } from "@/components/admin/KpiCard";
import { SeverityDot, StatusBadge } from "@/components/admin/StatusBadge";
import { Segmented } from "@/components/admin/FilterPanel";
import { formatDate, formatEgp, formatNumber, greeting, relativeTime } from "@/lib/admin/format";
import { useAdminStore } from "@/lib/admin/store";
import { getCurrentUser } from "@/lib/auth/session";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function AdminDashboardPage() {
  const metrics = useAdminStore((s) => s.metrics);
  const revenueSeries = useAdminStore((s) => s.revenueSeries);
  const growthSeries = useAdminStore((s) => s.growthSeries);
  const planBreakdown = useAdminStore((s) => s.planBreakdown);
  const activity = useAdminStore((s) => s.activity);
  const alerts = useAdminStore((s) => s.alerts);
  const users = useAdminStore((s) => s.users);
  const payments = useAdminStore((s) => s.payments);
  const subscriptions = useAdminStore((s) => s.subscriptions);
  const services = useAdminStore((s) => s.services);
  const compare = useAdminStore((s) => s.comparePrevious);
  const setCompare = useAdminStore((s) => s.setComparePrevious);
  const [name, setName] = useState("Admin");
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "12m">("30d");
  const [metric, setMetric] = useState<"revenue" | "subscriptions" | "payments" | "refunds">("revenue");
  const [growthView, setGrowthView] = useState<"daily" | "weekly" | "monthly">("monthly");

  useEffect(() => {
    void getCurrentUser().then((user) => setName(user?.name ?? "Admin"));
  }, []);

  const spark = useMemo(() => revenueSeries["30d"].map((p) => p.value), [revenueSeries]);
  const chart = useMemo(() => {
    const series = revenueSeries[range];
    if (metric === "refunds") return series.map((p) => ({ ...p, value: Math.round(p.value * 0.007) }));
    if (metric === "payments") return series.map((p) => ({ ...p, value: Math.round(p.value / 2200) }));
    if (metric === "subscriptions") return series.map((p) => ({ ...p, value: Math.round(p.value / 2100) }));
    return series;
  }, [metric, range, revenueSeries]);

  const recentUsers = [...users].sort((a, b) => b.joinedAt.localeCompare(a.joinedAt)).slice(0, 5);
  const recentPayments = [...payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const expiring = subscriptions.filter((s) => s.status === "active" && s.nextBillingDate && daysUntil(s.nextBillingDate) <= 14).slice(0, 5);
  const usageHot = users.filter((u) => u.videosLimit > 0 && u.videosUsed / u.videosLimit >= 0.9).length;
  const healthy = services.every((s) => s.status === "operational");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[30px]">{greeting(name.split(" ")[0] ?? "Admin")}</h1>
          <p className="mt-1 text-sm text-ink-soft">Here’s what’s happening across your platform.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold">{metrics.periodLabel}</span>
          <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold">
            <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
            Compare to previous period
          </label>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard label="Total Users" value={formatNumber(metrics.totalUsers)} change={compare ? metrics.totalUsersChange : undefined} spark={spark} />
        <KpiCard label="Active Users" value={formatNumber(metrics.activeUsers)} change={compare ? metrics.activeUsersChange : undefined} spark={spark.map((n) => n * 0.4)} />
        <KpiCard label="Paying Customers" value={formatNumber(metrics.payingCustomers)} change={compare ? metrics.payingCustomersChange : undefined} spark={spark.map((n) => n * 0.18)} />
        <KpiCard label="Monthly Revenue" value={formatEgp(metrics.monthlyRevenue)} change={compare ? metrics.monthlyRevenueChange : undefined} spark={spark} />
        <KpiCard label="Videos Processed" value={formatNumber(metrics.videosProcessed)} change={compare ? metrics.videosProcessedChange : undefined} spark={spark.map((n) => n * 0.3)} />
        <KpiCard label="Clips Created" value={formatNumber(metrics.clipsCreated)} change={compare ? metrics.clipsCreatedChange : undefined} spark={spark.map((n) => n * 0.7)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className="admin-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Revenue</h2>
              <p className="text-xs text-ink-faint">{healthy ? "Platform health looks stable." : "Some systems need attention."}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Segmented value={metric} onChange={setMetric} options={[
                { value: "revenue", label: "Revenue" },
                { value: "subscriptions", label: "Subscriptions" },
                { value: "payments", label: "Payments" },
                { value: "refunds", label: "Refunds" },
              ]} />
              <Segmented value={range} onChange={setRange} options={[
                { value: "7d", label: "7 days" },
                { value: "30d", label: "30 days" },
                { value: "90d", label: "90 days" },
                { value: "12m", label: "12 months" },
              ]} />
            </div>
          </div>
          <div className="mt-4">
            <AreaChart data={chart} />
          </div>
        </section>

        <section className="admin-card p-5">
          <h2 className="text-lg font-semibold">Alerts</h2>
          <div className="mt-4 space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-2xl border border-[var(--line)] p-3">
                <div className="flex items-start gap-2">
                  <SeverityDot severity={alert.severity} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{alert.title}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">{alert.description}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-ink-faint">{relativeTime(alert.time)}</span>
                      <Link href={alert.href} className="font-semibold">
                        {alert.actionLabel} →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="admin-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">User growth</h2>
            <Segmented value={growthView} onChange={setGrowthView} options={[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
            ]} />
          </div>
          <div className="mt-4">
            <GroupedBars
              data={growthSeries[growthView]}
              keys={[
                { key: "newUsers", label: "New Users", color: "#121211" },
                { key: "activeUsers", label: "Active Users", color: "#6a6860" },
                { key: "payingUsers", label: "Paying Users", color: "#ff3d2e" },
              ]}
            />
          </div>
        </section>

        <section className="admin-card p-5">
          <h2 className="text-lg font-semibold">Subscriptions</h2>
          <div className="mt-4 space-y-3">
            {planBreakdown.map((plan) => (
              <div key={plan.planId}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{plan.name}</span>
                  <span className="tabular-nums text-ink-soft">{formatNumber(plan.users)} · {plan.percent}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--bg-warm)]">
                  <div className="h-full rounded-full bg-ink" style={{ width: `${Math.min(plan.percent, 100)}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-ink-faint">Revenue contribution {formatEgp(plan.revenue)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Widget title="Recent activity" href="/admin/activity" cta="View activity">
          {activity.slice(0, 6).map((item) => (
            <Link key={item.id} href={item.href} className="block rounded-xl px-2 py-2 hover:bg-[var(--bg)]">
              <p className="text-sm font-medium">{item.description}</p>
              <p className="text-[11px] text-ink-faint">{relativeTime(item.time)}</p>
            </Link>
          ))}
        </Widget>
        <Widget title="New Users" href="/admin/users" cta="View All Users">
          {recentUsers.map((user) => (
            <Link key={user.id} href={`/admin/users/${user.id}`} className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-[var(--bg)]">
              <span>
                <span className="block text-sm font-medium">{user.name}</span>
                <span className="block text-[11px] text-ink-faint">{relativeTime(user.joinedAt)}</span>
              </span>
              <StatusBadge kind="user" value={user.status} />
            </Link>
          ))}
        </Widget>
        <Widget title="Recent Payments" href="/admin/payments" cta="View Payments">
          {recentPayments.map((pay) => (
            <Link key={pay.id} href={`/admin/payments/${pay.id}`} className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-[var(--bg)]">
              <span>
                <span className="block text-sm font-medium">{pay.planName} — {formatEgp(pay.amount)}</span>
                <span className="block text-[11px] text-ink-faint">{pay.userName}</span>
              </span>
              <StatusBadge kind="payment" value={pay.status} />
            </Link>
          ))}
        </Widget>
        <Widget title="Subscriptions Expiring Soon" href="/admin/subscriptions?filter=expiring" cta="View All">
          {expiring.length === 0 ? <p className="px-2 py-4 text-sm text-ink-faint">No subscriptions expiring soon.</p> : expiring.map((sub) => (
            <Link key={sub.id} href={`/admin/users/${sub.userId}`} className="block rounded-xl px-2 py-2 hover:bg-[var(--bg)]">
              <p className="text-sm font-medium">{sub.userName}</p>
              <p className="text-[11px] text-ink-faint">{sub.planName} · {formatDate(sub.nextBillingDate, false)}</p>
            </Link>
          ))}
          <div className="mt-2 rounded-xl bg-[var(--bg)] px-3 py-2 text-xs text-ink-soft">
            {usageHot} users have used more than 90% of their monthly allowance.{" "}
            <Link href="/admin/users?usage=limit" className="font-semibold text-ink">View Users →</Link>
          </div>
        </Widget>
      </div>
    </div>
  );
}

function Widget({ title, href, cta, children }: { title: string; href: string; cta: string; children: React.ReactNode }) {
  return (
    <section className="admin-card flex flex-col p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-3 flex-1">{children}</div>
      <Link href={href} className="mt-3 text-xs font-semibold">
        {cta} →
      </Link>
    </section>
  );
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - new Date("2026-09-03T10:00:00.000Z").getTime()) / 86400000);
}

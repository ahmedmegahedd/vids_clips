"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { Segmented } from "@/components/admin/FilterPanel";
import { PageHeader } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { exportCsv } from "@/lib/admin/csv";
import { formatDate, formatEgp } from "@/lib/admin/format";
import { useAdminStore } from "@/lib/admin/store";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

function SubscriptionsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const subscriptions = useAdminStore((s) => s.subscriptions);
  const [filter, setFilter] = useState(params.get("filter") ?? "all");
  const [windowDays, setWindowDays] = useState<"7" | "30" | "60">("30");
  const [page, setPage] = useState(1);
  const now = new Date("2026-09-03T10:00:00.000Z").getTime();

  const filtered = useMemo(() => {
    return subscriptions.filter((s) => {
      if (filter === "active") return s.status === "active";
      if (filter === "cancelled") return s.status === "cancelled" || s.status === "cancelling";
      if (filter === "expired") return s.status === "expired";
      if (filter === "failed") return s.paymentFailed || s.status === "past_due";
      if (filter === "expiring") {
        if (!s.nextBillingDate || s.status !== "active") return false;
        const days = (new Date(s.nextBillingDate).getTime() - now) / 86400000;
        return days >= 0 && days <= Number(windowDays);
      }
      return true;
    });
  }, [subscriptions, filter, windowDays, now]);

  return (
    <div className="space-y-5">
      <PageHeader title="Subscriptions" description="Every active and inactive subscription on the platform.">
        <Button size="sm" variant="secondary" onClick={() => exportCsv("subscriptions.csv", filtered.map((s) => ({ user: s.userName, plan: s.planName, status: s.status, price: s.price })))}>
          Export CSV
        </Button>
      </PageHeader>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          value={filter}
          onChange={(v) => { setFilter(v); setPage(1); }}
          options={[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "expiring", label: "Expiring Soon" },
            { value: "cancelled", label: "Cancelled" },
            { value: "expired", label: "Expired" },
            { value: "failed", label: "Payment Failed" },
          ]}
        />
        {filter === "expiring" && (
          <Segmented value={windowDays} onChange={setWindowDays} options={[{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "60", label: "60 days" }]} />
        )}
      </div>
      <AdminTable
        columns={[
          { key: "user", header: "User", render: (s) => <div><p className="font-semibold">{s.userName}</p><p className="text-xs text-ink-faint">{s.email}</p></div> },
          { key: "plan", header: "Plan", render: (s) => s.planName },
          { key: "status", header: "Status", render: (s) => <StatusBadge kind="subscription" value={s.status} /> },
          { key: "price", header: "Price", render: (s) => formatEgp(s.price) },
          { key: "cycle", header: "Billing Cycle", render: (s) => s.billingCycle === "yearly" ? "Yearly" : "Monthly" },
          { key: "start", header: "Start Date", render: (s) => formatDate(s.startDate, false) },
          { key: "next", header: "Next Billing Date", render: (s) => formatDate(s.nextBillingDate, false) },
          { key: "end", header: "End Date", render: (s) => formatDate(s.endDate, false) },
          { key: "renew", header: "Auto Renewal", render: (s) => s.autoRenewal ? "Enabled" : "Off" },
          { key: "actions", header: "Actions", render: () => <span className="text-xs font-semibold">Manage</span> },
        ]}
        rows={filtered.slice((page - 1) * 10, page * 10)}
        total={filtered.length}
        page={page}
        onPageChange={setPage}
        onRowClick={(s) => router.push(`/admin/users/${s.userId}`)}
        emptyTitle="No subscriptions found"
        emptyBody="Subscriptions will appear here as customers start paying."
      />
    </div>
  );
}

export default function SubscriptionsPage() {
  return <Suspense><SubscriptionsInner /></Suspense>;
}

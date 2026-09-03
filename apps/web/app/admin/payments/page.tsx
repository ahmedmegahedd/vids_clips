"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { FieldSelect, FilterPanel } from "@/components/admin/FilterPanel";
import { KpiCard } from "@/components/admin/KpiCard";
import { PageHeader } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { exportCsv } from "@/lib/admin/csv";
import { formatDate, formatEgp, formatNumber } from "@/lib/admin/format";
import { useAdminStore } from "@/lib/admin/store";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

function PaymentsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const payments = useAdminStore((s) => s.payments);
  const metrics = useAdminStore((s) => s.metrics);
  const plans = useAdminStore((s) => s.plans);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(params.get("status") ?? "all");
  const [plan, setPlan] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const hay = `${p.transactionId} ${p.userName} ${p.email} ${p.id}`.toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return false;
      if (status !== "all" && p.status !== status) return false;
      if (plan !== "all" && p.planId !== plan) return false;
      return true;
    });
  }, [payments, q, status, plan]);

  return (
    <div className="space-y-5">
      <PageHeader title="Payments" description="Monitor every transaction without exposing card details.">
        <Button size="sm" variant="secondary" onClick={() => exportCsv("payments.csv", filtered.map((p) => ({ transaction: p.transactionId, user: p.userName, amount: p.amount, status: p.status, date: p.date })))}>
          Export CSV
        </Button>
      </PageHeader>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard label="Total Payments" value={formatNumber(metrics.totalPaymentCount)} />
        <KpiCard label="Successful" value={formatNumber(metrics.successfulPayments)} />
        <KpiCard label="Pending" value={formatNumber(metrics.pendingPayments)} />
        <KpiCard label="Failed" value={formatNumber(metrics.failedPayments)} />
        <KpiCard label="Refunded" value={formatNumber(metrics.refundedPayments)} />
        <KpiCard label="Revenue" value={formatEgp(metrics.monthlyRevenue)} />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search payments..." className="h-10 flex-1 rounded-xl border border-[var(--line-strong)] bg-white px-3 text-sm outline-none" />
        <FilterPanel onClear={() => { setStatus("all"); setPlan("all"); }}>
          <FieldSelect label="Status" value={status} onChange={setStatus} options={[{ value: "all", label: "All" }, { value: "paid", label: "Successful" }, { value: "pending", label: "Pending" }, { value: "failed", label: "Failed" }, { value: "refunded", label: "Refunded" }]} />
          <FieldSelect label="Plan" value={plan} onChange={setPlan} options={[{ value: "all", label: "All plans" }, ...plans.map((p) => ({ value: p.id, label: p.name }))]} />
        </FilterPanel>
      </div>
      <AdminTable
        columns={[
          { key: "txn", header: "Transaction", render: (p) => <span className="font-mono text-xs font-semibold">{p.transactionId}</span> },
          { key: "user", header: "User", render: (p) => p.userName },
          { key: "email", header: "Email", render: (p) => <span className="text-ink-soft">{p.email}</span> },
          { key: "plan", header: "Plan", render: (p) => p.planName },
          { key: "amount", header: "Amount", render: (p) => formatEgp(p.amount) },
          { key: "method", header: "Payment Method", render: (p) => p.method },
          { key: "status", header: "Status", render: (p) => <StatusBadge kind="payment" value={p.status} /> },
          { key: "date", header: "Date", render: (p) => formatDate(p.date, false) },
          { key: "actions", header: "Actions", render: () => <span className="text-xs font-semibold">View</span> },
        ]}
        rows={filtered.slice((page - 1) * 10, page * 10)}
        total={filtered.length}
        page={page}
        onPageChange={setPage}
        onRowClick={(p) => router.push(`/admin/payments/${p.id}`)}
        emptyTitle="No payments found"
        emptyBody="Payments will appear here once customers complete transactions."
      />
    </div>
  );
}

export default function PaymentsPage() {
  return <Suspense><PaymentsInner /></Suspense>;
}

"use client";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatDateTime, formatEgp } from "@/lib/admin/format";
import { useAdminStore } from "@/lib/admin/store";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const payment = useAdminStore((s) => s.payments.find((p) => p.id === id));
  const toast = useAdminStore((s) => s.pushToast);
  if (!payment) notFound();

  const rows = [
    ["Transaction ID", payment.transactionId],
    ["User", payment.userName],
    ["Plan", payment.planName],
    ["Amount", formatEgp(payment.amount)],
    ["Currency", payment.currency],
    ["Payment Method", payment.method],
    ["Status", payment.status],
    ["Created", formatDateTime(payment.date)],
    ["Completed", payment.completedAt ? formatDateTime(payment.completedAt) : "—"],
    ["Provider", payment.provider],
    ["Payment Reference", payment.paymentReference ?? "—"],
    ["Invoice", payment.invoiceId],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payment Details</h1>
        <div className="mt-2"><StatusBadge kind="payment" value={payment.status} /></div>
      </div>
      <div className="admin-card divide-y divide-[var(--line)]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-4 px-5 py-3 text-sm">
            <span className="text-ink-soft">{k}</span>
            <span className="text-right font-medium">{k === "Status" ? <StatusBadge kind="payment" value={payment.status} /> : v}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button href={`/admin/users/${payment.userId}`} variant="secondary">View customer</Button>
        <Button variant="secondary" onClick={() => toast("success", "Payment status refreshed")}>Refresh status</Button>
        <Link href="/admin/payments" className="inline-flex h-11 items-center text-sm font-semibold">Back to payments</Link>
      </div>
    </div>
  );
}

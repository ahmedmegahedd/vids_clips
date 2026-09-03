"use client";

import { AreaChart } from "@/components/admin/Charts";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatEgp } from "@/lib/admin/format";
import { useAdminStore } from "@/lib/admin/store";
import { roleLabel } from "@clipora/shared";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const users = useAdminStore((s) => s.users);
  const plans = useAdminStore((s) => s.plans);
  const payments = useAdminStore((s) => s.payments.filter((p) => p.userId === id));
  const projects = useAdminStore((s) => s.projects.filter((p) => p.userId === id));
  const usageHistory = useAdminStore((s) => s.usageHistory);
  const setStatus = useAdminStore((s) => s.setUserStatus);
  const changePlan = useAdminStore((s) => s.changeUserPlan);
  const extend = useAdminStore((s) => s.extendSubscription);
  const cancelSub = useAdminStore((s) => s.cancelSubscription);
  const reactivate = useAdminStore((s) => s.reactivateSubscription);
  const remove = useAdminStore((s) => s.deleteUser);
  const toast = useAdminStore((s) => s.pushToast);
  const user = users.find((item) => item.id === id);
  const [confirm, setConfirm] = useState<"suspend" | "delete" | "cancel" | null>(null);
  const [busy, setBusy] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);

  const usagePct = user && user.videosLimit > 0 ? Math.min(100, Math.round((user.videosUsed / user.videosLimit) * 100)) : 0;
  const chart = useMemo(() => usageHistory.map((p) => ({ label: p.label, value: p.videos })), [usageHistory]);

  if (!user) {
    notFound();
  }

  function run(label: string, fn: () => void) {
    setBusy(true);
    window.setTimeout(() => {
      fn();
      setBusy(false);
      setConfirm(null);
      if (label === "deleted") router.push("/admin/users");
    }, 500);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[30px]">{user.name}</h1>
          <p className="mt-1 text-sm text-ink-soft">{user.email}</p>
          <p className="mt-1 text-xs text-ink-faint">Account created {formatDate(user.joinedAt)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge kind="user" value={user.status} />
            <span className="rounded-full bg-[var(--bg-warm)] px-2 py-0.5 text-[11px] font-semibold">{roleLabel(user.role)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setPlanOpen(true)}>Change Plan</Button>
          {user.status === "suspended" ? (
            <Button size="sm" variant="secondary" onClick={() => run("reactivated", () => setStatus(user.id, "active"))}>{busy ? "Reactivating..." : "Reactivate Account"}</Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setConfirm("suspend")}>Suspend Account</Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => toast("success", "Password reset link sent")}>Reset Password</Button>
          <Button size="sm" variant="danger" onClick={() => setConfirm("delete")}>Delete Account</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Current Plan" value={plans.find((p) => p.id === user.planId)?.name ?? user.planId} />
        <Stat label="Subscription Status" value={<StatusBadge kind="subscription" value={user.subscriptionStatus} />} />
        <Stat label="Next Billing Date" value={formatDate(user.renewsAt)} />
        <Stat label="Usage" value={`${user.videosUsed} / ${user.videosLimit} videos`} />
        <Stat label="Total Videos" value={String(user.totalVideos)} />
        <Stat label="Total Clips" value={user.totalClips.toLocaleString()} />
        <Stat label="Total Payments" value={formatEgp(user.totalPayments)} />
        <Stat label="Storage used" value={`${user.storageGb} GB`} />
      </div>

      <section className="admin-card p-5">
        <h2 className="text-lg font-semibold">Subscription</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <Item k="Plan" v={plans.find((p) => p.id === user.planId)?.name ?? user.planId} />
          <Item k="Status" v={user.subscriptionStatus} />
          <Item k="Billing" v={user.billingInterval === "yearly" ? "Yearly" : "Monthly"} />
          <Item k="Price" v={formatEgp(user.price)} />
          <Item k="Started" v={formatDate(user.startedAt)} />
          <Item k="Next Payment" v={formatDate(user.renewsAt)} />
          <Item k="Subscription Ends" v={formatDate(user.endsAt)} />
          <Item k="Auto Renewal" v={user.autoRenewal ? "Enabled" : "Disabled"} />
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setPlanOpen(true)}>Change Plan</Button>
          <Button size="sm" variant="secondary" onClick={() => setConfirm("cancel")}>Cancel Subscription</Button>
          <Button size="sm" variant="secondary" onClick={() => extend(user.id)}>Extend Subscription</Button>
          <Button size="sm" variant="secondary" onClick={() => reactivate(user.id)}>Reactivate Subscription</Button>
        </div>
      </section>

      <section className="admin-card p-5">
        <h2 className="text-lg font-semibold">Usage</h2>
        <p className="mt-2 text-sm font-medium">{user.videosUsed} / {user.videosLimit} videos</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-warm)]">
          <div className="h-full rounded-full bg-ink" style={{ width: `${usagePct}%` }} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
          <Item k="Videos processed" v={String(user.videosUsed)} />
          <Item k="Clips generated" v={String(user.clipsCreated)} />
          <Item k="Storage used" v={`${user.storageGb} GB`} />
        </div>
        <div className="mt-6">
          <AreaChart data={chart} height={180} />
        </div>
      </section>

      <section className="admin-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-lg font-semibold">Payment History</h2>
          <Link href="/admin/payments" className="text-xs font-semibold">View Payments →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead className="border-y border-[var(--line)] text-[11px] uppercase tracking-[0.08em] text-ink-faint">
              <tr>
                {["Date", "Amount", "Plan", "Payment Method", "Status", "Transaction ID", "Invoice"].map((h) => (
                  <th key={h} className="px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((pay) => (
                <tr key={pay.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-4 py-3">{formatDate(pay.date, false)}</td>
                  <td className="px-4 py-3">{formatEgp(pay.amount)}</td>
                  <td className="px-4 py-3">{pay.planName}</td>
                  <td className="px-4 py-3">{pay.method}</td>
                  <td className="px-4 py-3"><StatusBadge kind="payment" value={pay.status} /></td>
                  <td className="px-4 py-3 font-mono text-xs">{pay.transactionId}</td>
                  <td className="px-4 py-3"><Link href={`/admin/payments/${pay.id}`} className="font-semibold">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && <p className="px-5 py-8 text-sm text-ink-faint">No payments yet for this account.</p>}
        </div>
      </section>

      <section className="admin-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Projects</h2>
          <Link href="/admin/projects" className="text-xs font-semibold">View Projects →</Link>
        </div>
        <div className="mt-3 space-y-2">
          {projects.map((project) => (
            <Link key={project.id} href={`/admin/projects/${project.id}`} className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-[var(--bg)]">
              <span>
                <span className="block text-sm font-medium">{project.name}</span>
                <span className="block text-xs text-ink-faint">{project.clips} clips · {project.sourceVideo}</span>
              </span>
              <StatusBadge kind="project" value={project.status} />
            </Link>
          ))}
          {projects.length === 0 && <p className="text-sm text-ink-faint">No projects found.</p>}
        </div>
      </section>

      {planOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={() => setPlanOpen(false)}>
          <div className="admin-card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold">Change Plan</h2>
            <div className="mt-4 space-y-2">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-[var(--line)] px-3 py-3 text-left hover:bg-[var(--bg)]"
                  onClick={() => {
                    changePlan(user.id, plan.id);
                    setPlanOpen(false);
                  }}
                >
                  <span>
                    <span className="block text-sm font-semibold">{plan.name}</span>
                    <span className="block text-xs text-ink-soft">{formatEgp(plan.monthlyPrice)} / month</span>
                  </span>
                  {plan.id === user.planId && <span className="text-xs font-semibold">Current</span>}
                </button>
              ))}
            </div>
            <Button className="mt-4 w-full" variant="secondary" onClick={() => setPlanOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirm === "suspend"}
        title="Suspend this account?"
        body="This user will no longer be able to access their account."
        confirmLabel="Suspend Account"
        loadingLabel="Suspending..."
        danger
        confirming={busy}
        onClose={() => setConfirm(null)}
        onConfirm={() => run("suspended", () => setStatus(user.id, "suspended"))}
      />
      <ConfirmModal
        open={confirm === "delete"}
        title="Delete this user?"
        body="This will permanently remove the account from the admin panel."
        confirmLabel="Delete User"
        loadingLabel="Deleting..."
        danger
        confirming={busy}
        onClose={() => setConfirm(null)}
        onConfirm={() => run("deleted", () => remove(user.id))}
      />
      <ConfirmModal
        open={confirm === "cancel"}
        title="Cancel this subscription?"
        body="The customer keeps access until the current period ends. Auto-renewal will be turned off."
        confirmLabel="Cancel Subscription"
        loadingLabel="Cancelling..."
        danger
        confirming={busy}
        onClose={() => setConfirm(null)}
        onConfirm={() => run("cancelled", () => cancelSub(user.id))}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="admin-card p-4">
      <p className="text-[12px] text-ink-soft">{label}</p>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </div>
  );
}

function Item({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">{k}</dt>
      <dd className="mt-1 font-medium capitalize">{v}</dd>
    </div>
  );
}

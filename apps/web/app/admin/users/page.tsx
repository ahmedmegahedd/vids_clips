"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { EmptyState, PageHeader } from "@/components/admin/EmptyState";
import { FieldSelect, FilterPanel } from "@/components/admin/FilterPanel";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { exportCsv } from "@/lib/admin/csv";
import { formatDate, formatNumber, lastActiveLabel } from "@/lib/admin/format";
import { useAdminStore } from "@/lib/admin/store";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

function UsersInner() {
  const router = useRouter();
  const params = useSearchParams();
  const users = useAdminStore((s) => s.users);
  const plans = useAdminStore((s) => s.plans);
  const metrics = useAdminStore((s) => s.metrics);
  const addUser = useAdminStore((s) => s.addUser);
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const [payment, setPayment] = useState("all");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const usageLimit = params.get("usage") === "limit";

  const filtered = useMemo(() => {
    return users.filter((user) => {
      const hay = `${user.name} ${user.email} ${user.id}`.toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return false;
      if (plan !== "all" && user.planId !== plan) return false;
      if (status !== "all" && user.status !== status) return false;
      if (role !== "all" && user.role !== role) return false;
      if (payment !== "all" && user.paymentStatus !== payment) return false;
      if (usageLimit && !(user.videosLimit > 0 && user.videosUsed / user.videosLimit >= 0.9)) return false;
      return true;
    });
  }, [users, q, plan, status, role, payment, usageLimit]);

  const rows = filtered.slice((page - 1) * 10, page * 10);

  return (
    <div className="space-y-5">
      <PageHeader title="Users" description={`${formatNumber(metrics.totalUsers)} total users`}>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => exportCsv("users.csv", filtered.map((u) => ({ name: u.name, email: u.email, plan: u.planId, status: u.status, joined: u.joinedAt })))}>
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setAdding(true)}>
            + Add User
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search users..."
          className="h-10 flex-1 rounded-xl border border-[var(--line-strong)] bg-white px-3 text-sm outline-none"
        />
        <FilterPanel
          onClear={() => {
            setPlan("all");
            setStatus("all");
            setRole("all");
            setPayment("all");
            setPage(1);
          }}
        >
          <FieldSelect label="Plan" value={plan} onChange={setPlan} options={[{ value: "all", label: "All plans" }, ...plans.map((p) => ({ value: p.id, label: p.name }))]} />
          <FieldSelect label="Status" value={status} onChange={setStatus} options={["all", "active", "suspended", "blocked", "pending", "cancelled"].map((v) => ({ value: v, label: v === "all" ? "All statuses" : v[0].toUpperCase() + v.slice(1) }))} />
          <FieldSelect label="Role" value={role} onChange={setRole} options={[{ value: "all", label: "All roles" }, { value: "user", label: "User" }, { value: "admin", label: "Admin" }]} />
          <FieldSelect label="Payment status" value={payment} onChange={setPayment} options={[{ value: "all", label: "Any" }, { value: "paid", label: "Paid" }, { value: "pending", label: "Pending" }, { value: "failed", label: "Failed" }, { value: "none", label: "None" }]} />
        </FilterPanel>
      </div>

      {q && filtered.length === 0 ? (
        <div className="admin-card">
          <EmptyState
            title="No results"
            body={`We couldn’t find anything matching “${q}”.`}
            action={{
              label: "Clear Search",
              onClick: () => setQ(""),
            }}
          />
        </div>
      ) : (
        <AdminTable
          columns={[
            { key: "user", header: "User", render: (u) => <div><p className="font-semibold">{u.name}</p><p className="text-xs text-ink-faint">{u.email}</p></div> },
            { key: "email", header: "Email", render: (u) => <span className="text-ink-soft">{u.email}</span> },
            { key: "role", header: "Role", render: (u) => u.role === "admin" ? "Admin" : "User" },
            { key: "plan", header: "Plan", render: (u) => plans.find((p) => p.id === u.planId)?.name ?? u.planId },
            { key: "status", header: "Status", render: (u) => <StatusBadge kind="user" value={u.status} /> },
            { key: "usage", header: "Usage", render: (u) => <span className="tabular-nums">{u.videosUsed} / {u.videosLimit} videos</span> },
            { key: "sub", header: "Subscription", render: (u) => u.renewsAt ? `Renews ${formatDate(u.renewsAt, false)}` : "—" },
            { key: "joined", header: "Joined", render: (u) => formatDate(u.joinedAt, false) },
            { key: "active", header: "Last Active", render: (u) => lastActiveLabel(u.lastActiveAt) },
            { key: "actions", header: "Actions", render: () => <span className="text-xs font-semibold">View</span> },
          ]}
          rows={rows}
          total={filtered.length}
          page={page}
          onPageChange={setPage}
          onRowClick={(u) => router.push(`/admin/users/${u.id}`)}
          emptyTitle="No users found"
          emptyBody="Try changing your filters or search query."
          emptyAction={{ label: "View All Users", onClick: () => { setQ(""); setPlan("all"); setStatus("all"); } }}
        />
      )}

      {adding && (
        <AddUserModal
          plans={plans}
          onClose={() => setAdding(false)}
          onCreate={(input) => {
            const user = addUser(input);
            setAdding(false);
            router.push(`/admin/users/${user.id}`);
          }}
        />
      )}
    </div>
  );
}

function AddUserModal({
  plans,
  onClose,
  onCreate,
}: {
  plans: { id: string; name: string }[];
  onClose: () => void;
  onCreate: (input: { name: string; email: string; planId: string }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "free");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <form
        className="admin-card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onCreate({ name, email, planId });
        }}
      >
        <h2 className="text-xl font-semibold">Add User</h2>
        <div className="mt-4 space-y-3">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="h-11 w-full rounded-xl border border-[var(--line-strong)] px-3 text-sm outline-none" />
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="h-11 w-full rounded-xl border border-[var(--line-strong)] px-3 text-sm outline-none" />
          <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="h-11 w-full rounded-xl border border-[var(--line-strong)] px-3 text-sm">
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add User</Button>
        </div>
      </form>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense>
      <UsersInner />
    </Suspense>
  );
}

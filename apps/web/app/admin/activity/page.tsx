"use client";

import { FieldSelect, FilterPanel, Segmented } from "@/components/admin/FilterPanel";
import { PageHeader } from "@/components/admin/EmptyState";
import { formatDateTime } from "@/lib/admin/format";
import { useAdminStore } from "@/lib/admin/store";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function ActivityPage() {
  const activity = useAdminStore((s) => s.activity);
  const audit = useAdminStore((s) => s.audit);
  const [tab, setTab] = useState<"system" | "admin">("system");
  const [source, setSource] = useState("all");
  const filtered = useMemo(() => activity.filter((a) => source === "all" || a.source === source), [activity, source]);

  return (
    <div className="space-y-5">
      <PageHeader title="Activity Log" description="A complete history of important customer, billing, and admin events." />
      <Segmented value={tab} onChange={setTab} options={[{ value: "system", label: "System activity" }, { value: "admin", label: "Admin activity" }]} />

      {tab === "system" && (
        <>
          <FilterPanel onClear={() => setSource("all")}>
            <FieldSelect label="Source" value={source} onChange={setSource} options={[{ value: "all", label: "All sources" }, { value: "user", label: "User" }, { value: "admin", label: "Admin" }, { value: "billing", label: "Billing" }, { value: "processing", label: "Video processing" }, { value: "system", label: "System" }]} />
          </FilterPanel>
          <div className="admin-card divide-y divide-[var(--line)]">
            {filtered.map((item) => (
              <Link key={item.id} href={item.href} className="grid gap-1 px-5 py-4 hover:bg-[var(--bg)] sm:grid-cols-[1.4fr_1fr_1fr_auto]">
                <div>
                  <p className="text-sm font-semibold">{item.event}</p>
                  <p className="text-xs text-ink-soft">{item.description}</p>
                </div>
                <p className="text-sm text-ink-soft">{item.userName ?? "System"}</p>
                <p className="text-sm text-ink-faint">{formatDateTime(item.time)}</p>
                <p className="text-xs font-semibold capitalize text-ink-soft">{item.source === "processing" ? "Video processing" : item.source}</p>
              </Link>
            ))}
            {filtered.length === 0 && <p className="px-5 py-10 text-center text-sm text-ink-faint">No activity matches these filters.</p>}
          </div>
        </>
      )}

      {tab === "admin" && (
        <div className="space-y-3">
          {audit.map((item) => (
            <article key={item.id} className="admin-card p-5">
              <p className="font-semibold">{item.action}</p>
              <p className="mt-1 text-sm text-ink-soft">Admin: {item.adminName}</p>
              <p className="text-xs text-ink-faint">{formatDateTime(item.time)}</p>
              {(item.before || item.after) && (
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div className="rounded-xl bg-[var(--bg)] px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Before</p>
                    <p className="mt-1 font-medium">{item.before}</p>
                  </div>
                  <div className="rounded-xl bg-[var(--bg)] px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">After</p>
                    <p className="mt-1 font-medium">{item.after}</p>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { FieldSelect, FilterPanel } from "@/components/admin/FilterPanel";
import { PageHeader } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate } from "@/lib/admin/format";
import { useAdminStore } from "@/lib/admin/store";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ProjectsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const projects = useAdminStore((s) => s.projects);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(params.get("status") ?? "all");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => projects.filter((p) => {
    const hay = `${p.name} ${p.userName} ${p.sourceVideo}`.toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (status !== "all" && p.status !== status) return false;
    return true;
  }), [projects, q, status]);

  return (
    <div className="space-y-5">
      <PageHeader title="Projects" description="Every video processing job across the platform." />
      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search projects..." className="h-10 flex-1 rounded-xl border border-[var(--line-strong)] bg-white px-3 text-sm outline-none" />
        <FilterPanel onClear={() => setStatus("all")}>
          <FieldSelect label="Status" value={status} onChange={setStatus} options={[{ value: "all", label: "All" }, { value: "processing", label: "Processing" }, { value: "completed", label: "Completed" }, { value: "failed", label: "Failed" }, { value: "cancelled", label: "Cancelled" }]} />
        </FilterPanel>
      </div>
      <AdminTable
        columns={[
          {
            key: "project",
            header: "Project",
            render: (p) => (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumbnailUrl} alt="" className="h-10 w-16 rounded-lg object-cover" />
                <span className="font-semibold">{p.name}</span>
              </div>
            ),
          },
          { key: "user", header: "User", render: (p) => p.userName },
          { key: "source", header: "Source Video", render: (p) => <span className="text-ink-soft">{p.sourceVideo}</span> },
          { key: "duration", header: "Duration", render: (p) => formatDuration(p.durationSeconds) },
          { key: "clips", header: "Clips", render: (p) => String(p.clips) },
          { key: "status", header: "Status", render: (p) => <StatusBadge kind="project" value={p.status} /> },
          { key: "created", header: "Created", render: (p) => formatDate(p.createdAt, false) },
          { key: "actions", header: "Actions", render: () => <span className="text-xs font-semibold">Open</span> },
        ]}
        rows={filtered.slice((page - 1) * 10, page * 10)}
        total={filtered.length}
        page={page}
        onPageChange={setPage}
        onRowClick={(p) => router.push(`/admin/projects/${p.id}`)}
        emptyTitle="No projects found"
        emptyBody="Projects will appear here as customers process videos."
      />
    </div>
  );
}

export default function ProjectsPage() {
  return <Suspense><ProjectsInner /></Suspense>;
}

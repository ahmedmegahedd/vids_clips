"use client";

import { PageHeader } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminStore } from "@/lib/admin/store";

export default function SystemStatusPage() {
  const services = useAdminStore((s) => s.services);
  return (
    <div className="space-y-5">
      <PageHeader title="System Status" description="A high-level view of platform health across the services that keep Clipora running." />
      <div className="grid gap-3 md:grid-cols-2">
        {services.map((service) => (
          <article key={service.id} className="admin-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{service.name}</h2>
              <StatusBadge kind="health" value={service.status} />
            </div>
            <p className="mt-2 text-sm text-ink-soft">{service.detail}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

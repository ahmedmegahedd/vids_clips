"use client";

import { PageHeader } from "@/components/admin/EmptyState";
import { Segmented } from "@/components/admin/FilterPanel";
import { relativeTime } from "@/lib/admin/format";
import { useAdminStore } from "@/lib/admin/store";
import type { NotificationCategory } from "@clipora/shared";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function NotificationsPage() {
  const notifications = useAdminStore((s) => s.notifications);
  const markAll = useAdminStore((s) => s.markAllNotificationsRead);
  const markOne = useAdminStore((s) => s.markNotificationRead);
  const [filter, setFilter] = useState<"all" | NotificationCategory>("all");
  const list = useMemo(() => notifications.filter((n) => filter === "all" || n.category === filter), [notifications, filter]);

  return (
    <div className="space-y-5">
      <PageHeader title="Notifications" description="System alerts across payments, users, security, and platform health.">
        <button type="button" className="text-sm font-semibold" onClick={markAll}>Mark all as read</button>
      </PageHeader>
      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All" },
          { value: "payments", label: "Payments" },
          { value: "users", label: "Users" },
          { value: "system", label: "System" },
          { value: "security", label: "Security" },
        ]}
      />
      <div className="admin-card divide-y divide-[var(--line)]">
        {list.map((item) => (
          <Link key={item.id} href={item.href} onClick={() => markOne(item.id)} className="flex items-start gap-3 px-5 py-4 hover:bg-[var(--bg)]">
            {!item.read && <span className="mt-2 h-2 w-2 rounded-full bg-accent" />}
            <div>
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-ink-soft">{item.body}</p>
              <p className="mt-1 text-[11px] capitalize text-ink-faint">{item.category} · {relativeTime(item.time)}</p>
            </div>
          </Link>
        ))}
        {list.length === 0 && <p className="px-5 py-12 text-center text-sm text-ink-faint">No notifications in this category.</p>}
      </div>
    </div>
  );
}

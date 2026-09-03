"use client";

import { relativeTime } from "@/lib/admin/format";
import { useAdminStore } from "@/lib/admin/store";
import { cx } from "@/lib/cn";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const notifications = useAdminStore((s) => s.notifications);
  const markAll = useAdminStore((s) => s.markAllNotificationsRead);
  const markOne = useAdminStore((s) => s.markNotificationRead);
  const [tab, setTab] = useState<"unread" | "all">("unread");
  if (!open) return null;
  const list = tab === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="absolute right-0 top-12 z-40 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-hover)]">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2">
        <div className="flex gap-1 rounded-lg bg-[var(--bg)] p-0.5 text-xs font-semibold">
          {(["unread", "all"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cx("rounded-md px-2.5 py-1 capitalize", tab === item ? "bg-white shadow-sm" : "text-ink-soft")}
            >
              {item}
            </button>
          ))}
        </div>
        <button type="button" className="text-xs font-semibold text-ink-soft hover:text-ink" onClick={markAll}>
          Mark all as read
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {list.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-ink-faint">You’re all caught up.</p>
        ) : (
          list.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full flex-col gap-0.5 border-b border-[var(--line)] px-4 py-3 text-left last:border-0 hover:bg-[var(--bg)]"
              onClick={() => {
                markOne(item.id);
                onClose();
                router.push(item.href);
              }}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                {!item.read && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                {item.title}
              </span>
              <span className="text-xs text-ink-soft">{item.body}</span>
              <span className="text-[11px] text-ink-faint">{relativeTime(item.time)}</span>
            </button>
          ))
        )}
      </div>
      <button
        type="button"
        className="block w-full border-t border-[var(--line)] px-4 py-2.5 text-center text-xs font-semibold"
        onClick={() => {
          onClose();
          router.push("/admin/notifications");
        }}
      >
        View all notifications
      </button>
    </div>
  );
}

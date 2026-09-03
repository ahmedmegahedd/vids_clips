"use client";

import { useAdminStore } from "@/lib/admin/store";
import { cx } from "@/lib/cn";
import { Check, X } from "lucide-react";

export function AdminToasts() {
  const toasts = useAdminStore((s) => s.toasts);
  const dismiss = useAdminStore((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cx(
            "pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white px-4 py-3 shadow-[var(--shadow)]",
            toast.kind === "success" ? "border-[var(--line)]" : "border-[rgba(196,58,43,0.25)]",
          )}
        >
          <span
            className={cx(
              "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white",
              toast.kind === "success" ? "bg-success" : "bg-[var(--danger)]",
            )}
          >
            {toast.kind === "success" ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{toast.kind === "success" ? `✓ ${toast.title}` : toast.title}</p>
            {toast.body && <p className="mt-0.5 text-xs text-ink-soft">{toast.body}</p>}
          </div>
          <button type="button" className="text-ink-faint hover:text-ink" onClick={() => dismiss(toast.id)} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

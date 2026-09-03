"use client";

import { searchAdmin } from "@/lib/admin/store";
import { formatEgp } from "@/lib/admin/format";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchAdmin(q), [q]);

  useEffect(() => {
    if (open) {
      setQ("");
      const t = window.setTimeout(() => input.current?.focus(), 20);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  const empty = q.trim() && !results.users.length && !results.payments.length && !results.projects.length && !results.subscriptions.length;

  function go(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <div className="fixed inset-0 z-[75] bg-ink/40 p-4 sm:p-10" onClick={onClose}>
      <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-hover)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-4">
          <Search className="h-4 w-4 text-ink-faint" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search users, payments, projects..."
            className="h-12 flex-1 bg-transparent text-sm outline-none"
          />
          <button type="button" onClick={onClose} className="text-ink-faint hover:text-ink" aria-label="Close search">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[24rem] overflow-y-auto p-2">
          {!q.trim() && <p className="px-3 py-6 text-center text-sm text-ink-faint">Search by name, email, user ID, payment, or project.</p>}
          {empty && (
            <div className="px-3 py-8 text-center">
              <h3 className="font-semibold">No results</h3>
              <p className="mt-1 text-sm text-ink-soft">We couldn’t find anything matching “{q}”.</p>
              <div className="mt-4 flex justify-center gap-2">
                <button type="button" className="text-sm font-semibold" onClick={() => setQ("")}>
                  Clear Search
                </button>
                <button type="button" className="text-sm font-semibold" onClick={() => go("/admin/users")}>
                  View All Users
                </button>
              </div>
            </div>
          )}
          <Group title="Users" items={results.users.map((u) => ({ id: u.id, title: u.name, meta: u.email, href: `/admin/users/${u.id}` }))} onPick={go} />
          <Group title="Payments" items={results.payments.map((p) => ({ id: p.id, title: `Payment ${p.transactionId.replace("TXN-", "#")}`, meta: `${p.userName} · ${formatEgp(p.amount)}`, href: `/admin/payments/${p.id}` }))} onPick={go} />
          <Group title="Projects" items={results.projects.map((p) => ({ id: p.id, title: p.name, meta: p.userName, href: `/admin/projects/${p.id}` }))} onPick={go} />
          <Group title="Subscriptions" items={results.subscriptions.map((s) => ({ id: s.id, title: `${s.userName} · ${s.planName}`, meta: s.email, href: `/admin/users/${s.userId}` }))} onPick={go} />
        </div>
      </div>
    </div>
  );
}

function Group({
  title,
  items,
  onPick,
}: {
  title: string;
  items: { id: string; title: string; meta: string; href: string }[];
  onPick: (href: string) => void;
}) {
  if (!items.length) return null;
  return (
    <div className="mb-2">
      <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">{title}</p>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onPick(item.href)}
          className="flex w-full flex-col rounded-xl px-3 py-2 text-left hover:bg-[var(--bg)]"
        >
          <span className="text-sm font-semibold">{item.title}</span>
          <span className="text-xs text-ink-soft">{item.meta}</span>
        </button>
      ))}
    </div>
  );
}

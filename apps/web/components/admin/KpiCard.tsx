"use client";

import { Sparkline } from "@/components/admin/Charts";
import { formatPercent } from "@/lib/admin/format";
import { cx } from "@/lib/cn";
import { TrendingDown, TrendingUp } from "lucide-react";

export function KpiCard({
  label,
  value,
  change,
  spark,
  hint,
}: {
  label: string;
  value: string;
  change?: number;
  spark?: number[];
  hint?: string;
}) {
  const up = (change ?? 0) >= 0;
  return (
    <article className="admin-card p-4 sm:p-5">
      <p className="text-[12px] font-medium text-ink-soft">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {spark && <Sparkline data={spark} className={up ? "text-success" : "text-[var(--danger)]"} />}
      </div>
      {(change != null || hint) && (
        <p className={cx("mt-2 flex items-center gap-1 text-[12px]", change == null ? "text-ink-faint" : up ? "text-success" : "text-[var(--danger)]")}>
          {change != null && (up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />)}
          {change != null && <span>{formatPercent(change)} this month</span>}
          {hint && <span className="text-ink-faint">{hint}</span>}
        </p>
      )}
    </article>
  );
}

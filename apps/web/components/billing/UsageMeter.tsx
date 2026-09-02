"use client";

import { Button } from "@/components/ui/Button";
import { cx } from "@/lib/cn";
import type { UsageResponse } from "@clipora/shared";

export function UsageMeter({ usage, compact = false }: { usage: UsageResponse; compact?: boolean }) {
  const pct = usage.videosLimit ? Math.min(100, Math.round((usage.videosUsed / usage.videosLimit) * 100)) : 0;
  const remaining = Math.max(0, usage.videosLimit - usage.videosUsed);

  return (
    <div className={cx("card p-5", compact && "p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Your Usage</p>
          <p className="mt-1 text-lg font-semibold">
            {usage.videosUsed} / {usage.videosLimit} videos used
          </p>
        </div>
        <span className="rounded-full bg-[var(--success-soft)] px-2.5 py-0.5 text-xs font-semibold text-success">
          {usage.planName}
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--bg-warm)]">
        <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-sm text-ink-soft">{remaining} videos remaining</p>
      {usage.approachingLimit && (
        <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-[var(--bg-warm)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            You&apos;ve used {usage.videosUsed} of {usage.videosLimit} videos this month. Need more?
          </p>
          <Button href="/pricing?upgrade=1" size="sm">
            Upgrade Plan →
          </Button>
        </div>
      )}
    </div>
  );
}

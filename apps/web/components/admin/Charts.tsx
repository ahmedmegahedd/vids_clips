"use client";

import { cx } from "@/lib/cn";

export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 28 - ((value - min) / span) * 22;
    return `${x},${y}`;
  });
  return (
    <svg viewBox="0 0 100 32" className={cx("h-8 w-24", className)} aria-hidden="true">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={points.join(" ")} />
    </svg>
  );
}

export function AreaChart({
  data,
  height = 240,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value)) * 1.08;
  const w = 100;
  const h = 40;
  const coords = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = h - (d.value / max) * (h - 4);
    return { x, y, ...d };
  });
  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const ticks = coords.filter((_, i) => i === 0 || i === coords.length - 1 || i === Math.floor(coords.length / 2));
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <polygon points={area} fill="rgba(255,61,46,0.1)" />
        <polyline points={line} fill="none" stroke="#ff3d2e" strokeWidth="0.6" />
      </svg>
      <div className="mt-2 flex justify-between text-[11px] text-ink-faint">
        {ticks.map((tick) => (
          <span key={tick.label}>{tick.label}</span>
        ))}
      </div>
    </div>
  );
}

export function GroupedBars({
  data,
  keys,
}: {
  data: ReadonlyArray<{ label: string }>;
  keys: { key: string; label: string; color: string }[];
}) {
  const max = Math.max(
    ...data.flatMap((row) => keys.map((k) => Number((row as Record<string, unknown>)[k.key] ?? 0))),
    1,
  );
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4 text-xs text-ink-soft">
        {keys.map((key) => (
          <span key={key.key} className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: key.color }} />
            {key.label}
          </span>
        ))}
      </div>
      <div className="flex h-52 items-end gap-2 sm:gap-3">
        {data.map((row) => (
          <div key={row.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-44 w-full items-end justify-center gap-0.5">
              {keys.map((key) => (
                <div
                  key={key.key}
                  className="w-full max-w-[14px] rounded-t-md"
                  style={{ height: `${(Number((row as Record<string, unknown>)[key.key]) / max) * 100}%`, background: key.color }}
                />
              ))}
            </div>
            <span className="truncate text-[10px] text-ink-faint">{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Funnel({ steps }: { steps: { id: string; label: string; value: number }[] }) {
  const top = steps[0]?.value || 1;
  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const width = Math.max(18, (step.value / top) * 100);
        const prev = steps[i - 1]?.value;
        const conv = prev ? Math.round((step.value / prev) * 100) : 100;
        return (
          <div key={step.id}>
            {i > 0 && <div className="py-1 text-center text-[11px] text-ink-faint">↓ {conv}%</div>}
            <div className="flex items-center gap-3">
              <div className="h-10 flex-1 rounded-xl bg-[var(--bg-warm)]">
                <div
                  className="flex h-10 items-center rounded-xl bg-ink px-3 text-xs font-semibold text-white"
                  style={{ width: `${width}%`, minWidth: "7.5rem" }}
                >
                  {step.label}
                </div>
              </div>
              <span className="w-16 text-right text-sm font-semibold tabular-nums">{step.value.toLocaleString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/Button";
import { cx } from "@/lib/cn";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

export function FilterPanel({
  children,
  onClear,
  onApply,
}: {
  children: React.ReactNode;
  onClear: () => void;
  onApply?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen((v) => !v)}>
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </Button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow)]">
          <div className="space-y-3">{children}</div>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
            >
              Clear Filters
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onApply?.();
                setOpen(false);
              }}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block text-xs font-semibold">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--bg)] px-3 text-sm font-medium outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_year", label: "This year" },
  { value: "custom", label: "Custom" },
];

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex flex-wrap rounded-xl border border-[var(--line-strong)] bg-white p-0.5 text-xs font-semibold">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cx("rounded-[10px] px-2.5 py-1.5", value === opt.value ? "bg-ink text-white" : "text-ink-soft hover:text-ink")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

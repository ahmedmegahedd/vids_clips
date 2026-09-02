"use client";

import { cx } from "@/lib/cn";
import { Check } from "lucide-react";

const STEPS = [
  { id: 1, label: "Video" },
  { id: 2, label: "Customize" },
  { id: 3, label: "Generate" },
  { id: 4, label: "Download" },
] as const;

export function WorkflowStepper({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <div className="border-b border-[var(--line)] bg-white/70 backdrop-blur-md">
      <ol className="mx-auto flex max-w-5xl items-center justify-between gap-2 overflow-x-auto px-4 py-3 sm:px-6">
        {STEPS.map((step, index) => {
          const done = current > step.id;
          const active = current === step.id;
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={cx(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    done && "bg-success text-white",
                    active && "bg-ink text-white",
                    !done && !active && "bg-[var(--bg-warm)] text-ink-faint",
                  )}
                >
                  {done ? <Check size={14} /> : step.id}
                </span>
                <span
                  className={cx(
                    "truncate text-sm font-medium",
                    active ? "text-ink" : done ? "text-ink-soft" : "text-ink-faint",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <span className={cx("hidden h-px flex-1 sm:block", done ? "bg-success/40" : "bg-[var(--line)]")} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

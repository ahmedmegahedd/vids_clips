"use client";

import { cx } from "@/lib/cn";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Loader2,
  MinusCircle,
  PauseCircle,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import type { ComponentType } from "react";

type Tone = "success" | "warning" | "danger" | "neutral" | "info";

const tones: Record<Tone, string> = {
  success: "bg-[var(--success-soft)] text-success",
  warning: "bg-[rgba(196,122,18,0.12)] text-[#8a5a0c]",
  danger: "bg-[rgba(196,58,43,0.1)] text-[var(--danger)]",
  neutral: "bg-[var(--bg-warm)] text-ink-soft",
  info: "bg-[rgba(18,18,17,0.06)] text-ink",
};

const USER_STATUS: Record<string, { label: string; tone: Tone; icon: ComponentType<{ className?: string }> }> = {
  active: { label: "Active", tone: "success", icon: CheckCircle2 },
  suspended: { label: "Suspended", tone: "warning", icon: PauseCircle },
  blocked: { label: "Blocked", tone: "danger", icon: Ban },
  pending: { label: "Pending", tone: "neutral", icon: Clock3 },
  cancelled: { label: "Cancelled", tone: "neutral", icon: MinusCircle },
};

const PAYMENT_STATUS: Record<string, { label: string; tone: Tone; icon: ComponentType<{ className?: string }> }> = {
  paid: { label: "Paid", tone: "success", icon: CheckCircle2 },
  pending: { label: "Pending", tone: "warning", icon: Clock3 },
  failed: { label: "Failed", tone: "danger", icon: XCircle },
  refunded: { label: "Refunded", tone: "neutral", icon: CircleDashed },
  cancelled: { label: "Cancelled", tone: "neutral", icon: MinusCircle },
};

const SUB_STATUS: Record<string, { label: string; tone: Tone; icon: ComponentType<{ className?: string }> }> = {
  active: { label: "Active", tone: "success", icon: CheckCircle2 },
  trialing: { label: "Trial", tone: "info", icon: Clock3 },
  cancelling: { label: "Cancelling", tone: "warning", icon: PauseCircle },
  past_due: { label: "Payment failed", tone: "danger", icon: AlertTriangle },
  expired: { label: "Expired", tone: "neutral", icon: MinusCircle },
  cancelled: { label: "Cancelled", tone: "neutral", icon: MinusCircle },
  free: { label: "Free", tone: "neutral", icon: CircleDashed },
};

const PROJECT_STATUS: Record<string, { label: string; tone: Tone; icon: ComponentType<{ className?: string }> }> = {
  processing: { label: "Processing", tone: "warning", icon: Loader2 },
  queued: { label: "Queued", tone: "neutral", icon: Clock3 },
  completed: { label: "Completed", tone: "success", icon: CheckCircle2 },
  failed: { label: "Failed", tone: "danger", icon: XCircle },
  cancelled: { label: "Cancelled", tone: "neutral", icon: MinusCircle },
};

const HEALTH: Record<string, { label: string; tone: Tone; icon: ComponentType<{ className?: string }> }> = {
  operational: { label: "Operational", tone: "success", icon: CheckCircle2 },
  degraded: { label: "Degraded", tone: "warning", icon: AlertTriangle },
  unavailable: { label: "Unavailable", tone: "danger", icon: ShieldAlert },
};

const PLAN_LIFE: Record<string, { label: string; tone: Tone; icon: ComponentType<{ className?: string }> }> = {
  active: { label: "Active", tone: "success", icon: CheckCircle2 },
  inactive: { label: "Inactive", tone: "neutral", icon: PauseCircle },
};

const MAPS = {
  user: USER_STATUS,
  payment: PAYMENT_STATUS,
  subscription: SUB_STATUS,
  project: PROJECT_STATUS,
  health: HEALTH,
  plan: PLAN_LIFE,
};

export function StatusBadge({
  kind,
  value,
  className,
}: {
  kind: keyof typeof MAPS;
  value: string;
  className?: string;
}) {
  const meta = MAPS[kind][value] ?? { label: value, tone: "neutral" as Tone, icon: CircleDashed };
  const Icon = meta.icon;
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold", tones[meta.tone], className)}>
      <Icon className={cx("h-3 w-3", value === "processing" && "animate-spin")} />
      {meta.label}
    </span>
  );
}

export function SeverityDot({ severity }: { severity: "critical" | "warning" | "info" }) {
  return (
    <span
      className={cx(
        "inline-block h-2 w-2 rounded-full",
        severity === "critical" && "bg-[var(--danger)]",
        severity === "warning" && "bg-[var(--warn)]",
        severity === "info" && "bg-ink-faint",
      )}
    />
  );
}

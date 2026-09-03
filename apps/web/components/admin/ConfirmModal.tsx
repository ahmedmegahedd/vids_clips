"use client";

import { Button } from "@/components/ui/Button";
import { cx } from "@/lib/cn";

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  loadingLabel,
  confirming,
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  loadingLabel?: string;
  confirming?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="admin-card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={danger ? "danger" : "primary"}
            disabled={confirming}
            onClick={onConfirm}
            className={cx(confirming && "opacity-70")}
          >
            {confirming ? loadingLabel ?? `${confirmLabel}...` : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { PageHeader } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/Button";
import { useAdminStore } from "@/lib/admin/store";
import { useState } from "react";

export default function PlatformSettingsPage() {
  const settings = useAdminStore((s) => s.settings);
  const update = useAdminStore((s) => s.updateSettings);
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [confirmMaintenance, setConfirmMaintenance] = useState(false);

  function save(next = form) {
    setSaving(true);
    window.setTimeout(() => {
      update(next);
      setSaving(false);
    }, 400);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Platform Settings" description="Global product settings that apply across the entire SaaS." />
      <div className="admin-card space-y-4 p-5">
        <Field label="Website Name" value={form.websiteName} onChange={(websiteName) => setForm({ ...form, websiteName })} />
        <Field label="Support Email" value={form.supportEmail} onChange={(supportEmail) => setForm({ ...form, supportEmail })} />
        <label className="block text-xs font-semibold">
          Default Currency
          <select value={form.defaultCurrency} onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value as "EGP" | "USD" })} className="mt-1 h-11 w-full rounded-xl border border-[var(--line-strong)] px-3 text-sm">
            <option value="EGP">EGP</option>
            <option value="USD">USD</option>
          </select>
        </label>
        <Field label="Default Clip Length" value={String(form.defaultClipLength)} onChange={(v) => setForm({ ...form, defaultClipLength: Number(v) })} />
        <label className="block text-xs font-semibold">
          Default Output Format
          <select value={form.defaultOutputFormat} onChange={(e) => setForm({ ...form, defaultOutputFormat: e.target.value })} className="mt-1 h-11 w-full rounded-xl border border-[var(--line-strong)] px-3 text-sm">
            <option value="9:16">9:16</option>
            <option value="16:9">16:9</option>
            <option value="1:1">1:1</option>
          </select>
        </label>
        <Field label="Maximum Upload (GB)" value={String(form.maxUploadGb)} onChange={(v) => setForm({ ...form, maxUploadGb: Number(v) })} />
        <Field label="Maximum Processing Limits (minutes)" value={String(form.maxProcessingMinutes)} onChange={(v) => setForm({ ...form, maxProcessingMinutes: Number(v) })} />
        <Toggle
          label="New User Registration"
          description="Allow new customers to create accounts."
          on={form.registrationEnabled}
          onChange={(registrationEnabled) => setForm({ ...form, registrationEnabled })}
        />
        <Toggle
          label="Maintenance Mode"
          description={form.maintenanceMode ? "On — customers may be unable to use the platform." : "Off — the product is available to customers."}
          on={form.maintenanceMode}
          onChange={(next) => {
            if (next) setConfirmMaintenance(true);
            else setForm({ ...form, maintenanceMode: false });
          }}
        />
        <div className="flex justify-end">
          <Button disabled={saving} onClick={() => save()}>{saving ? "Saving..." : "Save settings"}</Button>
        </div>
      </div>
      <ConfirmModal
        open={confirmMaintenance}
        title="Enable maintenance mode?"
        body="Users may temporarily be unable to use the platform. The admin panel will remain available."
        confirmLabel="Enable Maintenance Mode"
        loadingLabel="Enabling..."
        danger
        onClose={() => setConfirmMaintenance(false)}
        onConfirm={() => {
          const next = { ...form, maintenanceMode: true };
          setForm(next);
          save(next);
          setConfirmMaintenance(false);
        }}
      />
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs font-semibold">
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[var(--line-strong)] px-3 text-sm font-medium outline-none" />
    </label>
  );
}

function Toggle({ label, description, on, onChange }: { label: string; description: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--line)] px-4 py-3">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-ink-soft">{description}</p>
      </div>
      <button type="button" onClick={() => onChange(!on)} className={`relative h-7 w-12 rounded-full ${on ? "bg-ink" : "bg-[var(--line-strong)]"}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${on ? "left-5" : "left-0.5"}`} />
      </button>
    </div>
  );
}

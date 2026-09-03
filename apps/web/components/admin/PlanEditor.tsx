"use client";

import { PageHeader } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/Button";
import { savingsCopy, useAdminStore } from "@/lib/admin/store";
import { yearlyDiscountPercent } from "@clipora/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PlanEditor({ planId }: { planId?: string }) {
  const router = useRouter();
  const plans = useAdminStore((s) => s.plans);
  const createPlan = useAdminStore((s) => s.createPlan);
  const patchPlan = useAdminStore((s) => s.patchPlan);
  const existing = plans.find((p) => p.id === planId);
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [monthlyPrice, setMonthly] = useState(existing?.monthlyPrice ?? 0);
  const [yearlyPrice, setYearly] = useState(existing?.yearlyPrice ?? 0);
  const [videosPerMonth, setVideos] = useState(existing?.videosPerMonth ?? 20);
  const [clipLimit, setClips] = useState(existing?.clipLimit ?? 400);
  const [maxProjects, setProjects] = useState(existing?.maxProjects ?? 20);
  const [priority, setPriority] = useState(existing?.priority ?? 1);
  const [visibility, setVisibility] = useState<"public" | "hidden">(existing?.visibility ?? "public");
  const [status, setStatus] = useState<"active" | "inactive">(existing?.status ?? "active");
  const [features, setFeatures] = useState(existing?.features ?? [{ id: "f1", label: "20 videos/month", included: true }]);
  const [saving, setSaving] = useState(false);

  function save() {
    setSaving(true);
    const payload = { name, description, monthlyPrice, yearlyPrice, videosPerMonth, clipLimit, maxProjects, priority, visibility, status, features };
    window.setTimeout(() => {
      if (existing) patchPlan(existing.id, payload);
      else createPlan(payload);
      setSaving(false);
      router.push("/admin/plans");
    }, 450);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title={existing ? `Edit ${existing.name}` : "Create Plan"} description="These details appear on the customer pricing page." />
      <div className="admin-card space-y-4 p-5">
        <Field label="Plan Name" value={name} onChange={setName} />
        <label className="block text-xs font-semibold">
          Short Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-[var(--line-strong)] px-3 py-2 text-sm font-medium outline-none" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Num label="Monthly Price" value={monthlyPrice} onChange={setMonthly} />
          <Num label="Yearly Price" value={yearlyPrice} onChange={setYearly} />
        </div>
        <p className="text-sm font-medium text-success">{savingsCopy(monthlyPrice, yearlyPrice)}</p>
        <p className="text-xs text-ink-faint">Yearly discount {yearlyDiscountPercent(monthlyPrice, yearlyPrice)}%</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Num label="Video Processing Limit" value={videosPerMonth} onChange={setVideos} />
          <Num label="Clip Limit" value={clipLimit} onChange={setClips} />
          <Num label="Maximum Project Limit" value={maxProjects} onChange={setProjects} />
        </div>
        <Num label="Priority" value={priority} onChange={setPriority} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Plan Visibility" value={visibility} onChange={(v) => setVisibility(v as "public" | "hidden")} options={[{ value: "public", label: "Public" }, { value: "hidden", label: "Hidden" }]} />
          <Select label="Plan Status" value={status} onChange={(v) => setStatus(v as "active" | "inactive")} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
        </div>
        <div>
          <p className="text-xs font-semibold">Plan Features</p>
          <div className="mt-2 space-y-2">
            {features.map((feature, i) => (
              <div key={feature.id} className="flex items-center gap-2">
                <input type="checkbox" checked={feature.included} onChange={(e) => setFeatures(features.map((f, idx) => idx === i ? { ...f, included: e.target.checked } : f))} />
                <input value={feature.label} onChange={(e) => setFeatures(features.map((f, idx) => idx === i ? { ...f, label: e.target.value } : f))} className="h-10 flex-1 rounded-xl border border-[var(--line-strong)] px-3 text-sm" />
                <button type="button" className="text-xs font-semibold text-ink-soft" onClick={() => setFeatures(features.filter((_, idx) => idx !== i))}>Remove</button>
              </div>
            ))}
          </div>
          <Button className="mt-3" size="sm" variant="secondary" onClick={() => setFeatures([...features, { id: `f${features.length + 1}`, label: "New feature", included: true }])}>+ Add Feature</Button>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" href="/admin/plans">Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : existing ? "Save Plan" : "Create Plan"}</Button>
        </div>
      </div>
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
function Num({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-xs font-semibold">
      {label}
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 h-11 w-full rounded-xl border border-[var(--line-strong)] px-3 text-sm font-medium outline-none" />
    </label>
  );
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block text-xs font-semibold">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[var(--line-strong)] px-3 text-sm font-medium">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

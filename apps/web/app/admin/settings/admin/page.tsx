"use client";

import { PageHeader } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/Button";
import { getCurrentUser, signOut, type SessionUser } from "@/lib/auth/session";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [section, setSection] = useState("account");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getCurrentUser().then(setUser);
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Admin Settings" description="Account, security, notifications, platform, and billing preferences for administrators." />
      <div className="flex flex-wrap gap-2">
        {["account", "security", "notifications", "platform", "billing"].map((id) => (
          <button key={id} type="button" onClick={() => setSection(id)} className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize ${section === id ? "bg-ink text-white" : "bg-white border border-[var(--line)]"}`}>
            {id}
          </button>
        ))}
      </div>
      <div className="admin-card p-5">
        {section === "account" && (
          <div className="space-y-3">
            <p className="text-sm text-ink-soft">Signed in as {user?.email}</p>
            <p className="text-sm">Role: Admin. Additional roles such as Super Admin, Support, Finance, and Moderator can be introduced later without changing this layout.</p>
            <Button href="/admin/profile" variant="secondary">Open profile</Button>
          </div>
        )}
        {section === "security" && (
          <div className="space-y-3 text-sm">
            <p>Last login: {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "This session"}</p>
            <p>Password sign-in is enabled. Google can be connected from your profile.</p>
            <p className="text-ink-soft">Two-factor authentication is available as a future-ready option and is not required for this MVP.</p>
          </div>
        )}
        {section === "notifications" && (
          <div className="space-y-3 text-sm">
            <label className="flex items-center justify-between gap-3"><span>Payment failures</span><input type="checkbox" defaultChecked /></label>
            <label className="flex items-center justify-between gap-3"><span>Processing errors</span><input type="checkbox" defaultChecked /></label>
            <label className="flex items-center justify-between gap-3"><span>Expiring subscriptions</span><input type="checkbox" defaultChecked /></label>
            <label className="flex items-center justify-between gap-3"><span>Security alerts</span><input type="checkbox" defaultChecked /></label>
          </div>
        )}
        {section === "platform" && (
          <div className="space-y-3">
            <p className="text-sm text-ink-soft">Product-wide configuration lives in Platform Settings.</p>
            <Button href="/admin/settings" variant="secondary">Open platform settings</Button>
          </div>
        )}
        {section === "billing" && (
          <div className="space-y-2 text-sm">
            <p>Payments are processed through Paymob.</p>
            <p className="text-ink-soft">Currency defaults to EGP. Card numbers and secrets are never shown in the admin panel.</p>
          </div>
        )}
        <div className="mt-5 flex gap-2">
          <Button disabled={saving} onClick={() => { setSaving(true); window.setTimeout(() => setSaving(false), 400); }}>{saving ? "Saving..." : "Save"}</Button>
          <Button variant="secondary" onClick={async () => { await signOut(); router.replace("/sign-in"); }}>Sign Out</Button>
        </div>
      </div>
    </div>
  );
}

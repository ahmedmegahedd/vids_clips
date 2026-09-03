"use client";

import { PageHeader } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatDate, formatDateTime, initials } from "@/lib/admin/format";
import { useAdminStore } from "@/lib/admin/store";
import { getCurrentUser, signOut, type SessionUser } from "@/lib/auth/session";
import { roleLabel } from "@clipora/shared";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminProfilePage() {
  const router = useRouter();
  const toast = useAdminStore((s) => s.pushToast);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    void getCurrentUser().then((current) => {
      setUser(current);
      setName(current?.name ?? "");
    });
  }, []);

  if (signingOut) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink/15 border-t-ink" />
        <p className="mt-4 text-sm font-semibold">Signing you out...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="My Profile" />
      <div className="admin-card p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">{initials(user?.name ?? "Admin")}</span>
          <div>
            <p className="font-semibold">{user?.name ?? "Admin"}</p>
            <p className="text-sm text-ink-soft">{user?.email}</p>
          </div>
        </div>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-ink-faint">Name</dt><dd className="font-medium">{user?.name}</dd></div>
          <div><dt className="text-xs text-ink-faint">Email</dt><dd className="font-medium">{user?.email}</dd></div>
          <div><dt className="text-xs text-ink-faint">Role</dt><dd className="font-medium">{roleLabel(user?.role ?? "admin")}</dd></div>
          <div><dt className="text-xs text-ink-faint">Account Created</dt><dd className="font-medium">{formatDate(user?.createdAt)}</dd></div>
        </dl>
        {editing && (
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-4 h-11 w-full rounded-xl border border-[var(--line-strong)] px-3 text-sm" />
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          {editing ? (
            <Button disabled={saving} onClick={() => { setSaving(true); window.setTimeout(() => { setSaving(false); setEditing(false); toast("success", "Profile updated"); }, 400); }}>{saving ? "Saving..." : "Save"}</Button>
          ) : (
            <Button variant="secondary" onClick={() => setEditing(true)}>Edit Profile</Button>
          )}
          <Button variant="secondary" href="/reset-password">Change Password</Button>
          <Button variant="secondary" onClick={async () => { setSigningOut(true); await signOut(); router.replace("/sign-in"); }}>Sign Out</Button>
        </div>
      </div>
      <section className="admin-card p-5">
        <h2 className="font-semibold">Security</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-3"><span className="text-ink-soft">Last Login</span><span>{user?.lastLoginAt ? formatDateTime(user.lastLoginAt) : "This session"}</span></div>
          <div className="flex justify-between gap-3"><span className="text-ink-soft">Password</span><span>Set</span></div>
          <div className="flex justify-between gap-3"><span className="text-ink-soft">Google Account</span><span>Not connected</span></div>
          <div className="flex justify-between gap-3"><span className="text-ink-soft">Two-factor authentication</span><span>Coming later</span></div>
        </dl>
        <h3 className="mt-6 text-sm font-semibold">Active Sessions</h3>
        <div className="mt-2 divide-y divide-[var(--line)] text-sm">
          <div className="flex justify-between py-3"><span>This browser · Cairo</span><span className="text-xs font-semibold text-success">Current</span></div>
          <div className="flex justify-between py-3"><span>Safari on Mac · Cairo</span><span className="text-ink-faint">Yesterday</span></div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminToasts } from "@/components/admin/AdminToasts";
import { GlobalSearch } from "@/components/admin/GlobalSearch";
import { Button } from "@/components/ui/Button";
import { getCurrentUser, isAdmin, signOut, type SessionUser } from "@/lib/auth/session";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    void getCurrentUser().then(setUser);
    const stored = localStorage.getItem("clipora.admin.collapsed");
    if (stored === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.replace("/sign-in");
  }

  if (user === undefined) {
    return (
      <div className="admin-root flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-ink/15 border-t-ink" />
          <p className="mt-4 text-sm font-semibold">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.replace("/sign-in?next=/admin");
    return null;
  }

  if (!isAdmin(user)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Access restricted</h1>
        <p className="mt-3 max-w-md text-ink-soft">You don’t have permission to access this area.</p>
        <Button href="/dashboard" className="mt-6">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  if (signingOut) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink/15 border-t-ink" />
        <p className="mt-4 text-sm font-semibold">Signing you out...</p>
      </div>
    );
  }

  return (
    <div className="admin-root flex min-h-screen">
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => {
          const next = !collapsed;
          setCollapsed(next);
          localStorage.setItem("clipora.admin.collapsed", next ? "1" : "0");
        }}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        user={user}
        onSignOut={() => void handleSignOut()}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader user={user} onMenu={() => setMobileOpen(true)} onSearch={() => setSearchOpen(true)} onSignOut={() => void handleSignOut()} />
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AdminToasts />
    </div>
  );
}

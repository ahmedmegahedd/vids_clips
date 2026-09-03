"use client";

import { NotificationPanel } from "@/components/admin/NotificationPanel";
import { initials } from "@/lib/admin/format";
import { useAdminStore } from "@/lib/admin/store";
import type { SessionUser } from "@/lib/auth/session";
import { Bell, ChevronRight, Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

const TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/analytics": "Analytics",
  "/admin/users": "Users",
  "/admin/subscriptions": "Subscriptions",
  "/admin/payments": "Payments",
  "/admin/plans": "Plans & Pricing",
  "/admin/projects": "Projects",
  "/admin/activity": "Activity Log",
  "/admin/notifications": "Notifications",
  "/admin/status": "System Status",
  "/admin/settings": "Platform Settings",
  "/admin/settings/admin": "Admin Settings",
  "/admin/profile": "My Profile",
};

export function AdminHeader({
  user,
  onMenu,
  onSearch,
  onSignOut,
}: {
  user: SessionUser;
  onMenu: () => void;
  onSearch: () => void;
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  const unread = useAdminStore((s) => s.notifications.filter((n) => !n.read).length);
  const [notesOpen, setNotesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { title, crumbs } = useMemo(() => {
    const exact = TITLES[pathname];
    if (exact) return { title: exact, crumbs: [] as string[] };
    if (pathname.startsWith("/admin/users/")) return { title: "User details", crumbs: ["Users"] };
    if (pathname.startsWith("/admin/payments/")) return { title: "Payment details", crumbs: ["Payments"] };
    if (pathname.startsWith("/admin/projects/")) return { title: "Project details", crumbs: ["Projects"] };
    if (pathname.startsWith("/admin/plans/")) return { title: "Plan", crumbs: ["Plans"] };
    return { title: "Admin", crumbs: [] as string[] };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--line)] bg-white/90 px-3 backdrop-blur sm:px-5">
      <button type="button" className="rounded-lg p-2 text-ink lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        {crumbs.length > 0 && (
          <p className="hidden items-center gap-1 text-[11px] text-ink-faint sm:flex">
            {crumbs.map((crumb) => (
              <span key={crumb} className="inline-flex items-center gap-1">
                {crumb} <ChevronRight className="h-3 w-3" />
              </span>
            ))}
            <span className="text-ink-soft">{title}</span>
          </p>
        )}
        <h1 className="truncate text-sm font-semibold sm:text-base">{title}</h1>
      </div>
      <button
        type="button"
        onClick={onSearch}
        className="hidden h-9 items-center gap-2 rounded-xl border border-[var(--line-strong)] bg-[var(--bg)] px-3 text-xs text-ink-faint md:inline-flex"
      >
        <Search className="h-3.5 w-3.5" />
        Search
        <kbd className="rounded-md border border-[var(--line)] bg-white px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>
      <button type="button" className="rounded-lg p-2 md:hidden" onClick={onSearch} aria-label="Search">
        <Search className="h-5 w-5" />
      </button>
      <div className="relative">
        <button type="button" className="relative rounded-lg p-2" onClick={() => setNotesOpen((v) => !v)} aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />}
        </button>
        <NotificationPanel open={notesOpen} onClose={() => setNotesOpen(false)} />
      </div>
      <div className="relative">
        <button type="button" className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 hover:bg-[var(--bg-warm)]" onClick={() => setMenuOpen((v) => !v)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-white">{initials(user.name)}</span>
          <span className="hidden text-left text-xs sm:block">
            <span className="block font-semibold">{user.name}</span>
            <span className="block text-ink-faint">Admin</span>
          </span>
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-12 w-44 overflow-hidden rounded-xl border border-[var(--line)] bg-white py-1 shadow-[var(--shadow)]">
            <Link href="/admin/profile" className="block px-3 py-2 text-sm hover:bg-[var(--bg)]" onClick={() => setMenuOpen(false)}>
              Profile
            </Link>
            <Link href="/admin/settings/admin" className="block px-3 py-2 text-sm hover:bg-[var(--bg)]" onClick={() => setMenuOpen(false)}>
              Settings
            </Link>
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg)]"
              onClick={() => {
                setMenuOpen(false);
                onSignOut();
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

"use client";

import { Logo } from "@/components/brand/Logo";
import { initials } from "@/lib/admin/format";
import { cx } from "@/lib/cn";
import type { SessionUser } from "@/lib/auth/session";
import {
  Activity,
  Bell,
  ChevronLeft,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  LineChart,
  LogOut,
  MonitorSmartphone,
  Settings2,
  Shield,
  SlidersHorizontal,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", icon: LineChart },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: Wallet },
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/plans", label: "Plans", icon: SlidersHorizontal },
      { href: "/admin/projects", label: "Projects", icon: FolderKanban },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/activity", label: "Activity", icon: Activity },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/status", label: "System Status", icon: MonitorSmartphone },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/settings", label: "Platform Settings", icon: Settings2 },
      { href: "/admin/settings/admin", label: "Admin Settings", icon: Shield },
    ],
  },
];

export function AdminSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
  user,
  onSignOut,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  user: SessionUser;
  onSignOut: () => void;
}) {
  const pathname = usePathname();

  const content = (
    <div className="flex h-full flex-col">
      <div className={cx("flex h-14 items-center border-b border-[var(--line)] px-3", collapsed ? "justify-center" : "justify-between")}>
        {collapsed ? <Logo markOnly /> : <Logo />}
        <button type="button" className="hidden h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-[var(--bg-warm)] lg:flex" onClick={onToggle} aria-label="Collapse sidebar">
          <ChevronLeft className={cx("h-4 w-4 transition", collapsed && "rotate-180")} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV.map((group) => (
          <div key={group.label} className="mb-4">
            {!collapsed && (
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{group.label}</p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    title={item.label}
                    className={cx(
                      "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium",
                      collapsed && "justify-center px-0",
                      active ? "bg-ink text-white" : "text-ink-soft hover:bg-[var(--bg-warm)] hover:text-ink",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-[var(--line)] p-2">
        <Link
          href="/admin/profile"
          onClick={onCloseMobile}
          className={cx("flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-[var(--bg-warm)]", collapsed && "justify-center")}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-white">
            {initials(user.name)}
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold">{user.name}</span>
              <span className="block truncate text-[11px] text-ink-faint">Admin</span>
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className={cx("mt-1 flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-ink-soft hover:bg-[var(--bg-warm)] hover:text-ink", collapsed && "justify-center")}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className={cx("hidden shrink-0 border-r border-[var(--line)] bg-white transition-[width] duration-200 lg:block", collapsed ? "w-[72px]" : "w-[248px]")}>
        <div className="sticky top-0 h-screen">{content}</div>
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={onCloseMobile} />
          <aside className="relative h-full w-[248px] bg-white shadow-[var(--shadow-hover)]">{content}</aside>
        </div>
      )}
    </>
  );
}

export const ADMIN_NAV = NAV;

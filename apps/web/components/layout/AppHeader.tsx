"use client";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { getCurrentUser, isAdmin, signOut, type SessionUser } from "@/lib/auth/session";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AppHeader({ billing = false }: { billing?: boolean }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    void getCurrentUser().then(setUser);
  }, []);

  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--line)] bg-white/70 px-4 backdrop-blur sm:px-6">
      <Logo />
      <nav className="flex items-center gap-2 sm:gap-3">
        <Link href="/dashboard" className="hidden text-sm font-medium text-ink-soft hover:text-ink sm:inline">
          Your Videos
        </Link>
        <Link
          href="/account/billing"
          className={`text-sm font-medium ${billing ? "text-ink" : "text-ink-soft hover:text-ink"}`}
        >
          Billing
        </Link>
        {isAdmin(user) && (
          <Link href="/admin" className="text-sm font-medium text-ink-soft hover:text-ink">
            Admin
          </Link>
        )}
        {user?.email && <span className="hidden truncate text-xs text-ink-faint md:inline">{user.email}</span>}
        {user && (
          <button
            type="button"
            className="text-sm font-medium text-ink-soft hover:text-ink"
            onClick={async () => {
              await signOut();
              router.replace("/sign-in");
            }}
          >
            Sign Out
          </button>
        )}
        <Button href="/create?new=1" size="sm">
          + New Video
        </Button>
      </nav>
    </header>
  );
}

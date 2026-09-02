"use client";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";

export function AppHeader({ billing = false }: { billing?: boolean }) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
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
        {email && <span className="hidden truncate text-xs text-ink-faint md:inline">{email}</span>}
        <Button href="/create?new=1" size="sm">
          + New Video
        </Button>
      </nav>
    </header>
  );
}

"use client";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { cx } from "@/lib/cn";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
];

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(signedIn);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setAuthed(Boolean(data.user)));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(Boolean(session?.user));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-ink-soft md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {authed ? (
            <Button href="/dashboard" variant="primary" size="sm">
              Dashboard
            </Button>
          ) : (
            <>
              <Button href="/sign-in" variant="ghost" size="sm">
                Sign In
              </Button>
              <Button href="/create" size="sm">
                Get Started
              </Button>
            </>
          )}
        </div>
        <button
          className="rounded-xl p-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      <div className={cx("md:hidden", open ? "block" : "hidden")}>
        <div className="space-y-1 border-t border-[var(--line)] bg-[var(--bg)] px-4 py-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-xl px-3 py-2.5 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            <Button href={authed ? "/dashboard" : "/sign-in"} variant="secondary" className="flex-1">
              {authed ? "Dashboard" : "Sign In"}
            </Button>
            <Button href="/create" className="flex-1">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

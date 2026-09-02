import { Logo } from "@/components/brand/Logo";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--line)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-ink-soft">
            One video in. Multiple clips out. Built for creators who want ready-to-post clips without the editing grind.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Product</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-ink-soft">
            <Link href="/#how-it-works" className="hover:text-ink">
              How It Works
            </Link>
            <Link href="/pricing" className="hover:text-ink">
              Pricing
            </Link>
            <Link href="/faq" className="hover:text-ink">
              FAQ
            </Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold">Legal</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-ink-soft">
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--line)]">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-ink-faint sm:px-6">
          Process only videos you own or have permission to use. Clipora is not affiliated with YouTube, TikTok, or Meta.
        </p>
      </div>
    </footer>
  );
}

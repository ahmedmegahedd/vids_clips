import { cx } from "@/lib/cn";
import Link from "next/link";

export function Logo({ className, markOnly }: { className?: string; markOnly?: boolean }) {
  return (
    <Link href="/" className={cx("inline-flex items-center gap-2.5", className)} aria-label="Clipora home">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-white shadow-sm">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1.5" y="3" width="8.5" height="10" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
          <path d="M11.2 4.2 14.5 8l-3.3 3.8" stroke="#FF3D2E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {!markOnly && <span className="text-[17px] font-semibold tracking-tight">Clipora</span>}
    </Link>
  );
}

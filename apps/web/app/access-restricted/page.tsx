"use client";

import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/brand/Logo";

export default function AccessRestrictedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo />
      <h1 className="mt-10 text-3xl font-semibold tracking-tight">Access restricted</h1>
      <p className="mt-3 max-w-md text-ink-soft">You don’t have permission to access this area.</p>
      <Button href="/dashboard" className="mt-6">
        Return to Dashboard
      </Button>
    </main>
  );
}

"use client";

import { Button } from "@/components/ui/Button";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-3 max-w-md text-ink-soft">We couldn’t load this information right now.</p>
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>Try Again</Button>
        <Button href="/admin" variant="secondary">
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}

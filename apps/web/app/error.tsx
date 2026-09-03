"use client";

import { Button } from "@/components/ui/Button";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-3 max-w-md text-ink-soft">We couldn’t load this information right now.</p>
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>Try Again</Button>
        <Button href="/" variant="secondary">
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}

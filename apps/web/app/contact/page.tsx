import { MarketingShell } from "@/components/layout/MarketingShell";
import { Button } from "@/components/ui/Button";

export default function ContactPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-semibold tracking-tight">Talk with us about Business</h1>
        <p className="mt-3 text-ink-soft">
          Need more volume, seats, or a custom workflow? Send a note and we&apos;ll help you choose the right plan.
        </p>
        <form className="card mt-8 space-y-3 p-6" action="mailto:hello@clipora.app">
          <input className="h-12 w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--bg)] px-4" placeholder="Full name" name="name" />
          <input className="h-12 w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--bg)] px-4" placeholder="Work email" type="email" name="email" />
          <textarea className="min-h-32 w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--bg)] p-4" placeholder="What do you need?" name="message" />
          <Button type="submit" className="w-full">
            Send message
          </Button>
        </form>
      </section>
    </MarketingShell>
  );
}

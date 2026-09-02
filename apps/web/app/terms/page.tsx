import { MarketingShell } from "@/components/layout/MarketingShell";

export default function TermsPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-4 py-16 text-sm leading-7 text-ink-soft sm:px-6">
        <h1 className="text-4xl font-semibold tracking-tight text-ink">Terms of Service</h1>
        <p className="mt-6">
          Clipora helps you split long-form videos you own or have permission to use into short clips. By using the
          product, you agree to only process content you have the rights to, and not to use Clipora to infringe
          copyright or platform terms.
        </p>
        <p className="mt-4">
          Accounts, usage limits, and paid plans are provided as described on the pricing page. We may suspend access
          that appears abusive, unlawful, or harmful to other users.
        </p>
        <p className="mt-4">
          Processed files are stored so you can download them. You remain responsible for how you publish those clips.
        </p>
      </article>
    </MarketingShell>
  );
}

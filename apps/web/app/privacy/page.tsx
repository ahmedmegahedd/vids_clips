import { MarketingShell } from "@/components/layout/MarketingShell";

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-4 py-16 text-sm leading-7 text-ink-soft sm:px-6">
        <h1 className="text-4xl font-semibold tracking-tight text-ink">Privacy Policy</h1>
        <p className="mt-6">
          We collect the account details you provide, the video links you submit, and the clips we generate for you.
          We use this information to operate the product, enforce plan limits, and improve reliability.
        </p>
        <p className="mt-4">
          We do not sell your personal information. Video files and metadata are stored with our infrastructure
          providers (including Supabase) under access controls. You can request deletion of your account and associated
          projects.
        </p>
      </article>
    </MarketingShell>
  );
}

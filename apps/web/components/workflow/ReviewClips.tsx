"use client";

import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useWorkflow } from "@/lib/workflow-store";
import { FORMAT_META, formatDuration } from "@clipora/shared";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewClips() {
  const router = useRouter();
  const { video, clipSeconds, format, options, estimatedClips, setStep } = useWorkflow();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!video) return null;

  async function create() {
    if (!video) return;
    const source = video;
    setSubmitting(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const token = (await supabase?.auth.getSession())?.data.session?.access_token;
      const { project } = await api.createProject(
        {
          url: source.url,
          clipSeconds,
          format,
          options,
        },
        token ?? "",
      );
      router.push(`/p/${project.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "We couldn't start processing. Please try again.";
      if (message.toLowerCase().includes("unauthorized") || (err as { status?: number }).status === 401) {
        router.push(`/sign-in?next=${encodeURIComponent("/create")}`);
        return;
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const rows = [
    { k: "Source video", v: video.title },
    { k: "Video length", v: formatDuration(video.durationSeconds) },
    { k: "Clip length", v: `${clipSeconds} seconds` },
    { k: "Format", v: `${FORMAT_META[format].ratio} ${FORMAT_META[format].label}` },
    { k: "Estimated clips", v: String(estimatedClips()) },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">You&apos;re ready to create your clips</h1>
      <p className="mt-2 text-ink-soft">A quick look at what we&apos;ll make before we start.</p>

      <div className="card mt-8 divide-y divide-[var(--line)]">
        {rows.map((row) => (
          <div key={row.k} className="flex items-start justify-between gap-6 px-5 py-4">
            <p className="text-sm text-ink-soft">{row.k}</p>
            <p className="max-w-[60%] text-right text-sm font-semibold">{row.v}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-[rgba(196,58,43,0.2)] bg-[rgba(196,58,43,0.06)] px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <Button size="lg" className="mt-8 w-full" onClick={() => void create()} disabled={submitting}>
        {submitting ? <LoaderCircle size={16} className="animate-spin" /> : null}
        {submitting ? "Creating clips..." : "Create My Clips →"}
      </Button>
      <p className="mt-3 text-center text-sm text-ink-faint">You can change these settings anytime before generating.</p>
      <button type="button" className="mx-auto mt-4 block text-sm font-medium text-ink-soft" onClick={() => setStep("customize")}>
        Back to settings
      </button>
    </div>
  );
}

"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { UsageMeter } from "@/components/billing/UsageMeter";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDuration, type ProjectRecord, type UsageResponse } from "@clipora/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STATUS_STYLES: Record<string, string> = {
  processing: "bg-[rgba(196,122,18,0.12)] text-[#8a5a0c]",
  queued: "bg-[rgba(196,122,18,0.12)] text-[#8a5a0c]",
  ready: "bg-[var(--success-soft)] text-success",
  completed: "bg-[var(--success-soft)] text-success",
  failed: "bg-[rgba(196,58,43,0.1)] text-[var(--danger)]",
  draft: "bg-[var(--bg-warm)] text-ink-soft",
};

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRecord[] | null>(null);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      const token = (await supabase?.auth.getSession())?.data.session?.access_token;
      if (!token && supabase) {
        router.replace("/sign-in?next=/dashboard");
        return;
      }
      try {
        const { projects: list } = await api.listProjects(token);
        setProjects(list);
        try {
          setUsage(await api.getUsage(token));
        } catch {
          setUsage(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load your videos.");
        setProjects([]);
      }
    }
    void load();
  }, [router]);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Your Videos</h1>
            <p className="mt-1 text-ink-soft">Create and manage your clips.</p>
          </div>
          <Button href="/create?new=1">+ New Video</Button>
        </div>

        {usage && (
          <div className="mt-8">
            <UsageMeter usage={usage} />
          </div>
        )}

        {error && <p className="mt-6 text-sm text-[var(--danger)]">{error}</p>}

        {projects === null ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card h-64 animate-pulse bg-white/60" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="card mx-auto mt-14 max-w-lg px-6 py-16 text-center">
            <h2 className="text-2xl font-semibold">Your clips will appear here</h2>
            <p className="mt-2 text-ink-soft">Paste a YouTube video above to get started.</p>
            <Button href="/create?new=1" className="mt-6">
              Create Clips
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <article key={project.id} className="card overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={project.video.thumbnailUrl} alt="" className="aspect-video w-full object-cover" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold leading-snug">{project.video.title}</h2>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLES[project.status] ?? STATUS_STYLES.draft}`}>
                      {project.status === "ready" ? "Ready" : project.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">
                    {project.estimatedClips} clips · {formatDuration(project.video.durationSeconds)}
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {new Date(project.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                  <Link
                    href={`/p/${project.id}`}
                    className="mt-4 inline-flex text-sm font-semibold text-ink hover:text-accent"
                  >
                    Open Project →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

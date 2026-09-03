"use client";

import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/brand/Logo";
import { WorkflowStepper } from "@/components/workflow/WorkflowStepper";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PROCESSING_STAGE_COPY, PROCESSING_STAGE_HINT, formatDuration, type ProjectResponse } from "@clipora/shared";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ProjectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = getSupabaseBrowserClient();
        const token = (await supabase?.auth.getSession())?.data.session?.access_token;
        const next = await api.getProject(id, token);
        if (cancelled) return;
        setData(next);
        if (next.project.status === "ready" || next.project.status === "completed") {
          clearInterval(timer);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "We couldn't load this project.");
        }
      }
    }

    void load();
    const timer = setInterval(() => void load(), 1200);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [id]);

  if (error) {
    return (
      <Shell step={3}>
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-3xl font-semibold">We couldn&apos;t process this video</h1>
          <p className="mt-3 text-ink-soft">
            Please make sure the video is available and that you have permission to use it.
          </p>
          <Button href="/create" className="mt-8">
            Try Another Video
          </Button>
        </div>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell step={3}>
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <p className="text-ink-soft">Getting your video ready...</p>
        </div>
      </Shell>
    );
  }

  const { project, clips } = data;
  if (project.status === "failed") {
    return (
      <Shell step={3}>
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-3xl font-semibold">We couldn&apos;t process this video</h1>
          <p className="mt-3 text-ink-soft">
            {project.errorMessage ||
              "Please make sure the video is available and that you have permission to use it."}
          </p>
          <Button href="/create" className="mt-8">
            Try Another Video
          </Button>
        </div>
      </Shell>
    );
  }

  if (project.status === "ready" || project.status === "completed") {
    return <Results project={project} clips={clips} />;
  }

  return <Processing project={project} />;
}

function Shell({ children, step }: { children: React.ReactNode; step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="min-h-screen">
      <header className="flex h-14 items-center border-b border-[var(--line)] bg-white/70 px-4 backdrop-blur">
        <Logo />
      </header>
      <WorkflowStepper current={step} />
      {children}
    </div>
  );
}

function Processing({ project }: { project: ProjectResponse["project"] }) {
  const bars = Math.min(project.estimatedClips, 18);
  const filled = Math.round((project.progress / 100) * bars);

  return (
    <Shell step={3}>
      <div className="mx-auto max-w-2xl px-4 py-14 text-center">
        <p className="text-sm font-semibold text-accent">{PROCESSING_STAGE_COPY[project.stage]}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Creating your clips</h1>
        <p className="mt-3 text-ink-soft">{PROCESSING_STAGE_HINT[project.stage]}</p>

        <div className="card mt-10 p-6">
          <div className="flex h-16 overflow-hidden rounded-2xl bg-[var(--bg-warm)]">
            {Array.from({ length: bars }).map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-white/50 last:border-r-0 transition-colors duration-500"
                style={{
                  background: i < filled ? "#121211" : "#d9d5cc",
                  animation: i === filled ? "pulse-bar 1.2s ease-in-out infinite" : undefined,
                }}
              />
            ))}
          </div>
          <div className="mt-6 flex items-end justify-between">
            <div className="text-left">
              <p className="text-3xl font-semibold tabular-nums">{Math.round(project.progress)}%</p>
              <p className="text-sm text-ink-soft">Processing</p>
            </div>
            <p className="text-sm font-medium text-ink-soft">
              {project.currentClip > 0
                ? `Clip ${project.currentClip} of ${project.estimatedClips}`
                : project.stage === "preparing"
                  ? "Downloading"
                  : "Starting"}
            </p>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
          {[
            ["Your video", project.video.title],
            ["Length", formatDuration(project.video.durationSeconds)],
            ["Clip length", `${project.clipSeconds} sec`],
            ["Clips", String(project.estimatedClips)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-white/70 p-4 ring-1 ring-[var(--line)]">
              <dt className="text-xs text-ink-faint">{k}</dt>
              <dd className="mt-1 truncate text-sm font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Shell>
  );
}

function startBrowserDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
}

function Results({
  project,
  clips,
}: {
  project: ProjectResponse["project"];
  clips: ProjectResponse["clips"];
}) {
  const [active, setActive] = useState<ProjectResponse["clips"][number] | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const count = clips.length || project.estimatedClips;

  function downloadClip(clip: ProjectResponse["clips"][number]) {
    startBrowserDownload(
      api.clipFileUrl(project.id, clip.id, true),
      `clip-${String(clip.index + 1).padStart(2, "0")}.mp4`,
    );
  }

  function downloadAll() {
    setDownloading(true);
    startBrowserDownload(api.downloadAllUrl(project.id), "clipora-clips.zip");
    setDownloaded(true);
    window.setTimeout(() => setDownloading(false), 1200);
  }

  return (
    <Shell step={4}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-success">✓ Complete</p>
            <h1 className="mt-1 text-4xl font-semibold tracking-tight">Your clips are ready 🎉</h1>
            <p className="mt-2 text-ink-soft">We created {count} clips from your video.</p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Button
              size="lg"
              className="w-full sm:w-auto"
              disabled={downloading}
              onClick={() => void downloadAll()}
            >
              {downloading ? "Preparing download..." : "Download All Clips"}
            </Button>
            <p className="text-xs text-ink-faint">
              {downloaded ? "Your download is starting." : `Download all ${count} clips together.`}
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clips.map((clip) => (
            <article
              key={clip.id}
              className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]"
            >
              <button type="button" className="relative block aspect-[9/16] w-full bg-ink sm:aspect-video" onClick={() => setActive(clip)}>
                {clip.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={clip.thumbnailUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#1f1e1c] to-[#3d3a34] text-white/70">
                    Clip {String(clip.index + 1).padStart(2, "0")}
                  </div>
                )}
                <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
                  {clip.durationSeconds} sec
                </span>
              </button>
              <div className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">Clip {String(clip.index + 1).padStart(2, "0")}</p>
                  <p className="text-sm text-ink-soft">
                    {formatDuration(clip.startSeconds)} – {formatDuration(clip.endSeconds)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setActive(clip)}>
                    Preview
                  </Button>
                  <Button size="sm" variant="dark" onClick={() => downloadClip(clip)}>
                    Download
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button href="/create" variant="secondary">
            Create Another Video
          </Button>
        </div>
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6" onClick={() => setActive(null)}>
          <div className="card max-h-[92vh] w-full max-w-lg overflow-auto p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex max-w-[280px] items-center justify-center rounded-[32px] bg-ink p-2 shadow-2xl">
              <video
                key={active.id}
                src={api.clipFileUrl(project.id, active.id)}
                controls
                playsInline
                preload="metadata"
                className="max-h-[70vh] w-full rounded-[24px]"
              />
            </div>
            <div className="mt-5">
              <p className="text-lg font-semibold">Clip {String(active.index + 1).padStart(2, "0")}</p>
              <p className="text-sm text-ink-soft">
                {formatDuration(active.startSeconds)} – {formatDuration(active.endSeconds)} · {active.durationSeconds} seconds
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" onClick={() => downloadClip(active)}>
                  Download Clip
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setActive(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

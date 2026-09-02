"use client";

import { Button } from "@/components/ui/Button";
import { YoutubeInput } from "@/components/landing/YoutubeInput";
import { cx } from "@/lib/cn";
import { useWorkflow } from "@/lib/workflow-store";
import { formatDurationLong } from "@clipora/shared";
import { Play } from "lucide-react";
import { useState } from "react";

export function VideoConfirm() {
  const { video, resetVideo, setStep, clipSeconds, estimatedClips } = useWorkflow();
  const [playing, setPlaying] = useState(false);

  if (!video) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Paste your YouTube link</h1>
        <p className="mt-2 text-ink-soft">That&apos;s all it takes to get started.</p>
        <div className="mt-8">
          <YoutubeInput
            variant="compact"
            onContinue={() => setStep("confirm")}
          />
        </div>
      </div>
    );
  }

  const clips = estimatedClips();

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:py-14">
      <div className="card overflow-hidden">
        <div className="relative aspect-video bg-ink">
          {playing ? (
            <iframe
              title={video.title}
              src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
              className="h-full w-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group relative h-full w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 bg-black/20 transition group-hover:bg-black/30" />
              <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-lg">
                <Play size={22} fill="currentColor" />
              </span>
            </button>
          )}
        </div>
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Your video</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{video.title}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
            <span className="rounded-full bg-[var(--bg-warm)] px-2.5 py-1 font-medium text-ink">{video.channelName}</span>
            <span>{formatDurationLong(video.durationSeconds)}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">
              YouTube
            </span>
          </div>
          <p className="mt-4 text-sm text-ink-soft">
            Estimated clips: <span className="font-semibold text-ink">{clips}</span>
            <span className="text-ink-faint"> · based on {clipSeconds}s clips</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center">
        <h1 className="text-3xl font-semibold tracking-tight">Is this the video you want to split?</h1>
        <p className="mt-3 text-ink-soft">
          We&apos;ll use this source to create your clips. You can change it if this isn&apos;t the right one.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Button size="lg" className="w-full" onClick={() => setStep("customize")}>
            Yes, continue →
          </Button>
          <Button size="lg" variant="secondary" className="w-full" onClick={resetVideo}>
            Change video
          </Button>
        </div>
        <p className={cx("mt-6 text-sm text-ink-faint")}>
          Only process videos you own or have permission to use.
        </p>
      </div>
    </div>
  );
}

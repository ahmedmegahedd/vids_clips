"use client";

import { Button } from "@/components/ui/Button";
import { cx } from "@/lib/cn";
import { useWorkflow } from "@/lib/workflow-store";
import {
  CLIP_LENGTH_OPTIONS,
  FORMAT_META,
  OUTPUT_FORMATS,
  estimateClipCount,
  formatDuration,
} from "@clipora/shared";
import { ChevronDown } from "lucide-react";

const LENGTH_COPY: Record<number, string> = {
  15: "Perfect for quick moments",
  30: "Great for short-form content",
  60: "Ideal for Shorts & TikTok",
  90: "For longer moments",
};

export function CustomizeClips() {
  const {
    video,
    clipSeconds,
    setClipSeconds,
    usingCustom,
    setUsingCustom,
    customMinutes,
    customSeconds,
    setCustomDuration,
    format,
    setFormat,
    options,
    setOptions,
    moreOpen,
    setMoreOpen,
    setStep,
  } = useWorkflow();

  if (!video) return null;

  const estimated = estimateClipCount(video.durationSeconds, clipSeconds);
  const segments = Math.min(estimated, 12);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-12">
      <aside className="h-fit lg:sticky lg:top-24">
        <div className="card overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={video.thumbnailUrl} alt="" className="aspect-video w-full object-cover" />
          <div className="p-5">
            <p className="text-sm font-medium text-ink-faint">Your video</p>
            <h2 className="mt-1 font-semibold leading-snug">{video.title}</h2>
            <p className="mt-3 text-sm text-ink-soft">{formatDuration(video.durationSeconds)}</p>
          </div>
        </div>
      </aside>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">How should we split your video?</h1>
        <p className="mt-2 text-ink-soft">Choose how long you want each clip to be.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {CLIP_LENGTH_OPTIONS.map((seconds) => {
            const selected = !usingCustom && clipSeconds === seconds;
            return (
              <button
                key={seconds}
                type="button"
                onClick={() => setClipSeconds(seconds)}
                className={cx(
                  "rounded-3xl border bg-white p-5 text-left transition",
                  selected
                    ? "border-ink shadow-[0_0_0_1px_#121211]"
                    : "border-[var(--line)] hover:border-[var(--line-strong)]",
                )}
              >
                <div className="flex items-start justify-between">
                  <p className="text-lg font-semibold">{seconds} seconds</p>
                  {seconds === 60 && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-ink-soft">{LENGTH_COPY[seconds]}</p>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              setUsingCustom(true);
              setCustomDuration(customMinutes, customSeconds);
            }}
            className={cx(
              "rounded-3xl border bg-white p-5 text-left transition sm:col-span-2",
              usingCustom ? "border-ink shadow-[0_0_0_1px_#121211]" : "border-[var(--line)]",
            )}
          >
            <p className="text-lg font-semibold">Custom</p>
            <p className="mt-1 text-sm text-ink-soft">Choose your own duration</p>
            {usingCustom && (
              <div className="mt-4">
                <p className="text-sm font-medium">Clip duration</p>
                <div className="mt-2 flex items-center gap-3">
                  <label className="flex items-center gap-2 rounded-2xl bg-[var(--bg)] px-3 py-2 ring-1 ring-[var(--line)]">
                    <input
                      type="number"
                      min={0}
                      max={3}
                      value={customMinutes}
                      onChange={(e) => setCustomDuration(Number(e.target.value), customSeconds)}
                      className="w-12 bg-transparent text-center text-lg font-semibold outline-none"
                    />
                    <span className="text-sm text-ink-soft">min</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-2xl bg-[var(--bg)] px-3 py-2 ring-1 ring-[var(--line)]">
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={customSeconds}
                      onChange={(e) => setCustomDuration(customMinutes, Number(e.target.value))}
                      className="w-12 bg-transparent text-center text-lg font-semibold outline-none"
                    />
                    <span className="text-sm text-ink-soft">sec</span>
                  </label>
                </div>
                <p className="mt-2 text-sm text-ink-faint">Your video will be divided into clips of this length.</p>
              </div>
            )}
          </button>
        </div>

        <div className="card mt-8 p-5">
          <p className="font-medium">
            Your {formatDuration(video.durationSeconds)} video will become approximately{" "}
            <span className="text-accent">{estimated} clips</span>.
          </p>
          <div className="mt-4 flex h-10 overflow-hidden rounded-xl bg-[var(--bg-warm)] ring-1 ring-[var(--line)]">
            {Array.from({ length: segments }).map((_, i) => (
              <div
                key={i}
                className="relative flex flex-1 items-center justify-center border-r border-white/70 last:border-r-0"
                style={{ background: i % 2 === 0 ? "#1f1e1c" : "#3a3834" }}
              >
                <span className="text-[10px] font-semibold text-white/80">
                  {i === segments - 1 && estimated > segments ? "..." : `Clip ${String(i + 1).padStart(2, "0")}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <h3 className="mt-10 text-xl font-semibold tracking-tight">Choose your format</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {OUTPUT_FORMATS.map((key) => {
            const meta = FORMAT_META[key];
            const selected = format === key;
            const aspect =
              key === "vertical" ? "aspect-[9/16] w-12" : key === "square" ? "aspect-square w-14" : "aspect-video w-20";
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFormat(key)}
                className={cx(
                  "rounded-3xl border bg-white p-5 text-left transition",
                  selected ? "border-ink shadow-[0_0_0_1px_#121211]" : "border-[var(--line)]",
                )}
              >
                <div className="mb-4 flex h-20 items-end">
                  <div className={cx("rounded-md bg-ink/90", aspect)} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{meta.label}</p>
                  {meta.recommended && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                      Best for Shorts & TikTok
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-ink-soft">{meta.ratio}</p>
                <p className="mt-2 text-xs text-ink-faint">{meta.platforms}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-semibold"
            onClick={() => setMoreOpen(!moreOpen)}
          >
            More options
            <ChevronDown size={16} className={cx("transition", moreOpen && "rotate-180")} />
          </button>
          {moreOpen && (
            <div className="card mt-3 space-y-3 p-5">
              <Toggle
                label="Keep original quality"
                checked={options.keepOriginalQuality}
                onChange={(keepOriginalQuality) => setOptions({ keepOriginalQuality })}
              />
              <Toggle
                label="Preserve original audio"
                checked={options.preserveOriginalAudio}
                onChange={(preserveOriginalAudio) => setOptions({ preserveOriginalAudio })}
              />
              <div>
                <p className="text-sm font-medium">How the video fits the frame</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(
                    [
                      ["crop", "Crop to fill"],
                      ["fit", "Fit video to frame"],
                      ["pad", "Add padding"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setOptions({ fitMode: value })}
                      className={cx(
                        "rounded-2xl border px-3 py-2 text-sm",
                        options.fitMode === value ? "border-ink bg-[var(--bg)] font-semibold" : "border-[var(--line)]",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 z-10 -mx-4 mt-10 bg-[linear-gradient(to_top,var(--bg)_70%,transparent)] px-4 pb-4 pt-6 sm:static sm:mx-0 sm:bg-none sm:px-0 sm:pt-8">
          <Button size="lg" className="w-full sm:w-auto" onClick={() => setStep("review")}>
            Continue to review →
          </Button>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          "h-7 w-12 rounded-full p-0.5 transition",
          checked ? "bg-ink" : "bg-[var(--bg-warm)] ring-1 ring-[var(--line)]",
        )}
      >
        <span className={cx("block h-6 w-6 rounded-full bg-white shadow-sm transition", checked && "translate-x-5")} />
      </button>
    </label>
  );
}

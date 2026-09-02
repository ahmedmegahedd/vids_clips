export const CLIP_LENGTH_OPTIONS = [15, 30, 60, 90] as const;
export type PresetClipLength = (typeof CLIP_LENGTH_OPTIONS)[number];

export type ClipLengthChoice = PresetClipLength | "custom";

export const DEFAULT_CLIP_SECONDS = 60;
export const RECOMMENDED_CLIP_SECONDS = 60;
export const MIN_CUSTOM_SECONDS = 5;
export const MAX_CUSTOM_SECONDS = 180;

export const OUTPUT_FORMATS = ["vertical", "landscape", "square"] as const;
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export const FORMAT_META: Record<
  OutputFormat,
  { ratio: string; label: string; platforms: string; recommended?: boolean }
> = {
  vertical: {
    ratio: "9:16",
    label: "Vertical",
    platforms: "TikTok · YouTube Shorts · Instagram Reels",
    recommended: true,
  },
  landscape: {
    ratio: "16:9",
    label: "Landscape",
    platforms: "YouTube · Desktop",
  },
  square: {
    ratio: "1:1",
    label: "Square",
    platforms: "Social media posts",
  },
};

export type FitMode = "fit" | "crop" | "pad";

export interface OutputOptions {
  keepOriginalQuality: boolean;
  fitMode: FitMode;
  preserveOriginalAudio: boolean;
}

export const DEFAULT_OUTPUT_OPTIONS: OutputOptions = {
  keepOriginalQuality: true,
  fitMode: "crop",
  preserveOriginalAudio: true,
};

export function estimateClipCount(durationSeconds: number, clipSeconds: number): number {
  if (durationSeconds <= 0 || clipSeconds <= 0) return 0;
  return Math.max(1, Math.ceil(durationSeconds / clipSeconds));
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatDurationLong(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const parts: string[] = [];
  if (hours) parts.push(`${hours} hr`);
  if (minutes) parts.push(`${minutes} min`);
  if (seconds || parts.length === 0) parts.push(`${seconds} sec`);
  return parts.join(" ");
}

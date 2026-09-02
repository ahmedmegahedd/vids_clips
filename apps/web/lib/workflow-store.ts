import {
  DEFAULT_CLIP_SECONDS,
  DEFAULT_OUTPUT_OPTIONS,
  estimateClipCount,
  type OutputFormat,
  type OutputOptions,
  type VideoMeta,
} from "@clipora/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WorkflowStep = "input" | "confirm" | "customize" | "review";

const SAMPLE_VIDEO: VideoMeta = {
  youtubeId: "aqz-KE-bpKQ",
  url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  title: "Big Buck Bunny",
  channelName: "Blender",
  thumbnailUrl: "https://i.ytimg.com/vi/aqz-KE-bpKQ/maxresdefault.jpg",
  durationSeconds: 634,
};

interface WorkflowState {
  step: WorkflowStep;
  url: string;
  video: VideoMeta | null;
  resolving: boolean;
  resolveError: string | null;
  clipSeconds: number;
  customMinutes: number;
  customSeconds: number;
  usingCustom: boolean;
  format: OutputFormat;
  options: OutputOptions;
  moreOpen: boolean;
  setUrl: (url: string) => void;
  setStep: (step: WorkflowStep) => void;
  setVideo: (video: VideoMeta | null) => void;
  setResolving: (resolving: boolean) => void;
  setResolveError: (error: string | null) => void;
  setClipSeconds: (seconds: number) => void;
  setCustomDuration: (minutes: number, seconds: number) => void;
  setUsingCustom: (value: boolean) => void;
  setFormat: (format: OutputFormat) => void;
  setOptions: (options: Partial<OutputOptions>) => void;
  setMoreOpen: (open: boolean) => void;
  loadSample: () => void;
  resetVideo: () => void;
  resetAll: () => void;
  estimatedClips: () => number;
}

export const useWorkflow = create<WorkflowState>()(
  persist(
    (set, get) => ({
      step: "input",
      url: "",
      video: null,
      resolving: false,
      resolveError: null,
      clipSeconds: DEFAULT_CLIP_SECONDS,
      customMinutes: 1,
      customSeconds: 30,
      usingCustom: false,
      format: "vertical",
      options: DEFAULT_OUTPUT_OPTIONS,
      moreOpen: false,
      setUrl: (url) => set({ url, resolveError: null }),
      setStep: (step) => set({ step }),
      setVideo: (video) => set({ video }),
      setResolving: (resolving) => set({ resolving }),
      setResolveError: (resolveError) => set({ resolveError }),
      setClipSeconds: (clipSeconds) => set({ clipSeconds, usingCustom: false }),
      setCustomDuration: (customMinutes, customSeconds) => {
        const total = Math.max(5, customMinutes * 60 + customSeconds);
        set({ customMinutes, customSeconds, clipSeconds: total, usingCustom: true });
      },
      setUsingCustom: (usingCustom) => set({ usingCustom }),
      setFormat: (format) => set({ format }),
      setOptions: (options) => set({ options: { ...get().options, ...options } }),
      setMoreOpen: (moreOpen) => set({ moreOpen }),
      loadSample: () =>
        set({
          url: SAMPLE_VIDEO.url,
          video: SAMPLE_VIDEO,
          resolveError: null,
          step: "confirm",
        }),
      resetVideo: () =>
        set({
          step: "input",
          video: null,
          resolveError: null,
        }),
      resetAll: () =>
        set({
          step: "input",
          url: "",
          video: null,
          resolving: false,
          resolveError: null,
          clipSeconds: DEFAULT_CLIP_SECONDS,
          customMinutes: 1,
          customSeconds: 30,
          usingCustom: false,
          format: "vertical",
          options: DEFAULT_OUTPUT_OPTIONS,
          moreOpen: false,
        }),
      estimatedClips: () => {
        const video = get().video;
        if (!video) return 0;
        return estimateClipCount(video.durationSeconds, get().clipSeconds);
      },
    }),
    {
      name: "clipora-workflow",
      partialize: (state) => ({
        url: state.url,
        video: state.video,
        clipSeconds: state.clipSeconds,
        customMinutes: state.customMinutes,
        customSeconds: state.customSeconds,
        usingCustom: state.usingCustom,
        format: state.format,
        options: state.options,
        step: state.step === "input" && state.video ? "confirm" : state.step,
      }),
    },
  ),
);

export { SAMPLE_VIDEO };

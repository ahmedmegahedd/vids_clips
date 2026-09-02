"use client";

import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { cx } from "@/lib/cn";
import { useWorkflow } from "@/lib/workflow-store";
import { extractYouTubeId } from "@clipora/shared";
import { ArrowRight, Check, Clipboard, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function YoutubeInput({
  variant = "hero",
  onContinue,
}: {
  variant?: "hero" | "compact";
  onContinue?: () => void;
}) {
  const router = useRouter();
  const { url, setUrl, setVideo, setResolving, setResolveError, resolving, resolveError, loadSample } =
    useWorkflow();
  const [pasted, setPasted] = useState(false);

  const videoId = useMemo(() => extractYouTubeId(url), [url]);
  const valid = Boolean(videoId);

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setPasted(true);
        setTimeout(() => setPasted(false), 1200);
      }
    } catch {
      setResolveError("Clipboard access was blocked. Paste the link with ⌘V instead.");
    }
  }

  async function continueFlow() {
    if (!valid) {
      setResolveError("That link doesn't look right. Please check the YouTube URL and try again.");
      return;
    }
    setResolving(true);
    setResolveError(null);
    try {
      const { video } = await api.resolveVideo(url);
      setVideo(video);
      setUrl(video.url);
      if (onContinue) onContinue();
      else {
        useWorkflow.setState({ step: "confirm" });
        router.push("/create");
      }
    } catch (error) {
      setResolveError(
        error instanceof Error ? error.message : "We couldn't find that video. Please try another link.",
      );
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className={cx("w-full", variant === "hero" && "mx-auto max-w-2xl")}>
      <div
        className={cx(
          "card p-3 sm:p-4",
          variant === "hero" && "p-4 sm:p-5",
          valid && "ring-1 ring-[rgba(31,138,91,0.25)]",
        )}
      >
        <label htmlFor="youtube-url" className="mb-2 block px-1 text-sm font-medium text-ink-soft">
          Paste your YouTube video link
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div
            className={cx(
              "flex min-h-[52px] flex-1 items-center gap-2 rounded-2xl border border-[var(--line-strong)] bg-[var(--bg)] px-3 transition-all",
              "focus-within:border-[rgba(255,61,46,0.35)] focus-within:shadow-[0_0_0_4px_var(--accent-soft)]",
            )}
          >
            <input
              id="youtube-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void continueFlow();
              }}
              placeholder="https://youtube.com/watch?v=..."
              className="h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-faint"
              autoComplete="off"
              inputMode="url"
            />
            <button
              type="button"
              onClick={() => void pasteFromClipboard()}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 text-sm font-semibold text-ink shadow-sm ring-1 ring-[var(--line)]"
            >
              {pasted ? <Check size={14} className="text-success" /> : <Clipboard size={14} />}
              Paste
            </button>
          </div>
          <Button
            size="lg"
            className="w-full sm:w-auto sm:min-w-[148px]"
            onClick={() => void continueFlow()}
            disabled={resolving}
          >
            {resolving ? <LoaderCircle size={16} className="animate-spin" /> : null}
            {resolving ? "Checking..." : "Continue"}
            {!resolving && <ArrowRight size={16} />}
          </Button>
        </div>
        <div className="mt-3 flex min-h-[22px] items-center justify-between gap-3 px-1">
          {valid ? (
            <p className="flex items-center gap-1.5 text-sm font-medium text-success">
              <Check size={14} /> YouTube link detected
            </p>
          ) : resolveError ? (
            <p className="text-sm text-[var(--danger)]">{resolveError}</p>
          ) : (
            <p className="text-sm text-ink-faint">No editing experience required.</p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          loadSample();
          router.push("/create");
        }}
        className="mx-auto mt-4 block text-sm font-medium text-ink-soft underline-offset-4 hover:text-ink hover:underline"
      >
        Or try a sample video
      </button>
    </div>
  );
}

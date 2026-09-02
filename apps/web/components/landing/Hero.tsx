import { YoutubeInput } from "@/components/landing/YoutubeInput";

export function Hero() {
  return (
    <section className="relative px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:pt-24">
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/70 px-3 py-1 text-xs font-semibold tracking-wide text-ink-soft">
          Paste. Customize. Split. Download.
        </p>
        <h1 className="text-balance px-1 text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[1.05]">
          Turn Long Videos Into{" "}
          <span className="serif-italic text-[1.08em] text-accent">Ready-to-Post Clips</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl px-1 text-pretty text-base leading-7 text-ink-soft sm:text-lg">
          Paste a YouTube video, choose your clip length, and split it into perfectly sized clips in minutes.
        </p>
        <div className="mt-10">
          <YoutubeInput />
        </div>
      </div>
    </section>
  );
}

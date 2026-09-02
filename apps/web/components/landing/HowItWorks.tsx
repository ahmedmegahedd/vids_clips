const steps = [
  {
    n: "01",
    title: "Paste",
    headline: "Add your YouTube video",
    body: "Paste the link to the video you want to split.",
  },
  {
    n: "02",
    title: "Customize",
    headline: "Choose how you want your clips divided",
    body: "Select your preferred clip duration and format.",
  },
  {
    n: "03",
    title: "Download",
    headline: "Get your clips",
    body: "Download individual clips or everything together.",
  },
];

function FrameGraphic({ index }: { index: number }) {
  const bars = index === 0 ? 1 : index === 1 ? 3 : 6;
  return (
    <div className="relative mb-6 h-28 overflow-hidden rounded-2xl bg-[var(--bg-warm)] ring-1 ring-[var(--line)]">
      <div className="absolute inset-3 flex items-end gap-1.5">
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-md bg-ink/90"
            style={{ height: `${56 + ((i * 17) % 28)}%`, opacity: 0.75 + i * 0.04 }}
          />
        ))}
      </div>
      <div className="absolute right-3 top-3 h-2 w-8 rounded-full bg-accent" />
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-xl">
          <p className="text-sm font-semibold text-accent">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Three steps. Then you&apos;re posting.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <article key={step.n} className="card p-6">
              <FrameGraphic index={i} />
              <p className="text-xs font-semibold tracking-[0.16em] text-ink-faint">
                {step.n} — {step.title.toUpperCase()}
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">{step.headline}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

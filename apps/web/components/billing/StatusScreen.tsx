import { Logo } from "@/components/brand/Logo";

export function StatusScreen({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo />
      <div className="mt-8 h-12 w-12 animate-spin rounded-full border-2 border-ink/15 border-t-ink" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-md text-ink-soft">{body}</p>
    </div>
  );
}

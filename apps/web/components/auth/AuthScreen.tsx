"use client";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Authentication isn't configured yet. Add your Supabase keys to .env.local to enable sign in.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "sign-in") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.replace(next);
        router.refresh();
      } else {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
        });
        if (authError) throw authError;
        setInfo("Check your email to confirm your account. You can keep creating while you wait.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Authentication isn't configured yet.");
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Logo />
      <div className="card mt-8 w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "sign-in" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {mode === "sign-in" ? "Sign in to open your videos and downloads." : "Save your clips and pick up where you left off."}
        </p>
        {!hasSupabaseConfig() && (
          <p className="mt-4 rounded-2xl bg-[var(--bg-warm)] px-3 py-2 text-sm text-ink-soft">
            Demo mode: add Supabase keys to enable real accounts.
          </p>
        )}
        <form className="mt-6 space-y-3" onSubmit={(e) => void submit(e)}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="h-12 w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--bg)] px-4 outline-none focus:shadow-[0_0_0_4px_var(--accent-soft)]"
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="h-12 w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--bg)] px-4 outline-none focus:shadow-[0_0_0_4px_var(--accent-soft)]"
          />
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          {info && <p className="text-sm text-success">{info}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {mode === "sign-in" ? "Sign In" : "Create account"}
          </Button>
        </form>
        <Button type="button" variant="secondary" className="mt-3 w-full" onClick={() => void google()}>
          Continue with Google
        </Button>
        <p className="mt-5 text-center text-sm text-ink-soft">
          {mode === "sign-in" ? (
            <>
              New here?{" "}
              <Link href={`/sign-up?next=${encodeURIComponent(next)}`} className="font-semibold text-ink">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href={`/sign-in?next=${encodeURIComponent(next)}`} className="font-semibold text-ink">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export function AuthScreen({ mode }: { mode: "sign-in" | "sign-up" }) {
  return (
    <Suspense>
      <AuthForm mode={mode} />
    </Suspense>
  );
}

"use client";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { AuthFlowError, hasSupabaseConfig, homeFor, signInWithGoogle, signInWithPassword, signUpWithPassword } from "@/lib/auth/session";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18Z" />
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332Z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58Z" />
    </svg>
  );
}

function Field({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        required
        minLength={type === "password" ? 8 : undefined}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--bg)] px-4 text-sm outline-none transition focus:shadow-[0_0_0_4px_var(--accent-soft)]"
      />
    </label>
  );
}

function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const params = useSearchParams();
  const requestedNext = params.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<"created" | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "sign-up" && password !== confirm) {
      setError("Passwords don’t match.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "sign-in") {
        const user = await signInWithPassword(email, password);
        const destination = requestedNext && !(requestedNext.startsWith("/admin") && user.role === "user")
          ? requestedNext
          : homeFor(user);
        router.replace(destination);
        router.refresh();
      } else {
        const { confirmEmail } = await signUpWithPassword(email, password);
        if (confirmEmail) {
          setSuccess("created");
        } else {
          setSuccess("created");
          window.setTimeout(() => {
            router.replace("/dashboard");
            router.refresh();
          }, 1400);
        }
      }
    } catch (err) {
      setError(err instanceof AuthFlowError ? err.message : "That didn't work. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setError(null);
    try {
      await signInWithGoogle(requestedNext || "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in isn’t available yet.");
    }
  }

  if (success === "created") {
    return (
      <AuthCard>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--success-soft)] text-success">✓</div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Account created successfully</h1>
        <p className="mt-2 text-sm text-ink-soft">Welcome! Let’s get you started.</p>
        <Button href="/dashboard" className="mt-6 w-full" size="lg">
          Continue
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[inherit] bg-white/80 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink/15 border-t-ink" />
          <p className="mt-4 text-sm font-semibold">{mode === "sign-in" ? "Signing you in..." : "Creating your account..."}</p>
        </div>
      )}
      <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
        {mode === "sign-in" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        {mode === "sign-in" ? "Sign in to continue to your account." : "Start turning your videos into clips today."}
      </p>

      <button
        type="button"
        onClick={() => void google()}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-[var(--line-strong)] bg-white text-sm font-semibold transition hover:bg-[var(--bg-warm)]"
      >
        <GoogleMark />
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-[11px] font-semibold tracking-[0.14em] text-ink-faint">
        <span className="h-px flex-1 bg-[var(--line-strong)]" />
        OR
        <span className="h-px flex-1 bg-[var(--line-strong)]" />
      </div>

      <form className="space-y-3" onSubmit={(e) => void submit(e)}>
        <Field id="email" label="Email" type="email" value={email} onChange={setEmail} placeholder="Enter your email" autoComplete="email" />
        <Field
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
        />
        {mode === "sign-up" && (
          <Field
            id="confirm"
            label="Confirm Password"
            type="password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Confirm your password"
            autoComplete="new-password"
          />
        )}
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {mode === "sign-in" ? "Sign In" : "Create Account"}
        </Button>
      </form>

      {mode === "sign-in" && (
        <p className="mt-4 text-sm">
          <Link href="/forgot-password" className="font-semibold text-ink hover:text-accent">
            Forgot password?
          </Link>
        </p>
      )}

      <p className="mt-5 text-center text-sm text-ink-soft">
        {mode === "sign-in" ? (
          <>
            Don’t have an account?{" "}
            <Link href={`/sign-up${requestedNext ? `?next=${encodeURIComponent(requestedNext)}` : ""}`} className="font-semibold text-ink">
              Create one
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href={`/sign-in${requestedNext ? `?next=${encodeURIComponent(requestedNext)}` : ""}`} className="font-semibold text-ink">
              Sign in
            </Link>
          </>
        )}
      </p>

      {!hasSupabaseConfig() && (
        <p className="mt-5 rounded-2xl bg-[var(--bg-warm)] px-3 py-2 text-center text-xs leading-5 text-ink-soft">
          Demo mode — use <span className="font-semibold text-ink">admin@clipora.app</span> to open the admin panel, or any other email for a customer account.
        </p>
      )}
    </AuthCard>
  );
}

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full max-w-md">
      <div className="card relative p-6 sm:p-8">{children}</div>
    </div>
  );
}

export function AuthScreen({ mode }: { mode: "sign-in" | "sign-up" }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Logo />
      <div className="mt-8 w-full max-w-md">
        <Suspense>
          <AuthForm mode={mode} />
        </Suspense>
      </div>
    </main>
  );
}

export function AuthStateScreen({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Logo />
      <div className="card mt-8 w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">{body}</p>
        {children}
      </div>
    </main>
  );
}

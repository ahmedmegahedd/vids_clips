"use client";

import { AuthStateScreen } from "@/components/auth/AuthScreen";
import { Button } from "@/components/ui/Button";
import { AuthFlowError, requestPasswordReset } from "@/lib/auth/session";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (sent) {
    return (
      <AuthStateScreen title="Check your email" body="We’ve sent you a password reset link.">
        <Button href="/sign-in" className="mt-6 w-full" size="lg">
          Back to sign in
        </Button>
      </AuthStateScreen>
    );
  }

  return (
    <AuthStateScreen title="Reset your password" body="Enter your email and we’ll help you regain access to your account.">
      <form
        className="mt-6 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          setLoading(true);
          void requestPasswordReset(email)
            .then(() => setSent(true))
            .catch((err) => setError(err instanceof AuthFlowError ? err.message : "Please try again."))
            .finally(() => setLoading(false));
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="h-12 w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--bg)] px-4 text-sm outline-none focus:shadow-[0_0_0_4px_var(--accent-soft)]"
          />
        </label>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </Button>
      </form>
    </AuthStateScreen>
  );
}

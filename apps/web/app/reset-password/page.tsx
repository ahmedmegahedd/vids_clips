"use client";

import { AuthStateScreen } from "@/components/auth/AuthScreen";
import { Button } from "@/components/ui/Button";
import { updatePassword } from "@/lib/auth/session";
import { useState } from "react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  if (done) {
    return (
      <AuthStateScreen title="Password updated" body="You can now sign in with your new password.">
        <Button href="/sign-in" className="mt-6 w-full" size="lg">
          Sign In
        </Button>
      </AuthStateScreen>
    );
  }

  return (
    <AuthStateScreen title="Choose a new password" body="Use at least 8 characters. You’ll use this the next time you sign in.">
      <form
        className="mt-6 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (password !== confirm) {
            setError("Passwords don’t match.");
            return;
          }
          setError(null);
          setLoading(true);
          void updatePassword(password)
            .then(() => setDone(true))
            .catch((err) => setError(err instanceof Error ? err.message : "Please try again."))
            .finally(() => setLoading(false));
        }}
      >
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          className="h-12 w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--bg)] px-4 text-sm outline-none focus:shadow-[0_0_0_4px_var(--accent-soft)]"
        />
        <input
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm password"
          className="h-12 w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--bg)] px-4 text-sm outline-none focus:shadow-[0_0_0_4px_var(--accent-soft)]"
        />
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Updating..." : "Update password"}
        </Button>
      </form>
    </AuthStateScreen>
  );
}

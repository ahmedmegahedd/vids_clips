import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase/client";
import { isAdminRole, type AppRole } from "@clipora/shared";

const STORAGE_KEY = "clipora.session";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  createdAt: string;
  lastLoginAt: string;
}

export class AuthFlowError extends Error {
  constructor(
    message: string,
    public readonly code: "invalid" | "missing" | "exists" | "generic",
  ) {
    super(message);
  }
}

export function isAdmin(user: SessionUser | null | undefined) {
  return isAdminRole(user?.role);
}

export function homeFor(user: SessionUser | null | undefined) {
  return isAdmin(user) ? "/admin" : "/dashboard";
}

export function getStoredSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function setStoredSession(user: SessionUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  document.cookie = `clipora_demo_role=${user.role}; path=/; max-age=2592000; samesite=lax`;
}

export function clearStoredSession() {
  localStorage.removeItem(STORAGE_KEY);
  document.cookie = "clipora_demo_role=; path=/; max-age=0; samesite=lax";
}

export async function getAccessToken(): Promise<string | undefined> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }
  const session = getStoredSession();
  return session ? `demo:${session.email}` : undefined;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (!data.user?.email) return getStoredSession();
    const role = await resolveRemoteRole(data.user.email, data.user.app_metadata?.role ?? data.user.user_metadata?.role);
    const user: SessionUser = {
      id: data.user.id,
      email: data.user.email,
      name:
        (data.user.user_metadata?.full_name as string | undefined) ??
        (data.user.user_metadata?.name as string | undefined) ??
        displayName(data.user.email),
      role,
      createdAt: data.user.created_at,
      lastLoginAt: new Date().toISOString(),
    };
    setStoredSession(user);
    return user;
  }
  return getStoredSession();
}

async function resolveRemoteRole(email: string, claimed?: string): Promise<AppRole> {
  if (claimed === "admin" || claimed === "super_admin") return claimed;
  try {
    const token = await getAccessToken();
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (res.ok) {
      const body = (await res.json()) as { user?: { role?: AppRole } };
      if (body.user?.role) return body.user.role;
    }
  } catch {
    /* demo fallback */
  }
  return isAdminEmail(email) ? "admin" : "user";
}

export function isAdminEmail(email: string) {
  return email.trim().toLowerCase() === "admin@clipora.app";
}

const REGISTERED_DEMO = new Set(["admin@clipora.app", "user@clipora.app", "john@email.com"]);

export async function signInWithPassword(email: string, password: string): Promise<SessionUser> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw mapSupabaseError(error.message, "sign-in");
    const user = await getCurrentUser();
    if (!user) throw new AuthFlowError("We couldn't find an account with those details.", "missing");
    return user;
  }
  return demoSignIn(email, password);
}

export async function signUpWithPassword(email: string, password: string): Promise<{ user: SessionUser; confirmEmail: boolean }> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    if (error) throw mapSupabaseError(error.message, "sign-up");
    const user = demoUser(email, "user");
    return { user, confirmEmail: true };
  }
  if (REGISTERED_DEMO.has(email.trim().toLowerCase())) {
    throw new AuthFlowError("An account with this email already exists.", "exists");
  }
  const user = demoUser(email, "user");
  setStoredSession(user);
  return { user, confirmEmail: false };
}

export async function requestPasswordReset(email: string) {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new AuthFlowError("We couldn't find an account with those details.", "missing");
    return;
  }
  if (email.trim().toLowerCase() === "missing@clipora.app") {
    throw new AuthFlowError("We couldn't find an account with those details.", "missing");
  }
}

export async function updatePassword(password: string) {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new AuthFlowError(error.message, "generic");
  }
}

export async function signInWithGoogle(next: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new AuthFlowError("Google sign-in needs authentication to be configured.", "generic");
  }
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
}

export async function signOut() {
  const supabase = getSupabaseBrowserClient();
  if (supabase) await supabase.auth.signOut();
  clearStoredSession();
}

function demoSignIn(email: string, password: string): SessionUser {
  const normalized = email.trim().toLowerCase();
  if (normalized === "missing@clipora.app") {
    throw new AuthFlowError("We couldn't find an account with those details.", "missing");
  }
  if (password === "wrongpass") {
    throw new AuthFlowError("Email or password is incorrect.", "invalid");
  }
  if (password.length < 8) {
    throw new AuthFlowError("Email or password is incorrect.", "invalid");
  }
  const user = demoUser(normalized, isAdminEmail(normalized) ? "admin" : "user");
  setStoredSession(user);
  return user;
}

function demoUser(email: string, role: AppRole): SessionUser {
  const now = new Date().toISOString();
  return {
    id: isAdminEmail(email) ? "usr_1031" : `demo:${email.toLowerCase()}`,
    email: email.toLowerCase(),
    name: isAdminEmail(email) ? "Admin" : displayName(email),
    role,
    createdAt: "2025-08-02T10:00:00.000Z",
    lastLoginAt: now,
  };
}

function displayName(email: string) {
  const local = email.split("@")[0] ?? "User";
  return local.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function mapSupabaseError(message: string, mode: "sign-in" | "sign-up"): AuthFlowError {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return new AuthFlowError("Email or password is incorrect.", "invalid");
  }
  if (lower.includes("not found") || lower.includes("user not found")) {
    return new AuthFlowError("We couldn't find an account with those details.", "missing");
  }
  if (lower.includes("already registered") || lower.includes("already exists")) {
    return new AuthFlowError("An account with this email already exists.", "exists");
  }
  if (mode === "sign-up" && lower.includes("email")) {
    return new AuthFlowError("An account with this email already exists.", "exists");
  }
  return new AuthFlowError(message || "That didn't work. Please try again.", "generic");
}

export { hasSupabaseConfig };

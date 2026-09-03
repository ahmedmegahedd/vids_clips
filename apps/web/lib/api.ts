import type {
  BillingConfig,
  CheckoutSession,
  OutputFormat,
  OutputOptions,
  PlanDefinition,
  ProjectResponse,
  ResolveVideoResponse,
  SubscriptionRecord,
  InvoiceRecord,
  UsageResponse,
} from "@clipora/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || "Something went wrong. Please try again.") as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }
  return body as T;
}

export const api = {
  resolveVideo: async (url: string, token?: string) => {
    try {
      return await request<ResolveVideoResponse>("/videos/resolve", {
        method: "POST",
        body: JSON.stringify({ url }),
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch {
      const response = await fetch("/api/videos/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || "We couldn't find that video. Please try another link.");
      }
      return body as ResolveVideoResponse;
    }
  },
  createProject: (
    payload: {
      url: string;
      clipSeconds: number;
      format: OutputFormat;
      options: OutputOptions;
    },
    token?: string,
  ) =>
    request<ProjectResponse>("/projects", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
  getProject: (id: string, token?: string) =>
    request<ProjectResponse>(`/projects/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
  listProjects: (token?: string) =>
    request<{ projects: ProjectResponse["project"][] }>("/projects", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
  getUsage: (token?: string) =>
    request<UsageResponse>("/billing/usage", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
  billingConfig: () => request<BillingConfig>("/billing/config"),
  createCheckout: (
    payload: { planId: string; interval: string; name: string; email: string; phone: string },
    token?: string,
  ) =>
    request<{ session: CheckoutSession }>("/billing/checkout", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
  getCheckout: (id: string) =>
    request<{ session: CheckoutSession; plan: PlanDefinition }>(`/billing/checkout/${id}`),
  payCheckout: (id: string, method?: string) =>
    request<{
      session: CheckoutSession;
      checkoutUrl?: string;
      redirectUrl?: string;
      demo?: boolean;
      alreadyPaid?: boolean;
      amountLabel: string;
    }>(`/billing/checkout/${id}/pay`, {
      method: "POST",
      body: JSON.stringify({ method }),
    }),
  demoComplete: (id: string) =>
    request<{ session: CheckoutSession }>(`/billing/checkout/${id}/demo-complete`, { method: "POST" }),
  getSubscription: (token?: string) =>
    request<{ subscription: SubscriptionRecord; invoices: InvoiceRecord[] }>("/billing/subscription", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
  cancelSubscription: (token?: string) =>
    request<{ subscription: SubscriptionRecord }>("/billing/subscription/cancel", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
  reactivateSubscription: (token?: string) =>
    request<{ subscription: SubscriptionRecord }>("/billing/subscription/reactivate", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
  downloadAllUrl: (projectId: string) => `${API_URL}/projects/${projectId}/download-all`,
  clipFileUrl: (projectId: string, clipId: string, download = false) =>
    `${API_URL}/projects/${projectId}/clips/${clipId}/file${download ? "?download=1" : ""}`,
};

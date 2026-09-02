import { Injectable } from "@nestjs/common";
import {
  PLAN_DEFINITIONS,
  type BillingInterval,
  type CheckoutCurrency,
  type CheckoutSession,
  type InvoiceRecord,
  type PaymentStatus,
  type PlanId,
  type SubscriptionRecord,
} from "@clipora/shared";
import { randomUUID } from "node:crypto";
import { SupabaseService } from "../supabase/supabase.service";

@Injectable()
export class BillingStore {
  private readonly sessions = new Map<string, CheckoutSession>();
  private readonly subscriptions = new Map<string, SubscriptionRecord>();
  private readonly invoices = new Map<string, InvoiceRecord[]>();
  private readonly processedEvents = new Set<string>();

  constructor(private readonly supabase: SupabaseService) {}

  async createSession(input: {
    userId: string | null;
    email: string;
    name: string;
    phone: string;
    planId: PlanId;
    interval: BillingInterval;
    currency: CheckoutCurrency;
  }): Promise<CheckoutSession> {
    const plan = PLAN_DEFINITIONS[input.planId];
    const amount = input.interval === "yearly" ? plan.egpYearly : plan.egpMonthly;
    const now = new Date().toISOString();
    const session: CheckoutSession = {
      id: randomUUID(),
      userId: input.userId,
      email: input.email,
      name: input.name,
      phone: input.phone,
      planId: input.planId,
      interval: input.interval,
      currency: "EGP",
      amount,
      tax: 0,
      total: amount,
      status: "checkout",
      failureReason: null,
      paymobCheckoutUrl: null,
      createdAt: now,
      paidAt: null,
      nextBillingDate: nextBillingDate(input.interval),
    };
    this.sessions.set(session.id, session);
    if (this.supabase.client) {
      await this.supabase.client.from("checkout_sessions").insert(toSessionRow(session));
    }
    return session;
  }

  async getSession(id: string) {
    if (this.supabase.client) {
      const { data } = await this.supabase.client.from("checkout_sessions").select("*").eq("id", id).maybeSingle();
      return data ? fromSessionRow(data as Record<string, unknown>) : null;
    }
    return this.sessions.get(id) ?? null;
  }

  async updateSession(id: string, patch: Partial<CheckoutSession>) {
    const current = await this.getSession(id);
    if (!current) return null;
    const next = { ...current, ...patch };
    this.sessions.set(id, next);
    if (this.supabase.client) {
      await this.supabase.client.from("checkout_sessions").update(toSessionRow(next)).eq("id", id);
    }
    return next;
  }

  async getSubscription(userId: string): Promise<SubscriptionRecord> {
    if (this.supabase.client) {
      const { data } = await this.supabase.client.from("subscriptions").select("*").eq("user_id", userId).maybeSingle();
      if (data) return fromSubRow(data as Record<string, unknown>);
    }
    return (
      this.subscriptions.get(userId) ?? {
        userId,
        planId: "free",
        status: "free",
        interval: "monthly",
        currency: "EGP",
        amount: 0,
        renewsAt: null,
        cancelAt: null,
        paymentMethod: null,
        videosUsed: 0,
        videosLimit: PLAN_DEFINITIONS.free.videosPerMonth,
      }
    );
  }

  async activatePaidPlan(session: CheckoutSession, paymentMethod: string | null) {
    const userId = session.userId ?? `guest:${session.email}`;
    const plan = PLAN_DEFINITIONS[session.planId];
    const subscription: SubscriptionRecord = {
      userId,
      planId: session.planId,
      status: "active",
      interval: session.interval,
      currency: session.currency,
      amount: session.total,
      renewsAt: nextBillingDate(session.interval),
      cancelAt: null,
      paymentMethod,
      videosUsed: 0,
      videosLimit: plan.videosPerMonth,
    };
    this.subscriptions.set(userId, subscription);
    const invoice: InvoiceRecord = {
      id: randomUUID(),
      date: new Date().toISOString(),
      planId: session.planId,
      amount: session.total,
      currency: session.currency,
      status: "paid",
    };
    const list = this.invoices.get(userId) ?? [];
    list.unshift(invoice);
    this.invoices.set(userId, list);

    if (this.supabase.client) {
      await this.supabase.client.from("subscriptions").upsert(toSubRow(subscription));
      await this.supabase.client.from("invoices").insert({
        id: invoice.id,
        user_id: userId,
        plan_id: invoice.planId,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        created_at: invoice.date,
      });
      await this.supabase.client
        .from("profiles")
        .update({ plan: session.planId, updated_at: new Date().toISOString() })
        .eq("id", userId);
    }
    return subscription;
  }

  async cancel(userId: string) {
    const sub = await this.getSubscription(userId);
    const cancelAt = sub.renewsAt ?? nextBillingDate(sub.interval ?? "monthly");
    const next = { ...sub, status: "cancelling" as const, cancelAt };
    this.subscriptions.set(userId, next);
    if (this.supabase.client) {
      await this.supabase.client
        .from("subscriptions")
        .update({ status: "cancelling", cancel_at: cancelAt })
        .eq("user_id", userId);
    }
    return next;
  }

  async reactivate(userId: string) {
    const sub = await this.getSubscription(userId);
    const next = { ...sub, status: "active" as const, cancelAt: null };
    this.subscriptions.set(userId, next);
    if (this.supabase.client) {
      await this.supabase.client
        .from("subscriptions")
        .update({ status: "active", cancel_at: null })
        .eq("user_id", userId);
    }
    return next;
  }

  async listInvoices(userId: string) {
    if (this.supabase.client) {
      const { data } = await this.supabase.client
        .from("invoices")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      return (data ?? []).map((row) => fromInvoiceRow(row as Record<string, unknown>));
    }
    return this.invoices.get(userId) ?? [];
  }

  hasEvent(id: string) {
    return this.processedEvents.has(id);
  }

  markEvent(id: string) {
    this.processedEvents.add(id);
  }
}

function nextBillingDate(interval: BillingInterval) {
  const date = new Date();
  if (interval === "yearly") date.setFullYear(date.getFullYear() + 1);
  else date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

function toSessionRow(session: CheckoutSession) {
  return {
    id: session.id,
    user_id: session.userId,
    email: session.email,
    name: session.name,
    phone: session.phone,
    plan_id: session.planId,
    interval: session.interval,
    currency: session.currency,
    amount: session.amount,
    tax: session.tax,
    total: session.total,
    status: session.status,
    failure_reason: session.failureReason,
    paymob_checkout_url: session.paymobCheckoutUrl,
    created_at: session.createdAt,
    paid_at: session.paidAt,
    next_billing_date: session.nextBillingDate,
  };
}

function fromSessionRow(row: Record<string, unknown>): CheckoutSession {
  return {
    id: String(row.id),
    userId: (row.user_id as string | null) ?? null,
    email: String(row.email),
    name: String(row.name),
    phone: String(row.phone ?? ""),
    planId: row.plan_id as PlanId,
    interval: row.interval as BillingInterval,
    currency: (row.currency as CheckoutCurrency) ?? "EGP",
    amount: Number(row.amount),
    tax: Number(row.tax ?? 0),
    total: Number(row.total),
    status: row.status as PaymentStatus,
    failureReason: (row.failure_reason as string | null) ?? null,
    paymobCheckoutUrl: (row.paymob_checkout_url as string | null) ?? null,
    createdAt: String(row.created_at),
    paidAt: (row.paid_at as string | null) ?? null,
    nextBillingDate: (row.next_billing_date as string | null) ?? null,
  };
}

function toSubRow(sub: SubscriptionRecord) {
  return {
    user_id: sub.userId,
    plan_id: sub.planId,
    status: sub.status,
    interval: sub.interval,
    currency: sub.currency,
    amount: sub.amount,
    renews_at: sub.renewsAt,
    cancel_at: sub.cancelAt,
    payment_method: sub.paymentMethod,
    videos_limit: sub.videosLimit,
  };
}

function fromSubRow(row: Record<string, unknown>): SubscriptionRecord {
  const planId = row.plan_id as PlanId;
  return {
    userId: String(row.user_id),
    planId,
    status: row.status as SubscriptionRecord["status"],
    interval: (row.interval as BillingInterval) ?? "monthly",
    currency: (row.currency as CheckoutCurrency) ?? "EGP",
    amount: Number(row.amount ?? 0),
    renewsAt: (row.renews_at as string | null) ?? null,
    cancelAt: (row.cancel_at as string | null) ?? null,
    paymentMethod: (row.payment_method as string | null) ?? null,
    videosUsed: 0,
    videosLimit: PLAN_DEFINITIONS[planId]?.videosPerMonth ?? PLAN_DEFINITIONS.free.videosPerMonth,
  };
}

function fromInvoiceRow(row: Record<string, unknown>): InvoiceRecord {
  return {
    id: String(row.id),
    date: String(row.created_at ?? row.date),
    planId: row.plan_id as PlanId,
    amount: Number(row.amount),
    currency: (row.currency as CheckoutCurrency) ?? "EGP",
    status: row.status as InvoiceRecord["status"],
  };
}

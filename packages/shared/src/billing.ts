import type { BillingInterval, CheckoutCurrency, PlanId } from "./plans";

export type PaymentStatus =
  | "draft"
  | "checkout"
  | "redirecting"
  | "processing"
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "expired"
  | "already_paid";

export type SubscriptionStatus = "free" | "active" | "cancelling" | "past_due" | "expired";

export interface PaymentMethodOption {
  id: string;
  name: string;
  description: string;
  available: boolean;
}

export interface CheckoutSession {
  id: string;
  userId: string | null;
  email: string;
  name: string;
  phone: string;
  planId: PlanId;
  interval: BillingInterval;
  currency: CheckoutCurrency;
  amount: number;
  tax: number;
  total: number;
  status: PaymentStatus;
  failureReason: string | null;
  paymobCheckoutUrl: string | null;
  createdAt: string;
  paidAt: string | null;
  nextBillingDate: string | null;
}

export interface SubscriptionRecord {
  userId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  interval: BillingInterval;
  currency: CheckoutCurrency;
  amount: number;
  renewsAt: string | null;
  cancelAt: string | null;
  paymentMethod: string | null;
  videosUsed: number;
  videosLimit: number;
}

export interface InvoiceRecord {
  id: string;
  date: string;
  planId: PlanId;
  amount: number;
  currency: CheckoutCurrency;
  status: "paid" | "pending" | "failed" | "refunded";
}

export interface BillingConfig {
  currency: CheckoutCurrency;
  demo: boolean;
  methods: PaymentMethodOption[];
}

export interface BillingUsageResponse {
  planId: PlanId;
  planName: string;
  status: SubscriptionStatus;
  interval: BillingInterval | null;
  currency: CheckoutCurrency;
  amount: number;
  renewsAt: string | null;
  cancelAt: string | null;
  paymentMethod: string | null;
  videosUsed: number;
  videosLimit: number;
  minutesUsed: number;
  minutesLimit: number;
  resetsAt: string;
  approachingLimit: boolean;
}

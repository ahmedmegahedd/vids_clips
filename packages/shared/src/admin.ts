import type { BillingInterval, CheckoutCurrency, PlanId } from "./plans";

export const APP_ROLES = ["user", "admin", "super_admin", "support", "finance", "moderator"] as const;
export type AppRole = (typeof APP_ROLES)[number];
export const ACTIVE_APP_ROLES = ["user", "admin"] as const;

export function isAdminRole(role: AppRole | string | null | undefined): boolean {
  return role === "admin" || role === "super_admin";
}

export type UserAccountStatus = "active" | "suspended" | "blocked" | "pending" | "cancelled";
export type AdminPaymentStatus = "paid" | "pending" | "failed" | "refunded" | "cancelled";
export type AdminSubscriptionStatus = "active" | "cancelling" | "past_due" | "expired" | "cancelled" | "trialing";
export type AdminProjectStatus = "processing" | "completed" | "failed" | "cancelled" | "queued";
export type PlanLifecycle = "active" | "inactive";
export type SystemHealth = "operational" | "degraded" | "unavailable";
export type AlertSeverity = "critical" | "warning" | "info";
export type NotificationCategory = "payments" | "users" | "system" | "security";
export type ActivitySource = "user" | "admin" | "system" | "billing" | "processing";
export type DatePreset =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "90d"
  | "12m"
  | "this_month"
  | "last_month"
  | "this_year"
  | "custom";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  planId: string;
  status: UserAccountStatus;
  videosUsed: number;
  videosLimit: number;
  clipsCreated: number;
  totalVideos: number;
  totalClips: number;
  totalPayments: number;
  storageGb: number;
  subscriptionStatus: AdminSubscriptionStatus | "free";
  billingInterval: BillingInterval;
  price: number;
  currency: CheckoutCurrency;
  renewsAt: string | null;
  startedAt: string | null;
  endsAt: string | null;
  autoRenewal: boolean;
  joinedAt: string;
  lastActiveAt: string;
  paymentStatus: AdminPaymentStatus | "none";
  paymentMethod: string | null;
}

export interface AdminPlanFeature {
  id: string;
  label: string;
  included: boolean;
}

export interface AdminPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  videosPerMonth: number;
  clipLimit: number;
  maxProjects: number;
  priority: number;
  visibility: "public" | "hidden";
  status: PlanLifecycle;
  subscribers: number;
  revenue: number;
  features: AdminPlanFeature[];
  builtIn: boolean;
}

export interface AdminPayment {
  id: string;
  transactionId: string;
  userId: string;
  userName: string;
  email: string;
  planId: string;
  planName: string;
  amount: number;
  currency: CheckoutCurrency;
  method: string;
  status: AdminPaymentStatus;
  date: string;
  completedAt: string | null;
  provider: string;
  paymentReference: string | null;
  invoiceId: string;
}

export interface AdminSubscription {
  id: string;
  userId: string;
  userName: string;
  email: string;
  planId: string;
  planName: string;
  status: AdminSubscriptionStatus;
  price: number;
  currency: CheckoutCurrency;
  billingCycle: BillingInterval;
  startDate: string;
  nextBillingDate: string | null;
  endDate: string | null;
  autoRenewal: boolean;
  paymentFailed: boolean;
}

export interface AdminProject {
  id: string;
  name: string;
  userId: string;
  userName: string;
  sourceVideo: string;
  thumbnailUrl: string;
  durationSeconds: number;
  clipSeconds: number;
  format: string;
  clips: number;
  status: AdminProjectStatus;
  createdAt: string;
  completedAt: string | null;
  clipThumbnails: string[];
}

export interface AdminActivity {
  id: string;
  event: string;
  description: string;
  userId: string | null;
  userName: string | null;
  time: string;
  source: ActivitySource;
  status: "success" | "warning" | "error" | "info";
  href: string;
}

export interface AdminAuditEvent {
  id: string;
  action: string;
  adminName: string;
  time: string;
  before: string | null;
  after: string | null;
  target: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  time: string;
  read: boolean;
  href: string;
}

export interface AdminAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  time: string;
  actionLabel: string;
  href: string;
}

export interface SystemServiceStatus {
  id: string;
  name: string;
  status: SystemHealth;
  detail: string;
}

export interface PlatformSettings {
  websiteName: string;
  supportEmail: string;
  defaultCurrency: CheckoutCurrency;
  defaultClipLength: number;
  defaultOutputFormat: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  maxUploadGb: number;
  maxProcessingMinutes: number;
}

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  createdAt: string;
  lastLoginAt: string;
  googleConnected: boolean;
  twoFactorEnabled: boolean;
  sessions: { id: string; device: string; location: string; current: boolean; lastActive: string }[];
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface PlatformMetrics {
  periodLabel: string;
  totalUsers: number;
  totalUsersChange: number;
  activeUsers: number;
  activeUsersChange: number;
  payingCustomers: number;
  payingCustomersChange: number;
  monthlyRevenue: number;
  monthlyRevenueChange: number;
  videosProcessed: number;
  videosProcessedChange: number;
  clipsCreated: number;
  clipsCreatedChange: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  refundedPayments: number;
  totalPaymentCount: number;
}

export interface PlanBreakdown {
  planId: string;
  name: string;
  users: number;
  percent: number;
  revenue: number;
}

export interface FunnelStep {
  id: string;
  label: string;
  value: number;
}

export interface RetentionPoint {
  label: string;
  newUsers: number;
  returningUsers: number;
  activeUsers: number;
  churnedUsers: number;
}

export interface UsageHistoryPoint {
  label: string;
  videos: number;
  clips: number;
}

export interface AnalyticsSnapshot {
  users: {
    total: number;
    newRegistrations: number;
    active: number;
    returning: number;
    growth: number;
  };
  revenue: {
    total: number;
    recurring: number;
    arpu: number;
    successRate: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    refunds: number;
    failedPayments: number;
  };
  subscriptions: {
    active: number;
    created: number;
    cancellations: number;
    expired: number;
    upgrades: number;
    downgrades: number;
  };
  product: {
    videosProcessed: number;
    clipsCreated: number;
    avgClipsPerUser: number;
    processingVolume: number;
  };
  planPerformance: PlanBreakdown[];
  funnel: FunnelStep[];
  retention: RetentionPoint[];
}

export interface AdminSnapshot {
  metrics: PlatformMetrics;
  revenueSeries: Record<"7d" | "30d" | "90d" | "12m", SeriesPoint[]>;
  growthSeries: Record<"daily" | "weekly" | "monthly", { label: string; newUsers: number; activeUsers: number; payingUsers: number }[]>;
  planBreakdown: PlanBreakdown[];
  users: AdminUser[];
  plans: AdminPlan[];
  payments: AdminPayment[];
  subscriptions: AdminSubscription[];
  projects: AdminProject[];
  activity: AdminActivity[];
  audit: AdminAuditEvent[];
  notifications: AdminNotification[];
  alerts: AdminAlert[];
  services: SystemServiceStatus[];
  settings: PlatformSettings;
  analytics: AnalyticsSnapshot;
  usageHistory: UsageHistoryPoint[];
}

export function yearlyDiscountPercent(monthly: number, yearly: number): number {
  if (!monthly || !yearly) return 0;
  return Math.max(0, Math.round((1 - yearly / (monthly * 12)) * 100));
}

export function roleLabel(role: AppRole): string {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "admin":
      return "Admin";
    case "support":
      return "Support";
    case "finance":
      return "Finance";
    case "moderator":
      return "Moderator";
    default:
      return "User";
  }
}

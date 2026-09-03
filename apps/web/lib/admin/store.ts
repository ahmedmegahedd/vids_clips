"use client";

import { createAdminSnapshot, yearlyDiscountPercent, type AdminPlan, type AdminSnapshot, type AdminUser, type PlatformSettings, type UserAccountStatus } from "@clipora/shared";
import { create } from "zustand";

type ToastKind = "success" | "error";

export interface ToastItem {
  id: string;
  kind: ToastKind;
  title: string;
  body?: string;
}

interface AdminState extends AdminSnapshot {
  toasts: ToastItem[];
  searchQuery: string;
  comparePrevious: boolean;
  pushToast: (kind: ToastKind, title: string, body?: string) => void;
  dismissToast: (id: string) => void;
  setSearchQuery: (q: string) => void;
  setComparePrevious: (value: boolean) => void;
  addUser: (input: { name: string; email: string; planId: string; role?: AdminUser["role"] }) => AdminUser;
  patchUser: (id: string, patch: Partial<AdminUser>) => void;
  setUserStatus: (id: string, status: UserAccountStatus) => void;
  changeUserPlan: (id: string, planId: string) => void;
  extendSubscription: (id: string, days?: number) => void;
  cancelSubscription: (id: string) => void;
  reactivateSubscription: (id: string) => void;
  deleteUser: (id: string) => void;
  createPlan: (plan: Omit<AdminPlan, "id" | "subscribers" | "revenue" | "builtIn">) => AdminPlan;
  patchPlan: (id: string, patch: Partial<AdminPlan>) => void;
  duplicatePlan: (id: string) => void;
  disablePlan: (id: string) => void;
  updateSettings: (patch: Partial<PlatformSettings>) => void;
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;
}

let toastCount = 0;

function uid(prefix: string) {
  toastCount += 1;
  return `${prefix}_${toastCount}_${Math.random().toString(16).slice(2, 6)}`;
}

const seed = createAdminSnapshot();

export const useAdminStore = create<AdminState>((set, get) => ({
  ...seed,
  toasts: [],
  searchQuery: "",
  comparePrevious: true,
  pushToast: (kind, title, body) => {
    const id = uid("toast");
    set((state) => ({ toasts: [...state.toasts, { id, kind, title, body }] }));
    window.setTimeout(() => get().dismissToast(id), 4200);
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setComparePrevious: (comparePrevious) => set({ comparePrevious }),
  addUser: (input) => {
    const plan = get().plans.find((item) => item.id === input.planId) ?? get().plans[0];
    const now = new Date().toISOString();
    const user: AdminUser = {
      id: uid("usr"),
      name: input.name,
      email: input.email,
      role: input.role ?? "user",
      planId: plan.id,
      status: "active",
      videosUsed: 0,
      videosLimit: plan.videosPerMonth,
      clipsCreated: 0,
      totalVideos: 0,
      totalClips: 0,
      totalPayments: 0,
      storageGb: 0,
      subscriptionStatus: plan.id === "free" ? "free" : "active",
      billingInterval: "monthly",
      price: plan.monthlyPrice,
      currency: "EGP",
      renewsAt: plan.id === "free" ? null : shift(now, 30),
      startedAt: now,
      endsAt: null,
      autoRenewal: plan.id !== "free",
      joinedAt: now,
      lastActiveAt: now,
      paymentStatus: "none",
      paymentMethod: null,
    };
    set((state) => ({
      users: [user, ...state.users],
      metrics: { ...state.metrics, totalUsers: state.metrics.totalUsers + 1 },
    }));
    get().pushToast("success", "User added successfully");
    return user;
  },
  patchUser: (id, patch) =>
    set((state) => ({
      users: state.users.map((user) => (user.id === id ? { ...user, ...patch } : user)),
    })),
  setUserStatus: (id, status) => {
    get().patchUser(id, { status });
    const labels: Record<UserAccountStatus, string> = {
      active: "Account reactivated successfully.",
      suspended: "Account suspended successfully.",
      blocked: "Account blocked successfully.",
      pending: "Account marked as pending.",
      cancelled: "Account cancelled successfully.",
    };
    get().pushToast("success", labels[status]);
  },
  changeUserPlan: (id, planId) => {
    const plan = get().plans.find((item) => item.id === planId);
    if (!plan) return;
    set((state) => ({
      users: state.users.map((user) =>
        user.id === id
          ? {
              ...user,
              planId: plan.id,
              videosLimit: plan.videosPerMonth,
              price: plan.monthlyPrice,
              subscriptionStatus: plan.id === "free" ? "free" : "active",
            }
          : user,
      ),
      subscriptions: state.subscriptions.map((sub) =>
        sub.userId === id ? { ...sub, planId: plan.id, planName: plan.name, price: plan.monthlyPrice } : sub,
      ),
    }));
    get().pushToast("success", "Subscription updated");
  },
  extendSubscription: (id, days = 30) => {
    const user = get().users.find((item) => item.id === id);
    if (!user?.renewsAt) return;
    const next = shift(user.renewsAt, days);
    get().patchUser(id, { renewsAt: next, endsAt: null, subscriptionStatus: "active", autoRenewal: true });
    set((state) => ({
      subscriptions: state.subscriptions.map((sub) =>
        sub.userId === id ? { ...sub, nextBillingDate: next, endDate: null, status: "active", autoRenewal: true } : sub,
      ),
    }));
    get().pushToast("success", "Subscription updated");
  },
  cancelSubscription: (id) => {
    get().patchUser(id, { subscriptionStatus: "cancelling", autoRenewal: false, endsAt: get().users.find((u) => u.id === id)?.renewsAt ?? null });
    set((state) => ({
      subscriptions: state.subscriptions.map((sub) =>
        sub.userId === id ? { ...sub, status: "cancelling", autoRenewal: false, endDate: sub.nextBillingDate } : sub,
      ),
    }));
    get().pushToast("success", "Subscription updated");
  },
  reactivateSubscription: (id) => {
    get().patchUser(id, { subscriptionStatus: "active", autoRenewal: true, status: "active", endsAt: null });
    set((state) => ({
      subscriptions: state.subscriptions.map((sub) =>
        sub.userId === id ? { ...sub, status: "active", autoRenewal: true, endDate: null } : sub,
      ),
    }));
    get().pushToast("success", "Subscription updated");
  },
  deleteUser: (id) => {
    set((state) => ({ users: state.users.filter((user) => user.id !== id) }));
    get().pushToast("success", "User deleted");
  },
  createPlan: (input) => {
    const plan: AdminPlan = {
      ...input,
      id: slug(input.name),
      subscribers: 0,
      revenue: 0,
      builtIn: false,
    };
    set((state) => ({ plans: [...state.plans, plan] }));
    get().pushToast("success", "Plan created successfully");
    return plan;
  },
  patchPlan: (id, patch) => {
    set((state) => ({
      plans: state.plans.map((plan) => (plan.id === id ? { ...plan, ...patch } : plan)),
    }));
    get().pushToast("success", "Plan updated successfully");
  },
  duplicatePlan: (id) => {
    const plan = get().plans.find((item) => item.id === id);
    if (!plan) return;
    const copy: AdminPlan = {
      ...plan,
      id: `${plan.id}-copy-${uid("p")}`,
      name: `${plan.name} copy`,
      subscribers: 0,
      revenue: 0,
      status: "inactive",
      builtIn: false,
    };
    set((state) => ({ plans: [...state.plans, copy] }));
    get().pushToast("success", "Plan duplicated");
  },
  disablePlan: (id) => {
    get().patchPlan(id, { status: "inactive" });
  },
  updateSettings: (patch) => {
    set((state) => ({ settings: { ...state.settings, ...patch } }));
    get().pushToast("success", "Settings saved");
  },
  markAllNotificationsRead: () => set((state) => ({ notifications: state.notifications.map((item) => ({ ...item, read: true })) })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((item) => (item.id === id ? { ...item, read: true } : item)),
    })),
}));

export function searchAdmin(q: string) {
  const query = q.trim().toLowerCase();
  const { users, payments, projects, subscriptions } = useAdminStore.getState();
  if (!query) return { users: [], payments: [], projects: [], subscriptions: [] };
  return {
    users: users.filter((u) => [u.name, u.email, u.id].some((v) => v.toLowerCase().includes(query))).slice(0, 5),
    payments: payments.filter((p) => [p.transactionId, p.id, p.email, p.userName].some((v) => v.toLowerCase().includes(query))).slice(0, 5),
    projects: projects.filter((p) => [p.name, p.sourceVideo, p.userName, p.id].some((v) => v.toLowerCase().includes(query))).slice(0, 5),
    subscriptions: subscriptions.filter((s) => [s.userName, s.email, s.planName, s.id].some((v) => v.toLowerCase().includes(query))).slice(0, 5),
  };
}

export function savingsCopy(monthly: number, yearly: number) {
  const percent = yearlyDiscountPercent(monthly, yearly);
  return percent > 0 ? `Customer saves ${percent}% annually` : "No yearly discount";
}

function shift(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 32) || uid("plan");
}

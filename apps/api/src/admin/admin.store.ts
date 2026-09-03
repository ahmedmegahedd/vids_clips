import { Injectable } from "@nestjs/common";
import {
  createAdminSnapshot,
  type AdminPlan,
  type AdminSnapshot,
  type AdminUser,
  type PlatformSettings,
  type UserAccountStatus,
} from "@clipora/shared";
import { randomUUID } from "node:crypto";

@Injectable()
export class AdminStore {
  private snapshot: AdminSnapshot = createAdminSnapshot();

  get() {
    return this.snapshot;
  }

  overview() {
    const s = this.snapshot;
    return {
      metrics: s.metrics,
      revenueSeries: s.revenueSeries,
      growthSeries: s.growthSeries,
      planBreakdown: s.planBreakdown,
      activity: s.activity.slice(0, 12),
      alerts: s.alerts,
      notifications: s.notifications.filter((n) => !n.read).slice(0, 8),
      recentUsers: [...s.users].sort((a, b) => b.joinedAt.localeCompare(a.joinedAt)).slice(0, 6),
      recentPayments: [...s.payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
      expiring: s.subscriptions.filter((sub) => isExpiring(sub.nextBillingDate, 14) && sub.status === "active").slice(0, 6),
      usageAlerts: s.users.filter((user) => user.videosLimit > 0 && user.videosUsed / user.videosLimit >= 0.9),
      services: s.services,
    };
  }

  search(q: string) {
    const query = q.trim().toLowerCase();
    if (!query) return { users: [], payments: [], projects: [], subscriptions: [] };
    const users = this.snapshot.users
      .filter((u) => [u.name, u.email, u.id].some((v) => v.toLowerCase().includes(query)))
      .slice(0, 6);
    const payments = this.snapshot.payments
      .filter((p) => [p.transactionId, p.id, p.email, p.userName].some((v) => v.toLowerCase().includes(query)))
      .slice(0, 6);
    const projects = this.snapshot.projects
      .filter((p) => [p.name, p.sourceVideo, p.userName, p.id].some((v) => v.toLowerCase().includes(query)))
      .slice(0, 6);
    const subscriptions = this.snapshot.subscriptions
      .filter((s) => [s.userName, s.email, s.planName, s.id].some((v) => v.toLowerCase().includes(query)))
      .slice(0, 6);
    return { users, payments, projects, subscriptions };
  }

  getUser(id: string) {
    const user = this.snapshot.users.find((item) => item.id === id);
    if (!user) return null;
    return {
      user,
      payments: this.snapshot.payments.filter((item) => item.userId === id),
      projects: this.snapshot.projects.filter((item) => item.userId === id),
      subscription: this.snapshot.subscriptions.find((item) => item.userId === id) ?? null,
      usageHistory: this.snapshot.usageHistory,
    };
  }

  addUser(input: { name: string; email: string; planId: string; role?: AdminUser["role"] }) {
    const plan = this.snapshot.plans.find((item) => item.id === input.planId) ?? this.snapshot.plans[0];
    const now = new Date().toISOString();
    const user: AdminUser = {
      id: `usr_${randomUUID().slice(0, 8)}`,
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
      renewsAt: plan.id === "free" ? null : shiftMonths(now, 1),
      startedAt: now,
      endsAt: null,
      autoRenewal: plan.id !== "free",
      joinedAt: now,
      lastActiveAt: now,
      paymentStatus: "none",
      paymentMethod: null,
    };
    this.snapshot.users.unshift(user);
    this.snapshot.metrics.totalUsers += 1;
    this.log("User created", `${user.name} was added`, user.id, user.name, "/admin/users/" + user.id, "admin");
    return user;
  }

  patchUser(id: string, patch: Partial<AdminUser>) {
    const user = this.snapshot.users.find((item) => item.id === id);
    if (!user) return null;
    Object.assign(user, patch);
    return user;
  }

  setUserStatus(id: string, status: UserAccountStatus) {
    const user = this.patchUser(id, { status });
    if (user) {
      const verb = status === "suspended" ? "suspended" : status === "active" ? "reactivated" : status;
      this.log("Account updated", `${user.name} was ${verb}`, user.id, user.name, `/admin/users/${id}`, "admin");
    }
    return user;
  }

  changePlan(id: string, planId: string) {
    const plan = this.snapshot.plans.find((item) => item.id === planId);
    const user = this.snapshot.users.find((item) => item.id === id);
    if (!plan || !user) return null;
    const before = user.planId;
    user.planId = plan.id;
    user.videosLimit = plan.videosPerMonth;
    user.price = plan.monthlyPrice;
    user.subscriptionStatus = plan.id === "free" ? "free" : "active";
    const sub = this.snapshot.subscriptions.find((item) => item.userId === id);
    if (sub) {
      sub.planId = plan.id;
      sub.planName = plan.name;
      sub.price = plan.monthlyPrice;
    }
    this.snapshot.audit.unshift({
      id: `aud_${randomUUID().slice(0, 6)}`,
      action: `Admin changed ${user.name}'s plan`,
      adminName: "Admin",
      time: new Date().toISOString(),
      before,
      after: plan.name,
      target: user.name,
    });
    return user;
  }

  deleteUser(id: string) {
    const user = this.snapshot.users.find((item) => item.id === id);
    this.snapshot.users = this.snapshot.users.filter((item) => item.id !== id);
    return user ?? null;
  }

  createPlan(input: Omit<AdminPlan, "id" | "subscribers" | "revenue" | "builtIn">) {
    const plan: AdminPlan = {
      ...input,
      id: slug(input.name),
      subscribers: 0,
      revenue: 0,
      builtIn: false,
    };
    this.snapshot.plans.push(plan);
    this.log("Plan created", `${plan.name} is now available`, null, "Admin", "/admin/plans", "admin");
    return plan;
  }

  patchPlan(id: string, patch: Partial<AdminPlan>) {
    const plan = this.snapshot.plans.find((item) => item.id === id);
    if (!plan) return null;
    const before = `EGP ${plan.monthlyPrice.toLocaleString("en-EG")}`;
    Object.assign(plan, patch);
    if (patch.monthlyPrice != null) {
      this.snapshot.audit.unshift({
        id: `aud_${randomUUID().slice(0, 6)}`,
        action: `Admin changed ${plan.name} plan price`,
        adminName: "Admin",
        time: new Date().toISOString(),
        before,
        after: `EGP ${plan.monthlyPrice.toLocaleString("en-EG")}`,
        target: `${plan.name} plan`,
      });
    }
    return plan;
  }

  duplicatePlan(id: string) {
    const plan = this.snapshot.plans.find((item) => item.id === id);
    if (!plan) return null;
    const copy: AdminPlan = {
      ...plan,
      id: `${plan.id}-copy-${randomUUID().slice(0, 4)}`,
      name: `${plan.name} copy`,
      subscribers: 0,
      revenue: 0,
      status: "inactive",
      builtIn: false,
      features: plan.features.map((f) => ({ ...f, id: randomUUID().slice(0, 8) })),
    };
    this.snapshot.plans.push(copy);
    return copy;
  }

  updateSettings(patch: Partial<PlatformSettings>) {
    this.snapshot.settings = { ...this.snapshot.settings, ...patch };
    return this.snapshot.settings;
  }

  markNotificationsRead() {
    this.snapshot.notifications = this.snapshot.notifications.map((item) => ({ ...item, read: true }));
    return this.snapshot.notifications;
  }

  private log(
    event: string,
    description: string,
    userId: string | null,
    userName: string | null,
    href: string,
    source: "admin" | "system",
  ) {
    this.snapshot.activity.unshift({
      id: `act_${randomUUID().slice(0, 6)}`,
      event,
      description,
      userId,
      userName,
      time: new Date().toISOString(),
      source,
      status: "info",
      href,
    });
  }
}

function isExpiring(date: string | null, days: number) {
  if (!date) return false;
  const diff = new Date(date).getTime() - Date.now();
  return diff > 0 && diff <= days * 86400000;
}

function shiftMonths(iso: string, months: number) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

function slug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 32) || `plan-${randomUUID().slice(0, 6)}`
  );
}

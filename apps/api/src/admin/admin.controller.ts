import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { AdminPlan, AdminUser, PlatformSettings } from "@clipora/shared";
import { AuthService } from "../auth/auth.service";
import { AdminGuard } from "./admin.guard";
import { AdminStore } from "./admin.store";
import { ChangePlanDto, CreateAdminUserDto, CreatePlanDto, PatchPlanDto, PatchSettingsDto, PatchUserDto } from "./dto";

@Controller("admin")
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly store: AdminStore,
    private readonly auth: AuthService,
  ) {}

  @Get("overview")
  overview() {
    return this.store.overview();
  }

  @Get("search")
  search(@Query("q") q = "") {
    return this.store.search(q);
  }

  @Get("users")
  users() {
    return { users: this.store.get().users, total: this.store.get().metrics.totalUsers };
  }

  @Get("users/:id")
  user(@Param("id") id: string) {
    const detail = this.store.getUser(id);
    if (!detail) throw new NotFoundException("We couldn't find that user.");
    return detail;
  }

  @Post("users")
  createUser(@Body() body: CreateAdminUserDto) {
    return { user: this.store.addUser(body) };
  }

  @Patch("users/:id")
  patchUser(@Param("id") id: string, @Body() body: PatchUserDto) {
    const user = this.store.patchUser(id, body as Partial<AdminUser>);
    if (!user) throw new NotFoundException("We couldn't find that user.");
    return { user };
  }

  @Post("users/:id/suspend")
  suspend(@Param("id") id: string) {
    const user = this.store.setUserStatus(id, "suspended");
    if (!user) throw new NotFoundException("We couldn't find that user.");
    return { user, message: "Account suspended successfully." };
  }

  @Post("users/:id/reactivate")
  reactivate(@Param("id") id: string) {
    const user = this.store.setUserStatus(id, "active");
    if (!user) throw new NotFoundException("We couldn't find that user.");
    return { user, message: "Account reactivated successfully." };
  }

  @Post("users/:id/plan")
  changePlan(@Param("id") id: string, @Body() body: ChangePlanDto) {
    const user = this.store.changePlan(id, body.planId);
    if (!user) throw new NotFoundException("We couldn't find that user.");
    return { user, message: "Subscription updated." };
  }

  @Delete("users/:id")
  removeUser(@Param("id") id: string) {
    const user = this.store.deleteUser(id);
    if (!user) throw new NotFoundException("We couldn't find that user.");
    return { ok: true };
  }

  @Get("plans")
  plans() {
    return { plans: this.store.get().plans };
  }

  @Post("plans")
  createPlan(@Body() body: CreatePlanDto) {
    return { plan: this.store.createPlan(body) };
  }

  @Patch("plans/:id")
  patchPlan(@Param("id") id: string, @Body() body: PatchPlanDto) {
    const plan = this.store.patchPlan(id, body as Partial<AdminPlan>);
    if (!plan) throw new NotFoundException("We couldn't find that plan.");
    return { plan, message: "Plan updated successfully." };
  }

  @Post("plans/:id/duplicate")
  duplicate(@Param("id") id: string) {
    const plan = this.store.duplicatePlan(id);
    if (!plan) throw new NotFoundException("We couldn't find that plan.");
    return { plan };
  }

  @Post("plans/:id/disable")
  disable(@Param("id") id: string) {
    const plan = this.store.patchPlan(id, { status: "inactive" });
    if (!plan) throw new NotFoundException("We couldn't find that plan.");
    return { plan };
  }

  @Get("payments")
  payments() {
    return { payments: this.store.get().payments, metrics: this.store.get().metrics };
  }

  @Get("payments/:id")
  payment(@Param("id") id: string) {
    const payment = this.store.get().payments.find((item) => item.id === id);
    if (!payment) throw new NotFoundException("We couldn't find that payment.");
    return { payment };
  }

  @Get("subscriptions")
  subscriptions() {
    return { subscriptions: this.store.get().subscriptions };
  }

  @Get("projects")
  projects() {
    return { projects: this.store.get().projects };
  }

  @Get("projects/:id")
  project(@Param("id") id: string) {
    const project = this.store.get().projects.find((item) => item.id === id);
    if (!project) throw new NotFoundException("We couldn't find that project.");
    return { project };
  }

  @Get("activity")
  activity() {
    return { activity: this.store.get().activity, audit: this.store.get().audit };
  }

  @Get("notifications")
  notifications() {
    return { notifications: this.store.get().notifications };
  }

  @Post("notifications/read-all")
  readAll() {
    return { notifications: this.store.markNotificationsRead() };
  }

  @Get("status")
  status() {
    return { services: this.store.get().services };
  }

  @Get("analytics")
  analytics() {
    const s = this.store.get();
    return { analytics: s.analytics, revenueSeries: s.revenueSeries, growthSeries: s.growthSeries };
  }

  @Get("settings")
  settings() {
    return { settings: this.store.get().settings };
  }

  @Patch("settings")
  patchSettings(@Body() body: PatchSettingsDto) {
    return { settings: this.store.updateSettings(body as Partial<PlatformSettings>), message: "Settings saved." };
  }

  @Get("me")
  me(@Headers("authorization") authorization?: string) {
    const user = this.auth.requireAdmin(authorization);
    return {
      profile: {
        id: user.id,
        name: user.name ?? "Admin",
        email: user.email ?? "admin@clipora.app",
        role: user.role,
        createdAt: "2025-08-02T10:00:00.000Z",
        lastLoginAt: new Date().toISOString(),
        googleConnected: false,
        twoFactorEnabled: false,
        sessions: [
          { id: "ses_current", device: "This browser", location: "Cairo, Egypt", current: true, lastActive: new Date().toISOString() },
          { id: "ses_2", device: "Safari on Mac", location: "Cairo, Egypt", current: false, lastActive: "2026-09-02T18:12:00.000Z" },
        ],
      },
    };
  }
}

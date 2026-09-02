import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import {
  PLAN_DEFINITIONS,
  formatMoney,
  paymobAmountCents,
} from "@clipora/shared";
import { AuthGuard } from "../auth/auth.guard";
import { AuthService } from "../auth/auth.service";
import { ProjectsStore } from "../projects/projects.store";
import { BillingStore } from "./billing.store";
import { CreateCheckoutDto, PayCheckoutDto } from "./dto";
import { PaymobService } from "./paymob.service";

@Controller("billing")
export class BillingController {
  constructor(
    private readonly auth: AuthService,
    private readonly store: BillingStore,
    private readonly paymob: PaymobService,
    private readonly projects: ProjectsStore,
  ) {}

  @Get("config")
  config() {
    const methods = this.paymob.methods().map((method) => ({
      id: method.id,
      name: method.name,
      description: method.description,
      available: true,
    }));
    return { currency: "EGP", demo: !this.paymob.enabled(), methods };
  }

  @Get("usage")
  @UseGuards(AuthGuard)
  async usage(@Headers("authorization") authorization?: string) {
    const user = this.auth.fromRequest(authorization);
    const sub = await this.store.getSubscription(user.id);
    const plan = PLAN_DEFINITIONS[sub.planId];
    const videosUsed = await this.videosUsed(user.id);
    const minutesUsed = 0;
    const approachingLimit = plan.videosPerMonth > 0 && videosUsed / plan.videosPerMonth >= 0.8;
    return {
      planId: sub.planId,
      planName: plan.name,
      status: sub.status,
      interval: sub.status === "free" ? null : sub.interval,
      currency: sub.currency,
      amount: sub.amount,
      renewsAt: sub.renewsAt,
      cancelAt: sub.cancelAt,
      paymentMethod: sub.paymentMethod,
      videosUsed,
      videosLimit: plan.videosPerMonth,
      minutesUsed,
      minutesLimit: plan.minutesPerMonth,
      resetsAt: sub.renewsAt ?? monthReset(),
      approachingLimit,
    };
  }

  @Get("subscription")
  @UseGuards(AuthGuard)
  async subscription(@Headers("authorization") authorization?: string) {
    const user = this.auth.fromRequest(authorization);
    return { subscription: await this.store.getSubscription(user.id), invoices: await this.store.listInvoices(user.id) };
  }

  @Post("subscription/cancel")
  @UseGuards(AuthGuard)
  async cancel(@Headers("authorization") authorization?: string) {
    const user = this.auth.fromRequest(authorization);
    return { subscription: await this.store.cancel(user.id) };
  }

  @Post("subscription/reactivate")
  @UseGuards(AuthGuard)
  async reactivate(@Headers("authorization") authorization?: string) {
    const user = this.auth.fromRequest(authorization);
    return { subscription: await this.store.reactivate(user.id) };
  }

  @Post("checkout")
  async createCheckout(@Body() body: CreateCheckoutDto, @Headers("authorization") authorization?: string) {
    if (body.planId === "free") {
      throw new BadRequestException("The Free plan doesn't require payment. You can start creating clips right away.");
    }
    const user = this.auth.optional(authorization);
    const session = await this.store.createSession({
      userId: user?.id ?? null,
      email: body.email,
      name: body.name,
      phone: body.phone,
      planId: body.planId,
      interval: body.interval,
      currency: "EGP",
    });
    return { session };
  }

  @Get("checkout/:id")
  async getCheckout(@Param("id") id: string) {
    const session = await this.store.getSession(id);
    if (!session) throw new NotFoundException("We couldn't find that checkout.");
    return { session, plan: PLAN_DEFINITIONS[session.planId] };
  }

  @Post("checkout/:id/pay")
  async pay(@Param("id") id: string, @Body() body: PayCheckoutDto) {
    const session = await this.store.getSession(id);
    if (!session) throw new NotFoundException("We couldn't find that checkout.");
    if (session.status === "paid" || session.status === "already_paid") {
      return { session: { ...session, status: "already_paid" }, alreadyPaid: true };
    }
    if (session.status === "processing" || session.status === "pending") {
      throw new BadRequestException("Your previous payment is still being verified. Please wait for confirmation before starting another payment.");
    }

    const plan = PLAN_DEFINITIONS[session.planId];
    const methods = this.paymob.methods();
    const selected = methods.find((method) => method.id === body.method) ?? methods[0];
    const paymentMethods = selected?.integrationId
      ? [selected.integrationId]
      : methods.map((method) => method.integrationId).filter((value): value is number => Boolean(value));

    if (!this.paymob.enabled()) {
      const updated = await this.store.updateSession(id, { status: "processing" });
      return {
        session: updated,
        demo: true,
        redirectUrl: `/checkout/complete?session=${id}&demo=1`,
        amountLabel: formatMoney(session.total, "EGP"),
      };
    }

    const [firstName, ...rest] = session.name.split(" ");
    const intention = await this.paymob.createIntention({
      amountCents: paymobAmountCents(session.total),
      currency: "EGP",
      paymentMethods: paymentMethods.length ? paymentMethods : ["card"],
      specialReference: session.id,
      itemName: `${plan.name} plan (${session.interval})`,
      customer: {
        firstName: firstName || "Clipora",
        lastName: rest.join(" ") || "Customer",
        email: session.email,
        phone: session.phone,
      },
    });
    const checkoutUrl = this.paymob.checkoutUrl(intention.clientSecret);
    const updated = await this.store.updateSession(id, {
      status: "redirecting",
      paymobCheckoutUrl: checkoutUrl,
    });
    return { session: updated, checkoutUrl, demo: false, amountLabel: formatMoney(session.total, "EGP") };
  }

  @Post("checkout/:id/demo-complete")
  async demoComplete(@Param("id") id: string) {
    if (this.paymob.enabled()) {
      throw new BadRequestException("Demo completion is disabled when Paymob is configured.");
    }
    const session = await this.store.getSession(id);
    if (!session) throw new NotFoundException("We couldn't find that checkout.");
    return this.markPaid(session, "Demo card");
  }

  @Get("invoices")
  @UseGuards(AuthGuard)
  async invoices(@Headers("authorization") authorization?: string) {
    const user = this.auth.fromRequest(authorization);
    return { invoices: await this.store.listInvoices(user.id) };
  }

  @Post("webhooks/paymob")
  @SkipThrottle()
  async webhook(@Query("hmac") hmac: string, @Body() body: { obj?: Record<string, unknown> }) {
    const obj = body?.obj;
    if (!obj || !this.paymob.verifyHmac(obj, hmac ?? "")) {
      return { received: true };
    }
    const eventId = String(obj.id ?? "");
    if (eventId && this.store.hasEvent(eventId)) return { received: true };
    if (eventId) this.store.markEvent(eventId);

    const order = obj.order as Record<string, unknown> | undefined;
    const checkoutId = String(order?.merchant_order_id ?? obj.merchant_order_id ?? "");
    const session = checkoutId ? await this.store.getSession(checkoutId) : null;
    if (!session) return { received: true };

    const success = obj.success === true || obj.success === "true";
    const pending = obj.pending === true || obj.pending === "true";
    if (pending && !success) {
      await this.store.updateSession(session.id, { status: "pending" });
      return { received: true };
    }
    if (success) {
      const source = obj.source_data as Record<string, unknown> | undefined;
      await this.markPaid(session, source?.type ? String(source.type) : "Paymob");
      return { received: true };
    }
    await this.store.updateSession(session.id, {
      status: "failed",
      failureReason: "Your payment wasn't completed. No subscription has been activated.",
    });
    return { received: true };
  }

  private async markPaid(session: Awaited<ReturnType<BillingStore["getSession"]>>, method: string) {
    if (!session) throw new NotFoundException("We couldn't find that checkout.");
    if (session.status === "paid") return { session, alreadyPaid: true };
    const paid = await this.store.updateSession(session.id, {
      status: "paid",
      paidAt: new Date().toISOString(),
      failureReason: null,
    });
    if (paid) await this.store.activatePaidPlan(paid, method);
    return { session: paid };
  }

  private async videosUsed(userId: string) {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const projects = await this.projects.list(userId);
    return projects.filter((project) => new Date(project.createdAt) >= start).length;
  }
}

function monthReset() {
  const resets = new Date();
  resets.setMonth(resets.getMonth() + 1, 1);
  resets.setHours(0, 0, 0, 0);
  return resets.toISOString();
}

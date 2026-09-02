import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";

export interface IntentionInput {
  amountCents: number;
  currency: string;
  paymentMethods: Array<number | string>;
  specialReference: string;
  customer: { firstName: string; lastName: string; email: string; phone: string };
  itemName: string;
}

@Injectable()
export class PaymobService {
  private readonly log = new Logger(PaymobService.name);

  constructor(private readonly config: ConfigService) {}

  enabled() {
    return Boolean(this.config.get("PAYMOB_SECRET_KEY") && this.config.get("PAYMOB_PUBLIC_KEY"));
  }

  methods() {
    const methods: Array<{ id: string; name: string; description: string; integrationId?: number }> = [];
    const card = Number(this.config.get("PAYMOB_INTEGRATION_ID_CARD") || 0);
    const wallet = Number(this.config.get("PAYMOB_INTEGRATION_ID_WALLET") || 0);
    if (card) methods.push({ id: "card", name: "Bank card", description: "Visa, Mastercard, and Meeza", integrationId: card });
    if (wallet) methods.push({ id: "wallet", name: "Mobile wallet", description: "Vodafone Cash, Orange Cash, and others", integrationId: wallet });
    if (!methods.length) {
      methods.push(
        { id: "card", name: "Bank card", description: "Visa, Mastercard, and Meeza" },
        { id: "wallet", name: "Mobile wallet", description: "Vodafone Cash, Orange Cash, and others" },
      );
    }
    return methods;
  }

  checkoutUrl(clientSecret: string) {
    const base = (this.config.get("PAYMOB_BASE_URL") ?? "https://accept.paymob.com").replace(/\/$/, "");
    const publicKey = this.config.get("PAYMOB_PUBLIC_KEY");
    return `${base}/unifiedcheckout/?publicKey=${publicKey}&clientSecret=${clientSecret}`;
  }

  async createIntention(input: IntentionInput): Promise<{ id: string; clientSecret: string }> {
    const secret = this.config.get<string>("PAYMOB_SECRET_KEY");
    if (!secret) throw new Error("Paymob is not configured.");
    const base = (this.config.get("PAYMOB_BASE_URL") ?? "https://accept.paymob.com").replace(/\/$/, "");
    const site = this.config.get("NEXT_PUBLIC_SITE_URL") ?? this.config.get("APP_URL") ?? "http://localhost:3000";
    const apiUrl = this.config.get("PUBLIC_API_URL") ?? `http://localhost:${this.config.get("PORT") ?? 4000}`;

    const response = await fetch(`${base}/v1/intention/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: input.amountCents,
        currency: input.currency,
        payment_methods: input.paymentMethods,
        items: [{ name: input.itemName, amount: input.amountCents, quantity: 1, description: input.itemName }],
        special_reference: input.specialReference,
        extras: { checkout_id: input.specialReference },
        billing_data: {
          first_name: input.customer.firstName,
          last_name: input.customer.lastName,
          email: input.customer.email,
          phone_number: input.customer.phone,
          apartment: "NA",
          floor: "NA",
          street: "NA",
          building: "NA",
          shipping_method: "NA",
          postal_code: "NA",
          city: "Cairo",
          state: "Cairo",
          country: "EGY",
        },
        customer: {
          first_name: input.customer.firstName,
          last_name: input.customer.lastName,
          email: input.customer.email,
        },
        notification_url: `${apiUrl}/billing/webhooks/paymob`,
        redirection_url: `${site}/checkout/complete?session=${input.specialReference}`,
        expiration: 3600,
      }),
    });

    const data = (await response.json()) as { id?: string; client_secret?: string; detail?: string; message?: string };
    if (!response.ok || !data.client_secret) {
      this.log.error(data);
      throw new Error(typeof data.detail === "string" ? data.detail : "We couldn't start secure payment. Please try again.");
    }
    return { id: String(data.id ?? ""), clientSecret: data.client_secret };
  }

  verifyHmac(obj: Record<string, unknown>, receivedHmac: string) {
    const secret = this.config.get<string>("PAYMOB_HMAC_SECRET");
    if (!secret || !receivedHmac) return false;
    const order = obj.order as Record<string, unknown> | undefined;
    const source = obj.source_data as Record<string, unknown> | undefined;
    const fields = [
      obj.amount_cents,
      obj.created_at,
      obj.currency,
      obj.error_occured,
      obj.has_parent_transaction,
      obj.id,
      obj.integration_id,
      obj.is_3d_secure,
      obj.is_auth,
      obj.is_capture,
      obj.is_refunded,
      obj.is_standalone_payment,
      obj.is_voided,
      order?.id,
      obj.owner,
      obj.pending,
      source?.pan,
      source?.sub_type,
      source?.type,
      obj.success,
    ];
    const computed = createHmac("sha512", secret)
      .update(fields.map((value) => String(value ?? "")).join(""))
      .digest("hex");
    if (computed.length !== receivedHmac.length) return false;
    try {
      return timingSafeEqual(Buffer.from(computed), Buffer.from(receivedHmac));
    } catch {
      return false;
    }
  }
}

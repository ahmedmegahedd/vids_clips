import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BillingInterval, PlanId } from "@clipora/shared";

interface CheckoutDraft {
  planId: PlanId;
  interval: BillingInterval;
  name: string;
  email: string;
  phone: string;
  method: string;
  sessionId: string | null;
  setPlan: (planId: PlanId, interval: BillingInterval) => void;
  setCustomer: (patch: Partial<Pick<CheckoutDraft, "name" | "email" | "phone" | "method">>) => void;
  setSessionId: (sessionId: string | null) => void;
}

export const useCheckoutDraft = create<CheckoutDraft>()(
  persist(
    (set) => ({
      planId: "creator",
      interval: "monthly",
      name: "",
      email: "",
      phone: "",
      method: "card",
      sessionId: null,
      setPlan: (planId, interval) => set({ planId, interval }),
      setCustomer: (patch) => set(patch),
      setSessionId: (sessionId) => set({ sessionId }),
    }),
    { name: "clipora-checkout" },
  ),
);

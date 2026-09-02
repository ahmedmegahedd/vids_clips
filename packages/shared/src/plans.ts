import type { OutputFormat, OutputOptions } from "./clips";

export const PLANS = ["free", "creator", "pro", "business"] as const;
export type PlanId = (typeof PLANS)[number];
export type BillingInterval = "monthly" | "yearly";
export type CheckoutCurrency = "EGP" | "USD";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  egpMonthly: number;
  egpYearly: number;
  videosPerMonth: number;
  minutesPerMonth: number;
  maxVideoMinutes: number;
  maxClipSeconds: number;
  concurrentJobs: number;
  downloadAll: boolean;
  priorityProcessing: boolean;
  teamSeats: number;
  benefits: string[];
  cta: string;
  recommended?: boolean;
}

export const YEARLY_SAVINGS_PERCENT = 20;

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "For users who want to try the product.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    egpMonthly: 0,
    egpYearly: 0,
    videosPerMonth: 1,
    minutesPerMonth: 30,
    maxVideoMinutes: 20,
    maxClipSeconds: 60,
    concurrentJobs: 1,
    downloadAll: false,
    priorityProcessing: false,
    teamSeats: 1,
    benefits: ["Process up to 1 video per month", "Basic clip splitting", "Standard processing", "Limited projects", "Download clips"],
    cta: "Start Free",
  },
  creator: {
    id: "creator",
    name: "Creator",
    tagline: "For regular content creators.",
    monthlyPrice: 19,
    yearlyPrice: 182,
    egpMonthly: 950,
    egpYearly: 9120,
    videosPerMonth: 20,
    minutesPerMonth: 300,
    maxVideoMinutes: 60,
    maxClipSeconds: 180,
    concurrentJobs: 2,
    downloadAll: true,
    priorityProcessing: false,
    teamSeats: 1,
    benefits: [
      "Process up to 20 videos per month",
      "Multiple projects",
      "Full clip downloads",
      "Faster processing",
      "Full output options",
    ],
    cta: "Get Creator",
    recommended: true,
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For heavy content creators.",
    monthlyPrice: 49,
    yearlyPrice: 470,
    egpMonthly: 2450,
    egpYearly: 23520,
    videosPerMonth: 80,
    minutesPerMonth: 1200,
    maxVideoMinutes: 180,
    maxClipSeconds: 180,
    concurrentJobs: 4,
    downloadAll: true,
    priorityProcessing: true,
    teamSeats: 1,
    benefits: [
      "Process up to 80 videos per month",
      "More projects",
      "Priority processing",
      "Batch downloads",
      "Full format options",
    ],
    cta: "Get Pro",
  },
  business: {
    id: "business",
    name: "Business",
    tagline: "For teams and agencies.",
    monthlyPrice: 99,
    yearlyPrice: 950,
    egpMonthly: 4950,
    egpYearly: 47520,
    videosPerMonth: 300,
    minutesPerMonth: 5000,
    maxVideoMinutes: 240,
    maxClipSeconds: 180,
    concurrentJobs: 8,
    downloadAll: true,
    priorityProcessing: true,
    teamSeats: 10,
    benefits: [
      "Process up to 300 videos per month",
      "Multiple users",
      "Large project capacity",
      "Priority processing",
      "Team workspace",
    ],
    cta: "Get Business",
  },
};

export function planChargeAmount(plan: PlanDefinition, interval: BillingInterval, currency: CheckoutCurrency): number {
  if (plan.id === "free") return 0;
  if (currency === "EGP") return interval === "yearly" ? plan.egpYearly : plan.egpMonthly;
  return interval === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
}

export function equivalentMonthly(plan: PlanDefinition, currency: CheckoutCurrency): number {
  if (plan.id === "free") return 0;
  if (currency === "EGP") return Math.round((plan.egpYearly / 12) * 100) / 100;
  return Math.round((plan.yearlyPrice / 12) * 100) / 100;
}

export function formatMoney(amount: number, currency: CheckoutCurrency): string {
  if (currency === "EGP") {
    return `EGP ${amount.toLocaleString("en-EG", { maximumFractionDigits: 0 })}`;
  }
  const value = Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(2);
  return `$${value}`;
}

export function paymobAmountCents(egpPounds: number): number {
  return Math.round(egpPounds * 100);
}

export type ProjectStatus = "draft" | "queued" | "processing" | "ready" | "failed" | "completed";

export type ProcessingStage =
  | "preparing"
  | "splitting"
  | "creating"
  | "finishing"
  | "complete"
  | "failed";

export const PROCESSING_STAGE_COPY: Record<ProcessingStage, string> = {
  preparing: "Preparing your video",
  splitting: "Splitting your video",
  creating: "Creating your clips",
  finishing: "Finishing up",
  complete: "Your clips are ready!",
  failed: "We couldn't process this video",
};

export interface VideoMeta {
  youtubeId: string;
  url: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  durationSeconds: number;
}

export interface ClipRecord {
  id: string;
  projectId: string;
  index: number;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  storagePath: string | null;
}

export interface ProjectRecord {
  id: string;
  userId: string;
  status: ProjectStatus;
  stage: ProcessingStage;
  progress: number;
  currentClip: number;
  estimatedClips: number;
  clipSeconds: number;
  format: OutputFormat;
  options: OutputOptions;
  video: VideoMeta;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

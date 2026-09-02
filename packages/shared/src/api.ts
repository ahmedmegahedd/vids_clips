import type { OutputFormat, OutputOptions } from "./clips";
import type { ClipRecord, ProcessingStage, ProjectRecord, ProjectStatus, VideoMeta } from "./plans";
import type {
  BillingConfig,
  BillingUsageResponse,
  CheckoutSession,
  InvoiceRecord,
  SubscriptionRecord,
} from "./billing";

export interface ResolveVideoRequest {
  url: string;
}

export interface ResolveVideoResponse {
  video: VideoMeta;
}

export interface CreateProjectRequest {
  url: string;
  clipSeconds: number;
  format: OutputFormat;
  options: OutputOptions;
}

export interface CreateProjectResponse {
  project: ProjectRecord;
}

export interface ProjectResponse {
  project: ProjectRecord;
  clips: ClipRecord[];
}

export interface UsageResponse extends BillingUsageResponse {}

export interface ApiErrorBody {
  message: string;
  code?: string;
}

export type {
  BillingConfig,
  CheckoutSession,
  ClipRecord,
  InvoiceRecord,
  ProcessingStage,
  ProjectRecord,
  ProjectStatus,
  SubscriptionRecord,
  VideoMeta,
};

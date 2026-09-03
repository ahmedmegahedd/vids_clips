import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString } from "class-validator";
import type { AppRole } from "@clipora/shared";

export class CreateAdminUserDto {
  @IsString()
  name!: string;

  @IsString()
  email!: string;

  @IsString()
  planId!: string;

  @IsOptional()
  @IsIn(["user", "admin", "super_admin", "support", "finance", "moderator"])
  role?: AppRole;
}

export class PatchUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsString()
  role?: string;
}

export class ChangePlanDto {
  @IsString()
  planId!: string;
}

export class CreatePlanDto {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsNumber()
  monthlyPrice!: number;

  @IsNumber()
  yearlyPrice!: number;

  @IsNumber()
  videosPerMonth!: number;

  @IsNumber()
  clipLimit!: number;

  @IsNumber()
  maxProjects!: number;

  @IsNumber()
  priority!: number;

  @IsString()
  visibility!: "public" | "hidden";

  @IsString()
  status!: "active" | "inactive";

  @IsArray()
  features!: { id: string; label: string; included: boolean }[];
}

export class PatchPlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  monthlyPrice?: number;

  @IsOptional()
  @IsNumber()
  yearlyPrice?: number;

  @IsOptional()
  @IsNumber()
  videosPerMonth?: number;

  @IsOptional()
  @IsNumber()
  clipLimit?: number;

  @IsOptional()
  @IsNumber()
  maxProjects?: number;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsString()
  visibility?: "public" | "hidden";

  @IsOptional()
  @IsString()
  status?: "active" | "inactive";

  @IsOptional()
  @IsArray()
  features?: { id: string; label: string; included: boolean }[];
}

export class PatchSettingsDto {
  @IsOptional()
  @IsString()
  websiteName?: string;

  @IsOptional()
  @IsString()
  supportEmail?: string;

  @IsOptional()
  @IsString()
  defaultCurrency?: "EGP" | "USD";

  @IsOptional()
  @IsNumber()
  defaultClipLength?: number;

  @IsOptional()
  @IsString()
  defaultOutputFormat?: string;

  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional()
  @IsBoolean()
  registrationEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  maxUploadGb?: number;

  @IsOptional()
  @IsNumber()
  maxProcessingMinutes?: number;
}

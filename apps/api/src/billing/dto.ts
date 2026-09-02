import { IsEmail, IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { PLANS, type BillingInterval, type PlanId } from "@clipora/shared";

export class CreateCheckoutDto {
  @IsIn(PLANS)
  planId!: PlanId;

  @IsIn(["monthly", "yearly"])
  interval!: BillingInterval;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  phone!: string;

  @IsOptional()
  @IsString()
  method?: string;
}

export class PayCheckoutDto {
  @IsOptional()
  @IsString()
  method?: string;
}

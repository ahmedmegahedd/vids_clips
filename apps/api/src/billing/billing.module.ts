import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ProcessingModule } from "../processing/processing.module";
import { BillingController } from "./billing.controller";
import { BillingStore } from "./billing.store";
import { PaymobService } from "./paymob.service";
import { UsageService } from "./usage.service";

@Module({
  imports: [AuthModule, ProcessingModule],
  controllers: [BillingController],
  providers: [UsageService, BillingStore, PaymobService],
  exports: [UsageService, BillingStore],
})
export class BillingModule {}

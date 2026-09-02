import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module";
import { VideosModule } from "./videos/videos.module";
import { ProjectsModule } from "./projects/projects.module";
import { HealthModule } from "./health/health.module";
import { BillingModule } from "./billing/billing.module";
import { ProcessingModule } from "./processing/processing.module";
import { SupabaseModule } from "./supabase/supabase.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "../../.env"] }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 60 }],
    }),
    SupabaseModule,
    AuthModule,
    VideosModule,
    ProjectsModule,
    ProcessingModule,
    BillingModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

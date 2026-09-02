import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { BillingModule } from "../billing/billing.module";
import { ProcessingModule } from "../processing/processing.module";
import { VideosModule } from "../videos/videos.module";
import { ProjectsController } from "./projects.controller";

@Module({
  imports: [AuthModule, VideosModule, ProcessingModule, BillingModule],
  controllers: [ProjectsController],
})
export class ProjectsModule {}

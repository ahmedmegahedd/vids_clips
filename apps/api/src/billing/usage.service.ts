import { ForbiddenException, Injectable } from "@nestjs/common";
import { PLAN_DEFINITIONS } from "@clipora/shared";
import { ProjectsStore } from "../projects/projects.store";
import { BillingStore } from "./billing.store";

@Injectable()
export class UsageService {
  constructor(
    private readonly billing: BillingStore,
    private readonly projects: ProjectsStore,
  ) {}

  async assertCanProcess(userId: string, durationSeconds: number) {
    const sub = await this.billing.getSubscription(userId);
    const plan = PLAN_DEFINITIONS[sub.planId];
    const videoMinutes = Math.ceil(durationSeconds / 60);
    if (videoMinutes > plan.maxVideoMinutes) {
      throw new ForbiddenException(
        `This video is longer than your ${plan.name} plan allows. Choose a shorter video or upgrade.`,
      );
    }
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const used = (await this.projects.list(userId)).filter((project) => new Date(project.createdAt) >= start).length;
    if (used >= plan.videosPerMonth) {
      throw new ForbiddenException(`You've reached this month's ${plan.name} limit. Upgrade to keep creating clips.`);
    }
  }
}

import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Res,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { AuthService, type AuthUser } from "../auth/auth.service";
import { ProcessingService } from "../processing/processing.service";
import { YoutubeService } from "../videos/youtube.service";
import { UsageService } from "../billing/usage.service";
import { CreateProjectDto } from "./dto";
import { ProjectsStore } from "./projects.store";
import archiver from "archiver";
import { existsSync } from "node:fs";

@Controller("projects")
export class ProjectsController {
  constructor(
    private readonly auth: AuthService,
    private readonly youtube: YoutubeService,
    private readonly store: ProjectsStore,
    private readonly processing: ProcessingService,
    private readonly usage: UsageService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() body: CreateProjectDto, @Headers("authorization") authorization?: string) {
    const user = this.auth.fromRequest(authorization) as AuthUser;
    const video = await this.youtube.resolve(body.url);
    await this.usage.assertCanProcess(user.id, video.durationSeconds);
    const project = await this.store.create({
      userId: user.id,
      video,
      clipSeconds: body.clipSeconds,
      format: body.format,
      options: body.options,
    });
    await this.processing.enqueue(project.id);
    const record = await this.store.get(project.id, user.id);
    return record;
  }

  @Get()
  @UseGuards(AuthGuard)
  async list(@Headers("authorization") authorization?: string) {
    const user = this.auth.fromRequest(authorization);
    const projects = await this.store.list(user.id);
    return { projects };
  }

  @Get(":id")
  async get(@Param("id") id: string, @Headers("authorization") authorization?: string) {
    const user = this.auth.optional(authorization);
    const record = await this.store.get(id, user?.id);
    if (!record) throw new NotFoundException("We couldn't find that project.");
    return record;
  }

  @Get(":id/download-all")
  async downloadAll(@Param("id") id: string, @Res({ passthrough: true }) res: Response) {
    const record = await this.store.get(id);
    if (!record) throw new NotFoundException("We couldn't find that project.");
    const archive = archiver("zip", { zlib: { level: 9 } });
    const filename = `clipora-${record.project.video.title.replace(/[^\w]+/g, "-").slice(0, 40)}.zip`;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    for (const clip of record.clips) {
      if (clip.storagePath && existsSync(clip.storagePath)) {
        archive.file(clip.storagePath, { name: `clip-${String(clip.index + 1).padStart(2, "0")}.mp4` });
      }
    }

    if (record.clips.every((c) => !c.storagePath || !existsSync(c.storagePath))) {
      archive.append(
        "Your clips are ready in the app. File packaging is available after processing with ffmpeg.\n",
        { name: "README.txt" },
      );
    }

    archive.finalize();
    return new StreamableFile(archive);
  }
}

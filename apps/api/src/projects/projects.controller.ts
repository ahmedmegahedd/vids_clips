import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { AuthService, type AuthUser } from "../auth/auth.service";
import { ProcessingService } from "../processing/processing.service";
import { YoutubeService } from "../videos/youtube.service";
import { UsageService } from "../billing/usage.service";
import { CreateProjectDto } from "./dto";
import { ProjectsStore } from "./projects.store";
import { streamMediaFile } from "./stream-file";
import archiver from "archiver";

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

  @Get(":id/clips/:clipId/file")
  @SkipThrottle()
  async clipFile(
    @Param("id") id: string,
    @Param("clipId") clipId: string,
    @Query("download") download: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const file = await this.processing.resolveClipFile(id, clipId);
    if (!file) throw new NotFoundException("That clip isn't available to download yet.");
    if (file.path) {
      streamMediaFile(req, res, file.path, {
        contentType: "video/mp4",
        filename: file.name,
        download: download === "1",
      });
      return;
    }
    const buffer = file.buffer ?? Buffer.alloc(0);
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Length", String(buffer.length));
    res.setHeader(
      "Content-Disposition",
      `${download === "1" ? "attachment" : "inline"}; filename="${file.name}"`,
    );
    res.end(buffer);
  }

  @Get(":id/download-all")
  @SkipThrottle()
  async downloadAll(@Param("id") id: string, @Res() res: Response) {
    const record = await this.store.get(id);
    if (!record) throw new NotFoundException("We couldn't find that project.");

    const files = await this.processing.ensureFiles(id);
    if (files.length === 0) {
      throw new BadRequestException(
        "We couldn't package downloadable clip files yet. Create the video again after video processing is available, or download clips individually once they're ready.",
      );
    }

    const filename = `clipora-${record.project.video.title.replace(/[^\w]+/g, "-").slice(0, 40)}.zip`;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-store");

    const archive = archiver("zip", { store: true });
    archive.on("error", (err) => {
      if (!res.headersSent) res.status(500).end();
      else res.destroy(err);
    });
    archive.pipe(res);
    for (const file of files) {
      if (file.path) archive.file(file.path, { name: file.name });
      else if (file.buffer) archive.append(file.buffer, { name: file.name });
    }
    await archive.finalize();
  }

  @Get(":id")
  async get(@Param("id") id: string, @Headers("authorization") authorization?: string) {
    const user = this.auth.optional(authorization);
    const record = await this.store.get(id, user?.id);
    if (!record) throw new NotFoundException("We couldn't find that project.");
    void this.processing.resumeIfStuck(id);
    const apiBase = process.env.PUBLIC_API_URL ?? "http://localhost:4000";
    return {
      ...record,
      clips: record.clips.map((clip) => ({
        ...clip,
        videoUrl:
          clip.videoUrl?.startsWith("http")
            ? clip.videoUrl
            : clip.storagePath || clip.videoUrl
              ? `${apiBase}/projects/${id}/clips/${clip.id}/file`
              : clip.videoUrl,
      })),
    };
  }
}

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { estimateClipCount, type ClipRecord, type OutputFormat } from "@clipora/shared";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { ProjectsStore } from "../projects/projects.store";
import { SupabaseService } from "../supabase/supabase.service";

const execFileAsync = promisify(execFile);

@Injectable()
export class ProcessingService {
  private readonly log = new Logger(ProcessingService.name);
  private readonly inflight = new Set<string>();

  constructor(
    private readonly store: ProjectsStore,
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {}

  async enqueue(projectId: string) {
    if (this.inflight.has(projectId)) return;
    this.inflight.add(projectId);
    setImmediate(() => {
      void this.run(projectId).finally(() => this.inflight.delete(projectId));
    });
  }

  private async run(projectId: string) {
    const record = await this.store.get(projectId);
    if (!record) return;
    const { project } = record;

    try {
      await this.store.update(projectId, { status: "processing", stage: "preparing", progress: 4 });
      const mode = await this.resolveMode();

      if (mode === "real") {
        await this.processReal(projectId);
      } else {
        await this.processSimulated(projectId);
      }
    } catch (error) {
      this.log.error(error);
      await this.store.update(projectId, {
        status: "failed",
        stage: "failed",
        progress: 0,
        errorMessage: "We couldn't process this video. Please make sure the video is available and that you have permission to use it.",
      });
    }
  }

  private async resolveMode(): Promise<"real" | "simulated"> {
    const forced = this.config.get<string>("PROCESSOR_MODE");
    if (forced === "simulated") return "simulated";
    if (forced === "real") return "real";
    return (await hasBinary("yt-dlp")) && (await hasBinary("ffmpeg")) ? "real" : "simulated";
  }

  private async processSimulated(projectId: string) {
    const record = await this.store.get(projectId);
    if (!record) return;
    const { project } = record;
    const total = estimateClipCount(project.video.durationSeconds, project.clipSeconds);

    await this.store.update(projectId, { stage: "splitting", progress: 12 });
    await sleep(400);
    await this.store.update(projectId, { stage: "creating", progress: 20 });

    const clips: ClipRecord[] = [];
    for (let i = 0; i < total; i++) {
      const start = i * project.clipSeconds;
      const end = Math.min(project.video.durationSeconds, start + project.clipSeconds);
      clips.push({
        id: randomUUID(),
        projectId,
        index: i,
        startSeconds: start,
        endSeconds: end,
        durationSeconds: Math.max(1, end - start),
        thumbnailUrl: project.video.thumbnailUrl,
        videoUrl: null,
        storagePath: null,
      });
    }

    const ticks = Math.min(total, 20);
    for (let t = 1; t <= ticks; t++) {
      const currentClip = Math.max(1, Math.round((t / ticks) * total));
      await this.store.update(projectId, {
        currentClip,
        progress: Math.min(96, 20 + Math.round((t / ticks) * 70)),
      });
      await this.store.replaceClips(projectId, clips.slice(0, currentClip));
      await sleep(160);
    }
    await this.store.replaceClips(projectId, clips);

    await this.store.update(projectId, { stage: "finishing", progress: 98 });
    await sleep(350);
    await this.store.update(projectId, { status: "ready", stage: "complete", progress: 100, currentClip: total });
    await this.recordUsage(project.userId, projectId, project.video.durationSeconds);
  }

  private async processReal(projectId: string) {
    const record = await this.store.get(projectId);
    if (!record) return;
    const { project } = record;
    const workDir = join(process.cwd(), "tmp", projectId);
    await mkdir(workDir, { recursive: true });
    const sourcePath = join(workDir, "source.mp4");

    try {
      await this.store.update(projectId, { stage: "preparing", progress: 8 });
      await execFileAsync(
        "yt-dlp",
        [
          "-f",
          "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b",
          "--merge-output-format",
          "mp4",
          "-o",
          sourcePath,
          project.video.url,
        ],
        { timeout: 15 * 60_000 },
      );

      await this.store.update(projectId, { stage: "splitting", progress: 22 });
      const duration = project.video.durationSeconds;
      const total = estimateClipCount(duration, project.clipSeconds);
      const clips: ClipRecord[] = [];

      await this.store.update(projectId, { stage: "creating", progress: 28 });
      for (let i = 0; i < total; i++) {
        const start = i * project.clipSeconds;
        const length = Math.min(project.clipSeconds, duration - start);
        const outPath = join(workDir, `clip-${String(i + 1).padStart(2, "0")}.mp4`);
        const vf = scaleFilter(project.format, project.options.fitMode);
        await execFileAsync("ffmpeg", [
          "-y",
          "-ss",
          String(start),
          "-i",
          sourcePath,
          "-t",
          String(length),
          "-vf",
          vf,
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          project.options.keepOriginalQuality ? "18" : "23",
          ...(project.options.preserveOriginalAudio ? ["-c:a", "aac"] : ["-an"]),
          "-movflags",
          "+faststart",
          outPath,
        ]);

        let videoUrl: string | null = outPath;
        let storagePath = outPath;
        if (this.supabase.client) {
          const bucket = "clips";
          const objectPath = `${project.userId}/${projectId}/clip-${i + 1}.mp4`;
          const file = await import("node:fs/promises").then((fs) => fs.readFile(outPath));
          const { error } = await this.supabase.client.storage.from(bucket).upload(objectPath, file, {
            contentType: "video/mp4",
            upsert: true,
          });
          if (!error) {
            const { data } = this.supabase.client.storage.from(bucket).getPublicUrl(objectPath);
            videoUrl = data.publicUrl;
            storagePath = objectPath;
          }
        }

        clips.push({
          id: randomUUID(),
          projectId,
          index: i,
          startSeconds: start,
          endSeconds: start + length,
          durationSeconds: length,
          thumbnailUrl: project.video.thumbnailUrl,
          videoUrl,
          storagePath,
        });
        await this.store.replaceClips(projectId, clips);
        await this.store.update(projectId, {
          currentClip: i + 1,
          progress: Math.min(96, 28 + Math.round(((i + 1) / total) * 68)),
        });
      }

      await this.store.update(projectId, { stage: "finishing", progress: 98 });
      await this.store.update(projectId, { status: "ready", stage: "complete", progress: 100, currentClip: total });
      await this.recordUsage(project.userId, projectId, project.video.durationSeconds);
    } finally {
      if (!this.supabase.client) {
        /* keep local files for download */
      } else {
        await rm(workDir, { recursive: true, force: true });
      }
    }
  }

  private async recordUsage(userId: string, projectId: string, durationSeconds: number) {
    if (!this.supabase.client) return;
    await this.supabase.client.from("usage_events").insert({
      user_id: userId,
      project_id: projectId,
      minutes: Math.max(1, Math.ceil(durationSeconds / 60)),
    });
  }
}

function scaleFilter(format: OutputFormat, fitMode: "fit" | "crop" | "pad"): string {
  const size = format === "vertical" ? "1080:1920" : format === "square" ? "1080:1080" : "1920:1080";
  if (fitMode === "fit") return `scale=${size}:force_original_aspect_ratio=decrease,pad=${size}:(ow-iw)/2:(oh-ih)/2`;
  if (fitMode === "pad") return `scale=${size}:force_original_aspect_ratio=decrease,pad=${size}:(ow-iw)/2:(oh-ih)/2:black`;
  return `scale=${size}:force_original_aspect_ratio=increase,crop=${size}`;
}

async function hasBinary(name: string) {
  try {
    await execFileAsync(name, ["-version"], { timeout: 4000 });
    return true;
  } catch {
    try {
      await execFileAsync("which", [name], { timeout: 4000 });
      return existsSync(name);
    } catch {
      return false;
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

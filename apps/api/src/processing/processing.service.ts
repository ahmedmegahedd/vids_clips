import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { estimateClipCount, type ClipRecord, type OutputFormat } from "@clipora/shared";
import { mkdir, rm, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { ProjectsStore } from "../projects/projects.store";
import { SupabaseService } from "../supabase/supabase.service";
import { hasBinary, resolveBinary, binaryEnv } from "./binaries";
import { CommandError, runCommand } from "./run-command";

export interface ClipFile {
  name: string;
  path?: string;
  buffer?: Buffer;
}

@Injectable()
export class ProcessingService {
  private readonly log = new Logger(ProcessingService.name);
  private readonly inflight = new Set<string>();

  constructor(
    private readonly store: ProjectsStore,
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {}

  storageRoot() {
    return this.config.get<string>("CLIP_STORAGE_DIR") ?? join(__dirname, "..", "..", "tmp");
  }

  workDir(projectId: string) {
    return join(this.storageRoot(), projectId);
  }

  clipDiskPath(projectId: string, index: number) {
    return join(this.workDir(projectId), `clip-${String(index + 1).padStart(2, "0")}.mp4`);
  }

  async enqueue(projectId: string) {
    if (this.inflight.has(projectId)) return;
    this.inflight.add(projectId);
    setImmediate(() => {
      void this.run(projectId).finally(() => this.inflight.delete(projectId));
    });
  }

  async resumeIfStuck(projectId: string) {
    const record = await this.store.get(projectId);
    if (!record) return;
    if (record.project.status !== "processing" && record.project.status !== "queued") return;
    if (this.inflight.has(projectId)) return;
    this.log.warn(`Resuming stuck project ${projectId} (${record.project.stage} ${record.project.progress}%)`);
    await this.enqueue(projectId);
  }

  async canProcessReal() {
    return (await hasBinary("yt-dlp")) && (await hasBinary("ffmpeg"));
  }

  async collectClipFiles(projectId: string): Promise<ClipFile[]> {
    const record = await this.store.get(projectId);
    if (!record) return [];
    const files: ClipFile[] = [];
    for (const clip of record.clips) {
      const name = `clip-${String(clip.index + 1).padStart(2, "0")}.mp4`;
      const resolved = await this.resolveClipFile(projectId, clip.id);
      if (resolved) files.push({ ...resolved, name });
    }
    return files;
  }

  async resolveClipFile(projectId: string, clipId: string): Promise<ClipFile | null> {
    const record = await this.store.get(projectId);
    if (!record) return null;
    const clip = record.clips.find((item) => item.id === clipId);
    if (!clip) return null;
    const name = `clip-${String(clip.index + 1).padStart(2, "0")}.mp4`;

    const locals = [clip.storagePath, this.clipDiskPath(projectId, clip.index)].filter((path): path is string => Boolean(path));
    const local = locals.find((path) => !path.startsWith("http") && existsSync(path));
    if (local) return { name, path: local };

    if (this.supabase.client && clip.storagePath && !clip.storagePath.startsWith("/") && !clip.storagePath.startsWith("http")) {
      const { data, error } = await this.supabase.client.storage.from("clips").download(clip.storagePath);
      if (!error && data) return { name, buffer: Buffer.from(await data.arrayBuffer()) };
    }

    if (clip.videoUrl?.startsWith("http") && !clip.videoUrl.includes("/clips/")) {
      try {
        const response = await fetch(clip.videoUrl);
        if (response.ok) return { name, buffer: Buffer.from(await response.arrayBuffer()) };
      } catch {
        /* fall through */
      }
    }
    return null;
  }

  async ensureFiles(projectId: string): Promise<ClipFile[]> {
    const existing = await this.collectClipFiles(projectId);
    if (existing.length > 0) return existing;
    if (!(await this.canProcessReal())) return [];
    await this.processReal(projectId);
    return this.collectClipFiles(projectId);
  }

  private publicApi() {
    return this.config.get<string>("PUBLIC_API_URL") ?? "http://localhost:4000";
  }

  private fileUrl(projectId: string, clipId: string) {
    return `${this.publicApi()}/projects/${projectId}/clips/${clipId}/file`;
  }

  private async run(projectId: string) {
    const record = await this.store.get(projectId);
    if (!record) return;

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
      const friendly =
        error instanceof CommandError
          ? error.message
          : "We couldn't process this video. Please make sure the video is available and that you have permission to use it.";
      await this.store.update(projectId, {
        status: "failed",
        stage: "failed",
        progress: 0,
        errorMessage: friendly,
      });
    }
  }

  private async resolveMode(): Promise<"real" | "simulated"> {
    const forced = this.config.get<string>("PROCESSOR_MODE");
    const canReal = await this.canProcessReal();
    if (forced === "real") return canReal ? "real" : "simulated";
    if (forced === "simulated") return canReal ? "real" : "simulated";
    return canReal ? "real" : "simulated";
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
      const id = randomUUID();
      clips.push({
        id,
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
    const ytDlp = resolveBinary("yt-dlp");
    const ffmpeg = resolveBinary("ffmpeg");
    if (!ytDlp || !ffmpeg) {
      throw new Error("Video processing tools are not installed.");
    }

    const workDir = this.workDir(projectId);
    await mkdir(workDir, { recursive: true });
    const sourcePath = join(workDir, "source.mp4");

    try {
      await this.store.update(projectId, { stage: "preparing", progress: 8, currentClip: 0 });
      this.log.log(`Downloading ${project.video.title} (${projectId})`);
      const ffmpegPath = resolveBinary("ffmpeg") ?? ffmpeg;
      await runCommand(
        ytDlp,
        [
          "--no-playlist",
          "--newline",
          "--no-mtime",
          "--retries",
          "3",
          "--fragment-retries",
          "5",
          "--socket-timeout",
          "30",
          "-N",
          "4",
          "--ffmpeg-location",
          ffmpegPath,
          "--extractor-args",
          "youtube:player_client=web,android,ios",
          "-S",
          "res",
          "-f",
          "bv*[height<=2160]+ba/b[height<=2160]/b",
          "--merge-output-format",
          "mp4",
          "-o",
          sourcePath,
          project.video.url,
        ],
        {
          timeoutMs: 20 * 60_000,
          stallMs: 120_000,
          env: binaryEnv(),
          onOutput: (line) => {
            const match = line.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
            if (match) {
              const pct = Number(match[1]);
              void this.store.update(projectId, {
                stage: "preparing",
                progress: Math.min(20, 8 + Math.round(pct * 0.12)),
              });
            } else if (line.includes("[Merger]") || line.includes("Merging formats")) {
              void this.store.update(projectId, { stage: "preparing", progress: 20 });
            }
            this.log.debug(line);
          },
        },
      );

      if (!existsSync(sourcePath)) {
        throw new Error("The video downloaded but the file wasn't saved. Please try again.");
      }

      await this.store.update(projectId, { stage: "splitting", progress: 22 });
      const duration = project.video.durationSeconds;
      const total = estimateClipCount(duration, project.clipSeconds);
      const clips: ClipRecord[] = [];

      await this.store.update(projectId, { stage: "creating", progress: 28, currentClip: 0 });
      for (let i = 0; i < total; i++) {
        const start = i * project.clipSeconds;
        const length = Math.min(project.clipSeconds, duration - start);
        const outPath = this.clipDiskPath(projectId, i);
        const vf = scaleFilter(project.format, project.options.fitMode);
        const quality = project.options.keepOriginalQuality;
        await runCommand(
          ffmpeg,
          [
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
            quality ? "fast" : "veryfast",
            "-profile:v",
            "high",
            "-pix_fmt",
            "yuv420p",
            "-threads",
            "0",
            "-crf",
            quality ? "17" : "20",
            ...(project.options.preserveOriginalAudio ? ["-c:a", "aac", "-b:a", quality ? "192k" : "160k"] : ["-an"]),
            "-movflags",
            "+faststart",
            outPath,
          ],
          {
            timeoutMs: 6 * 60_000,
            stallMs: 120_000,
            env: binaryEnv(),
          },
        );

        const id = randomUUID();
        let videoUrl: string | null = this.fileUrl(projectId, id);
        const storagePath = outPath;
        if (this.supabase.client) {
          const objectPath = `${project.userId}/${projectId}/clip-${i + 1}.mp4`;
          const file = await readFile(outPath);
          const { error } = await this.supabase.client.storage.from("clips").upload(objectPath, file, {
            contentType: "video/mp4",
            upsert: true,
          });
          if (!error) {
            const { data } = this.supabase.client.storage.from("clips").getPublicUrl(objectPath);
            videoUrl = data.publicUrl;
          }
        }

        clips.push({
          id,
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
      if (existsSync(sourcePath)) {
        await rm(sourcePath, { force: true });
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
  const cover = fitMode === "crop" ? "increase" : "decrease";
  const scale = `scale=${size}:force_original_aspect_ratio=${cover}:flags=lanczos:force_divisible_by=2`;
  if (fitMode === "crop") return `${scale},crop=${size},setsar=1`;
  return `${scale},pad=${size}:(ow-iw)/2:(oh-ih)/2:black,setsar=1`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

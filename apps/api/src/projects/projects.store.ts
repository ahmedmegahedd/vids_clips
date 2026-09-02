import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  estimateClipCount,
  type ClipRecord,
  type OutputFormat,
  type OutputOptions,
  type ProcessingStage,
  type ProjectRecord,
  type ProjectStatus,
  type VideoMeta,
} from "@clipora/shared";
import { randomUUID } from "node:crypto";
import { SupabaseService } from "../supabase/supabase.service";

export interface CreateProjectInput {
  userId: string;
  video: VideoMeta;
  clipSeconds: number;
  format: OutputFormat;
  options: OutputOptions;
}

@Injectable()
export class ProjectsStore {
  private readonly memory = new Map<string, { project: ProjectRecord; clips: ClipRecord[] }>();

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  async create(input: CreateProjectInput): Promise<ProjectRecord> {
    const now = new Date().toISOString();
    const estimatedClips = estimateClipCount(input.video.durationSeconds, input.clipSeconds);
    const project: ProjectRecord = {
      id: randomUUID(),
      userId: input.userId,
      status: "queued",
      stage: "preparing",
      progress: 0,
      currentClip: 0,
      estimatedClips,
      clipSeconds: input.clipSeconds,
      format: input.format,
      options: input.options,
      video: input.video,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    };

    if (this.supabase.client) {
      const { error } = await this.supabase.client.from("projects").insert(toRow(project));
      if (error) throw error;
    } else {
      this.memory.set(project.id, { project, clips: [] });
    }
    return project;
  }

  async get(id: string, userId?: string): Promise<{ project: ProjectRecord; clips: ClipRecord[] } | null> {
    if (this.supabase.client) {
      let query = this.supabase.client.from("projects").select("*").eq("id", id);
      if (userId && this.config.get("DEV_BYPASS_AUTH") !== "true") query = query.eq("user_id", userId);
      const { data, error } = await query.maybeSingle();
      if (error || !data) return null;
      const { data: clips } = await this.supabase.client
        .from("clips")
        .select("*")
        .eq("project_id", id)
        .order("index", { ascending: true });
      return { project: fromRow(data as Record<string, unknown>), clips: (clips ?? []).map(fromClipRow) };
    }
    const found = this.memory.get(id);
    if (!found) return null;
    if (userId && found.project.userId !== userId && this.config.get("DEV_BYPASS_AUTH") !== "true") return null;
    return found;
  }

  async list(userId: string): Promise<ProjectRecord[]> {
    if (this.supabase.client) {
      const { data, error } = await this.supabase.client
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => fromRow(row as Record<string, unknown>));
    }
    return [...this.memory.values()]
      .map((v) => v.project)
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async update(
    id: string,
    patch: Partial<Pick<ProjectRecord, "status" | "stage" | "progress" | "currentClip" | "errorMessage">>,
  ) {
    const updatedAt = new Date().toISOString();
    if (this.supabase.client) {
      const row: Record<string, unknown> = { updated_at: updatedAt };
      if (patch.status) row.status = patch.status;
      if (patch.stage) row.stage = patch.stage;
      if (patch.progress !== undefined) row.progress = patch.progress;
      if (patch.currentClip !== undefined) row.current_clip = patch.currentClip;
      if (patch.errorMessage !== undefined) row.error_message = patch.errorMessage;
      await this.supabase.client.from("projects").update(row).eq("id", id);
    }
    const found = this.memory.get(id);
    if (found) {
      found.project = { ...found.project, ...patch, updatedAt };
    }
  }

  async replaceClips(projectId: string, clips: ClipRecord[]) {
    if (this.supabase.client) {
      await this.supabase.client.from("clips").delete().eq("project_id", projectId);
      if (clips.length) {
        await this.supabase.client.from("clips").insert(clips.map(toClipRow));
      }
    }
    const found = this.memory.get(projectId);
    if (found) found.clips = clips;
  }
}

function toRow(project: ProjectRecord) {
  return {
    id: project.id,
    user_id: project.userId,
    status: project.status,
    stage: project.stage,
    progress: project.progress,
    current_clip: project.currentClip,
    estimated_clips: project.estimatedClips,
    clip_seconds: project.clipSeconds,
    format: project.format,
    options: project.options,
    youtube_id: project.video.youtubeId,
    source_url: project.video.url,
    title: project.video.title,
    channel_name: project.video.channelName,
    thumbnail_url: project.video.thumbnailUrl,
    duration_seconds: project.video.durationSeconds,
    error_message: project.errorMessage,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  };
}

function fromRow(row: Record<string, unknown>): ProjectRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    status: row.status as ProjectStatus,
    stage: row.stage as ProcessingStage,
    progress: Number(row.progress),
    currentClip: Number(row.current_clip),
    estimatedClips: Number(row.estimated_clips),
    clipSeconds: Number(row.clip_seconds),
    format: row.format as OutputFormat,
    options: row.options as OutputOptions,
    video: {
      youtubeId: String(row.youtube_id),
      url: String(row.source_url),
      title: String(row.title),
      channelName: String(row.channel_name),
      thumbnailUrl: String(row.thumbnail_url),
      durationSeconds: Number(row.duration_seconds),
    },
    errorMessage: (row.error_message as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toClipRow(clip: ClipRecord) {
  return {
    id: clip.id,
    project_id: clip.projectId,
    index: clip.index,
    start_seconds: clip.startSeconds,
    end_seconds: clip.endSeconds,
    duration_seconds: clip.durationSeconds,
    thumbnail_url: clip.thumbnailUrl,
    video_url: clip.videoUrl,
    storage_path: clip.storagePath,
  };
}

function fromClipRow(row: Record<string, unknown>): ClipRecord {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    index: Number(row.index),
    startSeconds: Number(row.start_seconds),
    endSeconds: Number(row.end_seconds),
    durationSeconds: Number(row.duration_seconds),
    thumbnailUrl: (row.thumbnail_url as string | null) ?? null,
    videoUrl: (row.video_url as string | null) ?? null,
    storagePath: (row.storage_path as string | null) ?? null,
  };
}

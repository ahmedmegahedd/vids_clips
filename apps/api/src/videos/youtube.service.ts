import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { extractYouTubeId, type VideoMeta } from "@clipora/shared";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

interface OEmbed {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
}

@Injectable()
export class YoutubeService {
  constructor(private readonly config: ConfigService) {}

  async resolve(url: string): Promise<VideoMeta> {
    const youtubeId = extractYouTubeId(url);
    if (!youtubeId) {
      throw new BadRequestException("That link doesn't look right. Please check the YouTube URL and try again.");
    }

    const canonical = `https://www.youtube.com/watch?v=${youtubeId}`;
    const oembed = await this.oembed(canonical);
    const durationSeconds = await this.duration(youtubeId, canonical);

    if (!oembed.title) {
      throw new BadRequestException("We couldn't find that video. Please make sure it's available.");
    }

    return {
      youtubeId,
      url: canonical,
      title: oembed.title,
      channelName: oembed.author_name ?? "YouTube",
      thumbnailUrl:
        oembed.thumbnail_url?.replace("hqdefault", "maxresdefault") ??
        `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      durationSeconds: durationSeconds || 60,
    };
  }

  private async oembed(url: string): Promise<OEmbed> {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (!response.ok) {
      throw new BadRequestException("We couldn't find that video. Please make sure it's available.");
    }
    return (await response.json()) as OEmbed;
  }

  private async duration(id: string, url: string): Promise<number> {
    const apiKey = this.config.get<string>("YOUTUBE_API_KEY");
    if (apiKey) {
      const fromApi = await this.fromDataApi(id, apiKey);
      if (fromApi) return fromApi;
    }
    const fromYtdlp = await this.fromYtDlp(url);
    if (fromYtdlp) return fromYtdlp;
    return this.fromWatchPage(id);
  }

  private async fromDataApi(id: string, key: string): Promise<number> {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${id}&key=${key}`,
    );
    if (!response.ok) return 0;
    const json = (await response.json()) as {
      items?: Array<{ contentDetails?: { duration?: string } }>;
    };
    const iso = json.items?.[0]?.contentDetails?.duration;
    return iso ? parseIsoDuration(iso) : 0;
  }

  private async fromYtDlp(url: string): Promise<number> {
    try {
      const { stdout } = await execFileAsync("yt-dlp", ["--skip-download", "--print", "%(duration)s", url], {
        timeout: 20_000,
      });
      const value = Number(stdout.trim());
      return Number.isFinite(value) ? value : 0;
    } catch {
      return 0;
    }
  }

  private async fromWatchPage(id: string): Promise<number> {
    try {
      const response = await fetch(`https://www.youtube.com/watch?v=${id}`, {
        headers: { "User-Agent": "Mozilla/5.0 Clipora/1.0" },
      });
      const html = await response.text();
      const match = html.match(/"lengthSeconds":"(\d+)"/);
      return match ? Number(match[1]) : 0;
    } catch {
      return 0;
    }
  }
}

function parseIsoDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { hasBinary } from "../processing/binaries";

@Controller("health")
export class HealthController {
  @Get()
  @SkipThrottle()
  async health() {
    return {
      ok: true,
      service: "clipora-api",
      ffmpeg: await hasBinary("ffmpeg"),
      ytdlp: await hasBinary("yt-dlp"),
      time: new Date().toISOString(),
    };
  }
}

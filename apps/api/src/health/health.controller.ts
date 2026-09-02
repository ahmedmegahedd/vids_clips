import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

@Controller("health")
export class HealthController {
  @Get()
  @SkipThrottle()
  async health() {
    const ffmpeg = await binaryOk("ffmpeg");
    const ytdlp = await binaryOk("yt-dlp");
    return {
      ok: true,
      service: "clipora-api",
      ffmpeg,
      ytdlp,
      time: new Date().toISOString(),
    };
  }
}

async function binaryOk(name: string) {
  try {
    await execFileAsync(name, ["-version"], { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

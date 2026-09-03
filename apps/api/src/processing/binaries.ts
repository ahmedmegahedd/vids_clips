import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const SEARCH_DIRS = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin"];

export function resolveBinary(name: "ffmpeg" | "ffprobe" | "yt-dlp"): string | null {
  if (existsSync(name)) return name;
  for (const dir of SEARCH_DIRS) {
    const candidate = `${dir}/${name}`;
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export function binaryEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PATH: `${SEARCH_DIRS.join(":")}:${process.env.PATH ?? ""}`,
  };
}

export async function hasBinary(name: "ffmpeg" | "ffprobe" | "yt-dlp") {
  const path = resolveBinary(name);
  if (!path) return false;
  const args = name === "yt-dlp" ? ["--version"] : ["-version"];
  try {
    await execFileAsync(path, args, { timeout: 4000 });
    return true;
  } catch {
    return false;
  }
}

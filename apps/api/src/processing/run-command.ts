import { spawn } from "node:child_process";

export class CommandError extends Error {
  constructor(
    message: string,
    public readonly code: "timeout" | "stall" | "failed",
  ) {
    super(message);
  }
}

export function runCommand(
  command: string,
  args: string[],
  options: {
    timeoutMs: number;
    stallMs?: number;
    env?: NodeJS.ProcessEnv;
    onOutput?: (line: string) => void;
  },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: options.env ?? process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let settled = false;
    let stdout = "";
    let stderr = "";
    let lastOutput = Date.now();

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearInterval(stallTimer);
      clearTimeout(timeoutTimer);
      if (error) reject(error);
      else resolve();
    };

    const timeoutTimer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(new CommandError("This video is taking too long to process.", "timeout"));
    }, options.timeoutMs);

    const stallTimer = setInterval(() => {
      if (!options.stallMs) return;
      if (Date.now() - lastOutput > options.stallMs) {
        child.kill("SIGKILL");
        finish(new CommandError("We couldn't keep downloading this video. Please try again.", "stall"));
      }
    }, 5_000);

    const handleChunk = (chunk: Buffer, stream: "out" | "err") => {
      lastOutput = Date.now();
      const text = chunk.toString();
      if (stream === "out") stdout += text;
      else stderr += text;
      if (stdout.length > 20_000) stdout = stdout.slice(-8_000);
      if (stderr.length > 20_000) stderr = stderr.slice(-8_000);
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed) options.onOutput?.(trimmed);
      }
    };

    child.stdout.on("data", (chunk: Buffer) => handleChunk(chunk, "out"));
    child.stderr.on("data", (chunk: Buffer) => handleChunk(chunk, "err"));
    child.on("error", (error) => finish(error));
    child.on("close", (code) => {
      if (code === 0) finish();
      else {
        const detail = (stderr || stdout).split("\n").filter(Boolean).slice(-4).join(" ");
        finish(new CommandError(detail || "Video processing failed.", "failed"));
      }
    });
  });
}

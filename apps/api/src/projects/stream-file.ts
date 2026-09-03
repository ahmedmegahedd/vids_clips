import { createReadStream, statSync } from "node:fs";
import type { Request, Response } from "express";

function parseRange(header: string | undefined, size: number): { start: number; end: number } | null {
  if (!header?.startsWith("bytes=")) return null;
  const spec = header.slice(6).split(",")[0]?.trim();
  if (!spec) return null;
  const [startStr, endStr] = spec.split("-");
  let start: number;
  let end: number;
  if (startStr === "") {
    const suffix = Number(endStr);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(size - suffix, 0);
    end = size - 1;
  } else {
    start = Number(startStr);
    end = endStr ? Number(endStr) : size - 1;
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start >= size) return null;
  end = Math.min(end, size - 1);
  if (end < start) return null;
  return { start, end };
}

export function streamMediaFile(
  req: Request,
  res: Response,
  path: string,
  options: { contentType: string; filename: string; download: boolean },
) {
  const size = statSync(path).size;
  res.setHeader("Content-Type", options.contentType);
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader(
    "Content-Disposition",
    `${options.download ? "attachment" : "inline"}; filename="${options.filename}"`,
  );
  res.setHeader("Cache-Control", "private, max-age=3600");

  const range = parseRange(req.headers.range, size);
  if (req.headers.range && !range) {
    res.status(416);
    res.setHeader("Content-Range", `bytes */${size}`);
    res.end();
    return;
  }

  if (range) {
    res.status(206);
    res.setHeader("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
    res.setHeader("Content-Length", String(range.end - range.start + 1));
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    createReadStream(path, { start: range.start, end: range.end }).pipe(res);
    return;
  }

  res.setHeader("Content-Length", String(size));
  if (req.method === "HEAD") {
    res.status(200).end();
    return;
  }
  createReadStream(path).pipe(res);
}

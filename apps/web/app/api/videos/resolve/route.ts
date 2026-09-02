import { extractYouTubeId } from "@clipora/shared";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { url } = (await request.json()) as { url?: string };
  const youtubeId = url ? extractYouTubeId(url) : null;
  if (!youtubeId) {
    return NextResponse.json(
      { message: "That link doesn't look right. Please check the YouTube URL and try again." },
      { status: 400 },
    );
  }

  const canonical = `https://www.youtube.com/watch?v=${youtubeId}`;
  const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(canonical)}&format=json`);
  if (!oembedRes.ok) {
    return NextResponse.json(
      { message: "We couldn't find that video. Please make sure it's available." },
      { status: 400 },
    );
  }
  const oembed = (await oembedRes.json()) as {
    title?: string;
    author_name?: string;
    thumbnail_url?: string;
  };

  let durationSeconds = 0;
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    const apiRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${youtubeId}&key=${apiKey}`,
    );
    if (apiRes.ok) {
      const json = (await apiRes.json()) as { items?: Array<{ contentDetails?: { duration?: string } }> };
      const iso = json.items?.[0]?.contentDetails?.duration;
      if (iso) {
        const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (match) {
          durationSeconds = Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
        }
      }
    }
  }
  if (!durationSeconds) {
    try {
      const watch = await fetch(canonical, { headers: { "User-Agent": "Mozilla/5.0 Clipora/1.0" } });
      const html = await watch.text();
      const match = html.match(/"lengthSeconds":"(\d+)"/);
      if (match) durationSeconds = Number(match[1]);
    } catch {
      durationSeconds = 0;
    }
  }

  return NextResponse.json({
    video: {
      youtubeId,
      url: canonical,
      title: oembed.title ?? "YouTube video",
      channelName: oembed.author_name ?? "YouTube",
      thumbnailUrl:
        oembed.thumbnail_url?.replace("hqdefault", "maxresdefault") ??
        `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      durationSeconds: durationSeconds || 60,
    },
  });
}

# Clipora

Premium SaaS for turning long YouTube videos into ready-to-post clips.

**Paste. Customize. Split. Download.**

This repo is a production-oriented monorepo:

- `apps/web` — Next.js 15 (App Router, TypeScript, Tailwind)
- `apps/api` — NestJS API, workers, YouTube ingest, ffmpeg processing
- `packages/shared` — shared types, plans, YouTube URL parsing
- `supabase/migrations` — database, RLS, storage bucket

## Quick start

```bash
npm install
npm run build -w @clipora/shared
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

The API runs on [http://localhost:4000](http://localhost:4000).

Local development uses:

- `DEV_BYPASS_AUTH=true` so you can complete the full flow without Supabase
- `PROCESSOR_MODE=simulated` so clips generate without yt-dlp/ffmpeg

## Production launch checklist

1. Create a Supabase project and run `supabase/migrations/0001_init.sql`.
2. Copy `.env.example` into `apps/web/.env.local` and `apps/api/.env`.
3. Fill in `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_JWT_SECRET`.
4. Set `DEV_BYPASS_AUTH=false`.
5. Add a YouTube Data API key (`YOUTUBE_API_KEY`) for reliable video duration.
6. Install `ffmpeg` and `yt-dlp` on the API host, then set `PROCESSOR_MODE=real`.
7. Deploy `apps/web` to Vercel (or similar) and `apps/api` to a Node host with enough CPU/disk for video jobs.
8. Point `NEXT_PUBLIC_API_URL` and `CORS_ORIGINS` at the live domains.
9. Add Paymob keys (`PAYMOB_SECRET_KEY`, `PAYMOB_PUBLIC_KEY`, `PAYMOB_HMAC_SECRET`, integration IDs) to take live payments in EGP. Without them, checkout uses a demo confirmation so you can walk the full billing UX.
10. Process only videos you own or have permission to use — this is stated in the product and FAQ.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Web + API together |
| `npm run dev:web` | Next.js only |
| `npm run dev:api` | NestJS only |
| `npm run build` | Build all workspaces |

## Architecture

Users paste a YouTube URL. The API resolves metadata, confirms the video, then splits it into clips of the chosen length and aspect ratio. Progress is polled from `/projects/:id`. Finished files are stored in Supabase Storage (`clips` bucket) and can be downloaded individually or as a zip.

Plan limits live in `packages/shared`. Checkout creates a Paymob Intention (or a demo payment if keys are missing), then HMAC-verified webhooks activate the subscription.

Set the Paymob webhook URL to `https://your-api/billing/webhooks/paymob` and the redirect URL is handled automatically as `/checkout/complete`.
# vids_clips

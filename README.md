# ChartMatch

A chart-reading trainer. See 60 candles of a real historical stock chart, call whether the next 30 go up or down, get the verdict — plus a nudge when you start trading on tilt.

**Educational training only — not financial advice.**

## What's in here

| File | Purpose |
|------|---------|
| `index.html` | The whole app (landing + Arena). Self-contained, no build step. |
| `build-library.mjs` | Fetches real daily equities from Stooq → writes `chart-library.json`. |
| `.nojekyll` | Tells GitHub Pages to serve files as-is. |

The app now ships with **real historical data embedded** in `index.html` (≈200 reps + 9 boss levels from Yahoo Finance), so it works out of the box on any host — no separate data file needed.

## Refresh the chart data

Real data is baked into `index.html`. To pull newer/more charts, regenerate and re-embed (Node 18+):

```bash
npm install yahoo-finance2     # one time
node build-library.mjs         # writes chart-library.json
```

Then re-embed that JSON into `index.html` (replace the `window.CL=…` block) — or hand the file to Claude and it'll do the swap.

## Deploy — GitHub Pages

1. Push this repo to GitHub (repo must be **public** for Pages on a free account).
2. Repo → **Settings → Pages**.
3. **Source:** Deploy from a branch → **Branch:** `main` → **Folder:** `/ (root)` → Save.
4. ~1 minute later it's live at `https://<username>.github.io/chartmatch/`.

## Deploy — custom domain (recommended next step)

Connect this repo to **Cloudflare Pages** for a custom domain + CDN, with auto-deploy on every push:

1. Cloudflare dashboard → Workers & Pages → Create → Pages → **Connect to Git** → pick this repo.
2. Framework preset: **None**. Build command: *(empty)*. Output directory: `/`.
3. Deploy, then add your domain under **Custom domains**.

## Backend & going live

- **`LAUNCH.md`** — running checklist of everything needed to ship as a paid product.
- **`SUPABASE-SETUP.md`** — ~10-min guide to turn on the global leaderboard.
- **`supabase-schema.sql`** — the database table + security policies to run in Supabase.

The leaderboard is built in but dormant until you paste your Supabase URL + anon key into `index.html` (see the setup guide). With them blank, the app runs local-only and never breaks.

## Roadmap to revenue

1. Real data (above) — swap Stooq for a commercially-licensed EOD source (EODHD/Tiingo, ~$10–20/mo) before monetizing.
2. Accounts + saved progress — Supabase (XP/streak currently reset on reload).
3. Payments — Stripe Checkout for Pro (unlimited reps, boss levels, analytics).

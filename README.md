# ChartMatch

A chart-reading trainer. See 60 candles of a real historical stock chart, call whether the next 30 go up or down, get the verdict — plus a nudge when you start trading on tilt.

**Educational training only — not financial advice.**

## What's in here

| File | Purpose |
|------|---------|
| `index.html` | The whole app (landing + Arena). Self-contained, no build step. |
| `build-library.mjs` | Fetches real daily equities from Stooq → writes `chart-library.json`. |
| `.nojekyll` | Tells GitHub Pages to serve files as-is. |

The app runs on **sample data** until a `chart-library.json` sits next to `index.html`.

## Run locally

```bash
npx serve .        # open the printed URL
```

## Generate real chart data

Needs Node 18+ and runs on your own machine (needs internet):

```bash
node build-library.mjs        # writes chart-library.json
git add chart-library.json && git commit -m "Add real chart data" && git push
```

Commit the JSON so the live site serves real charts. The app auto-detects it and turns off sample data.

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

## Roadmap to revenue

1. Real data (above) — swap Stooq for a commercially-licensed EOD source (EODHD/Tiingo, ~$10–20/mo) before monetizing.
2. Accounts + saved progress — Supabase (XP/streak currently reset on reload).
3. Payments — Stripe Checkout for Pro (unlimited reps, boss levels, analytics).

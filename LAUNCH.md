# ChartMatch — Launch Tracker

A living checklist of what's needed to ship as a live, paid product. Status as of this build.
Legend: ✅ done · 🟡 in progress / partial · ⬜ not started

---

## 1. Data & licensing
- 🟡 **Real chart data** — embedded (Yahoo Finance daily, ~200 reps + 9 bosses). Works, but Yahoo is an *unofficial scraper* — dev/prototype only.
- ⬜ **License a commercial EOD source before charging** — EODHD or Tiingo (~$10–20/mo). Swap `getHistory()` in `build-library.mjs`, re-pull, re-embed. Same pipeline.
- ⬜ **Add volume** — script now captures it; re-pull + re-embed to light up volume bars.
- ⬜ **Longer windows** — current 60-bar history can't show MA200 and only partial MA50. Bump window length for the classic MAs + more context.
- ⬜ **Intraday data (optional)** — separate recent-only pull (1h ≈ 2yr, 15m ≈ 60d, no historical eras) if/when we add intraday timeframes.

## 2. Backend (Supabase)
- 🟡 **Create project + run schema** — schema + RLS written (`supabase-schema.sql`); needs to be created and applied. See `SUPABASE-SETUP.md`.
- 🟡 **Global leaderboard** — client integration built; activates once project URL + anon key are pasted into `index.html`.
- ⬜ **Enable Anonymous sign-ins** in Auth settings (required for the leaderboard MVP).
- ⬜ **Saved progress** — persist XP/streak/accuracy per user (same `profiles` table; wire on load).

## 3. Accounts & auth
- 🟡 **Anonymous auth** — frictionless identity for the leaderboard (one device/browser per user).
- ⬜ **Permanent accounts** — email magic-link or Google OAuth, so progress survives across devices and ties to Pro.
- ⬜ **Convert anon → permanent** on sign-up (link identity).

## 4. Payments / monetization
- ⬜ **Stripe account + Checkout** — subscription for Pro (unlimited reps, boss levels, analytics, indicators).
- ⬜ **Webhook → DB** — a serverless function (Cloudflare/Vercel) to flip `is_pro` on payment. (Stripe *secret* key must live server-side, never in the client.)
- ⬜ **Pricing decision** — test below $29 (try $9–12/mo or a founding-member one-time).
- ⬜ **Gating** — decide free vs Pro (e.g., N reps/day free; bosses + analytics + indicators Pro).

## 5. Leaderboard hardening (anti-cheat)
- ⬜ **Server-side score validation** — scoring is client-side today, so even with auth the board is honor-system. Move scoring/validation server-side (RPC that replays calls, or signed results) before it matters.
- ⬜ **Captcha on anonymous sign-in** (Supabase recommends this to curb abuse/bots).
- ⬜ **Display-name moderation** — profanity filter + length/uniqueness limits.
- ⬜ **Rate limiting** on score writes.
- ⬜ **Anonymous-user cleanup** — purge inactive anon users (Supabase has a 30-day cleanup pattern).

## 6. Legal & compliance
- ✅ **"Not financial advice" disclaimer** — present in the footer.
- ⬜ **Terms of Service + Privacy Policy** — required before taking payments / collecting users.
- ⬜ **Operating entity** — run through your Canadian corp; confirm tax handling for subscriptions.
- ⬜ **Data-source attribution / ToS compliance** — confirm the licensed data vendor allows display to end users.

## 7. Domain, hosting & ops
- 🟡 **Repo on GitHub** — set up; static deploy.
- ⬜ **Custom domain + hosting** — Cloudflare Pages / Netlify, free SSL, connect domain.
- ⬜ **Analytics** — privacy-friendly (Plausible / Umami) to watch the funnel.
- ⬜ **Error monitoring** — Sentry or similar.
- ⬜ **Secrets management** — Stripe/EODHD keys server-side only.

## 8. Product polish before launch
- ⬜ **Boss window tuning** — make each crisis's defining move land in the *hidden* portion (Black Monday currently shows the crash in the visible history).
- ⬜ **Session recap** screen (calls, accuracy, best streak, XP earned).
- ⬜ **Onboarding** — a 20-second "how it works" for first-timers.
- ⬜ **Mobile QA pass** — drawing tools + indicator panes on small screens.

---

*Living doc — we update this as we go.*

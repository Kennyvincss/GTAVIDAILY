# GTA VI Daily

Daily Grand Theft Auto VI news, videos, creators and gear, built as a media business with these revenue streams: advertising, sponsored content, creator promotion, affiliate marketing and newsletter sponsorship. All analytics are first-party and measured from real visitors. The app contains no simulated figures.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Prisma + PostgreSQL · Tailwind CSS 4

## Getting started

```bash
cp .env.example .env          # then set ADMIN_PASSWORD and ADMIN_SESSION_SECRET
docker compose up -d          # local PostgreSQL matching the URLs in .env.example
npm install
npm run db:deploy             # apply migrations
npm run db:seed               # categories, ad placements, one starter article (no analytics data)
npm run dev
```

The site runs at http://localhost:3000. The admin panel is at http://localhost:3000/admin.

## Monetisation features

| Stream | Public side | Admin |
| --- | --- | --- |
| **Advertising** | `<AdSlot>` placements: homepage banner, between trending items, sidebar, in-article (after paragraph 3). Each one is labelled "Advertisement" and renders nothing when it has no ad. | `/admin/ads`: enable/disable each placement, pick a mode (auto / direct / AdSense), set the AdSense slot ID, and manage direct-sold campaigns with dates, weights and stats. |
| **Sponsored content** | Sponsored articles and videos show a "Sponsored · Sponsor" badge on every card, a disclosure box naming the sponsor, `rel="sponsored"` links and "(Sponsored)" in the page title. Sponsored articles carry no third-party in-article ads. | Sponsorship fields on the article and video editors. The sponsor name is required. |
| **Creator promotion** | `/creators` lists featured creators. `/creators/promote` shows packages and prices and takes requests. Featured creators also appear on the homepage and sidebar, labelled as promoted. | `/admin/promotions`: set package pricing, then approve or reject requests and start featuring. Starting a promotion creates or features the creator for the paid period and can book the payment in the ledger. Promotions expire automatically. `/admin/creators` handles manual curation. |
| **Affiliate marketing** | `/gear`, plus picks on the homepage and sidebar, with disclosures. Links go through `/go/<slug>`, which records the click and redirects. | `/admin/affiliates`: store the full tracking URL from your network. An optional `{clickId}` placeholder is replaced with the click's ID so it can be passed as a network sub-ID. |
| **Newsletter** | Signup forms in the footer, sidebar, articles, homepage and `/newsletter`. Each one-click unsubscribe link carries a per-subscriber token. | `/admin/newsletter`: subscribers by signup form, sponsored placements per issue (top/middle/bottom, fee, status, record payment), CSV export with unsubscribe URLs, and an **issue builder** that renders the day's stories plus scheduled sponsors as email HTML with UTM-tagged links. |
| **Revenue ledger** | — | `/admin/revenue`: money actually received, per stream (for example AdSense payouts, affiliate payments, sponsored-article invoices). |

## Analytics (`/admin`)

The first-party tracker (`src/components/Tracker.tsx` → `POST /api/track`) records:

- **Daily and monthly unique visitors** via an anonymous first-party cookie (`gvd_vid`, a random UUID). Distinct counts come from the `DailyVisitor` and `MonthlyVisitor` tables.
- **Most visited articles**, top pages and **most popular categories**.
- **Traffic sources** from the first page of each visit: Search, Social, Referral, Newsletter, Campaign (UTM) or Direct. Top referrers are listed too.
- **Most watched videos**: plays and completions reported by the YouTube IFrame Player API on this site.
- **Newsletter subscriptions** per day, plus unsubscribes.
- **Ad performance**: viewable impressions (≥50% on screen for 1s) and clicks for direct campaigns, and slot views for AdSense units. AdSense earnings and RPM exist only in your AdSense account, so the dashboard says so and does not estimate them.
- **Affiliate clicks** per product. Sales and commission are reported by each network.
- **Recorded revenue** from the ledger.

Bots, signed-in admins and visitors sending Do Not Track or Global Privacy Control are not recorded. IP addresses are not stored. Every panel shows an empty state until real data exists.

## Getting content in

- **Add a clip from a link** (`/admin/videos`): paste a link to an X post with a video, or a YouTube, YouTube Shorts, TikTok or Twitch clip. The clip goes to Videos, embedded with the platform's own player. The person who posted it is added to Creators (or matched to an existing creator) and credited on the clip, with a link to their channel and a `/creators/<name>` page listing their clips. Titles and creators come from the public oEmbed endpoints of X, YouTube and TikTok. X clips show as embedded posts through X's official widget; their thumbnails and creator avatars come from the public FxTwitter API when it's available, and are optional. Twitch shares no titles without an API key, so its channel is read from the link (`twitch.tv/<channel>/clip/…`). Creators added this way are listed, not featured; "Featured" stays a paid placement.
- **Auto-import** (`/admin/auto-import`), YouTube: connect a channel by pasting its URL (e.g. `https://www.youtube.com/@RockstarGames`). New uploads arrive as drafts for review, or are published straight away if auto-publish is on. A keyword filter can limit imports to GTA content on general gaming channels. It uses YouTube's public channel feeds, so no API key is needed. Embedding public videos is allowed by YouTube's terms.
- **Auto-import, X accounts:** connect an account by its profile link; new posts with a video become clips credited to the account. This uses the official X API, which has been pay-per-use since 2026. Set `X_BEARER_TOKEN` from the X Developer Console. Each check asks only for posts newer than the last one seen, so you pay only for new posts. **Import all past GTA 6 videos** (when connecting, or per account) uses X's full-archive search (`from:<account> has:media` plus your keywords, since February 2022) when the API plan allows it, so you pay only for matching posts. Otherwise it scans the account's latest 500, 1,000 or 3,200 posts. It runs in roughly 40-second chunks; large accounts show **Continue importing**. Clips are embedded from X, never downloaded or re-hosted. Without a token, paste X post links on the Videos page instead, one per line, up to 25 at a time.
- **Researched articles** (`/admin/starter`): articles in `src/content/articles/` (launch, launch week, and one file per day under `daily/`). On every deploy, `prisma/import-articles.ts` adds any new ones, published unless `CONTENT_AUTOPUBLISH=false`. Each slug is added only once, so articles you delete stay deleted (the admin page can bring them back). Run `npm run content:check` to validate slugs, categories, sources and internal links.
- **Cover images:** articles without their own cover get generated art (a Vice City sunset in the category's colours) from `/covers/<slug>`. On the site it's art only; social share previews add the headline. Fonts are bundled under `src/assets/fonts` (SIL Open Font License).
- **News inbox** (`/admin/inbox`): follow news sites by pasting a homepage or feed URL; the RSS/Atom feed is found automatically. Headlines matching your keywords become story ideas. **Write about this** creates an article draft with a source credit, which you write in your own words. Never republish the source's text.
- **When sources are checked:** about hourly in the background while an admin has these pages open, on demand with **Check now**, and daily through the Vercel cron in `vercel.json`. The cron needs `CRON_SECRET` set on the project; Vercel then sends it automatically.

## Deploying to Vercel

1. **Create a Postgres database.** Neon, Supabase and Vercel Postgres (Storage tab in your Vercel project) all work and have free tiers. Copy two connection strings:
   - the **pooled** URL, for `DATABASE_URL`
   - the **direct** (non-pooled) URL, for `DIRECT_URL`. If your provider only gives one URL, use it for both.
2. **Import the repo.** Go to vercel.com → Add New → Project → pick `GTAVIDAILY`. The framework is detected as Next.js. Leave the build settings as they are: Vercel runs the `vercel-build` script automatically.
3. **Set environment variables** (Project → Settings → Environment Variables):

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | pooled Postgres URL |
   | `DIRECT_URL` | direct Postgres URL |
   | `ADMIN_PASSWORD` | a strong password for `/admin` |
   | `ADMIN_SESSION_SECRET` | a long random string, e.g. the output of `openssl rand -hex 32` |
   | `NEXT_PUBLIC_SITE_URL` | your site URL, e.g. `https://gtavidaily.vercel.app` (update it if you add a domain) |
   | `NEXT_PUBLIC_ADSENSE_CLIENT` | leave empty until AdSense approves you |
   | `CRON_SECRET` | any long random string; enables the daily content import |
   | `X_BEARER_TOKEN` | optional: X API Bearer Token, enables importing from X accounts |

4. **Deploy.** Each build applies database migrations and makes sure the categories and ad placements exist. No sample content is created in production.
5. **Go to `/admin`,** sign in, and publish your first article. Then set your creator promotion prices in **Creator promotion**.
6. **Optional: custom domain.** Project → Settings → Domains. Afterwards, update `NEXT_PUBLIC_SITE_URL` and redeploy.

Other hosts (Railway, Render, Fly.io, a VPS) work the same way: set the variables, then run `npm run db:deploy && npx tsx prisma/seed.ts --structure-only && npm run build && npm start`.

## Google AdSense

1. Set `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-…` and redeploy. This adds the AdSense script, the `google-adsense-account` meta tag and `/ads.txt`.
2. Create ad units in AdSense and paste each slot ID into a placement at `/admin/ads`.
3. Serving to the EEA/UK/Switzerland requires a Google-certified consent management platform (CMP). Enable Google's own CMP under AdSense → Privacy & messaging, or add another certified CMP, before going live.

## Adding a revenue stream later

The monetisation layer lives in `src/lib/monetisation/`:

- `streams.ts` is the **revenue stream registry**. Each stream declares a key, label, admin link and a `metrics()` function that returns measured values. The analytics dashboard, the revenue ledger and the stream cards all read from it.
- `placements.ts` holds the ad placement definitions. Add a key here, drop `<AdSlot placement="…">` into a page, and the placement is created on the next visit to `/admin/ads`.
- `ads.ts` decides what fills a slot: a live direct campaign first, then AdSense.

To add, say, memberships: create the tables and pages, add a `{ key: "memberships", … }` entry to `REVENUE_STREAMS` with real metrics, and record payments against that key. A payment-provider webhook (for example Stripe) can write `RevenueEntry` rows the same way promotions and newsletter sponsorships already do.

## Production notes

- **Database changes:** edit `prisma/schema.prisma`, then run `npm run db:migrate -- --name <change>` locally and commit the new folder in `prisma/migrations`. Deploys apply it automatically.
- **Admin:** one shared password (`ADMIN_PASSWORD`) and an HMAC-signed, httpOnly session cookie (`ADMIN_SESSION_SECRET`, 16+ chars). Article Markdown is rendered without sanitising, so give admin access only to trusted editors.
- **Times** in the admin forms and analytics are UTC.
- This is an independent fan site. It is not affiliated with Rockstar Games or Take-Two Interactive.

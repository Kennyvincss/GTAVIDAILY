import "server-only";
import { db } from "@/lib/db";
import { findOrCreateCreator, titleFromPost } from "@/lib/clip-info";
import { matchesKeywords } from "./parse";
import type { RunResult } from "./run";

/**
 * X account importer, using the official X API v2 (pay-per-use since 2026).
 * Each check asks only for posts newer than the last one seen, so you pay
 * for new posts, not for re-reading old ones.
 */

const API = "https://api.x.com/2";
const RESERVED = new Set(["home", "i", "explore", "search", "settings", "messages", "notifications", "compose", "intent", "share"]);

export function xConfigured(): boolean {
  return !!process.env.X_BEARER_TOKEN?.trim();
}

/** Accept @name, name, or an x.com / twitter.com profile URL. */
export function parseXUsername(input: string): string | null {
  const s = input.trim();
  let candidate = s.replace(/^@/, "");
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      const host = u.hostname.replace(/^(www|mobile)\./, "").toLowerCase();
      if (!["x.com", "twitter.com"].includes(host)) return null;
      candidate = u.pathname.split("/").filter(Boolean)[0] ?? "";
    } catch {
      return null;
    }
  }
  if (!/^\w{1,15}$/.test(candidate) || RESERVED.has(candidate.toLowerCase())) return null;
  return candidate;
}

export class XApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/** Keywords used to spot GTA 6 posts when an account has no keywords of its own. */
export const DEFAULT_GTA6_KEYWORDS = "GTA 6, GTA6, GTA VI, GTAVI, Grand Theft Auto, Leonida, Vice City";

async function xGet<T>(path: string): Promise<T> {
  const token = process.env.X_BEARER_TOKEN?.trim();
  if (!token) throw new Error("X isn't connected yet: add X_BEARER_TOKEN to your environment variables.");
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (res.status === 401) throw new XApiError("X rejected the API key (401). Check X_BEARER_TOKEN.", 401);
  if (res.status === 402) throw new XApiError("Your X API credits have run out (402). Top up in the X Developer Console.", 402);
  if (res.status === 403) throw new XApiError("X refused access (403). Check your app's permissions and credits in the X Developer Console.", 403);
  if (res.status === 429) throw new XApiError("X rate limit reached (429). It will continue on the next try.", 429);
  if (!res.ok) throw new XApiError(`X API answered HTTP ${res.status}.`, res.status);
  const json = (await res.json()) as T & { errors?: { detail?: string; title?: string }[] };
  return json;
}

type XUser = { id: string; name: string; username: string; profile_image_url?: string };

export async function lookupXUser(username: string): Promise<XUser> {
  const r = await xGet<{ data?: XUser; errors?: { detail?: string }[] }>(
    `/users/by/username/${encodeURIComponent(username)}?user.fields=profile_image_url`,
  );
  if (!r.data) throw new Error(r.errors?.[0]?.detail ?? `Couldn't find @${username} on X.`);
  return r.data;
}

type TimelineResponse = {
  data?: { id: string; text: string; created_at?: string; attachments?: { media_keys?: string[] } }[];
  includes?: { media?: { media_key: string; type: string; preview_image_url?: string }[] };
  meta?: { newest_id?: string; result_count?: number };
};

type XSourceRow = NonNullable<Awaited<ReturnType<typeof db.xSource.findUnique>>>;

const MEDIA_PARAMS = {
  expansions: "attachments.media_keys",
  "media.fields": "type,preview_image_url",
  "tweet.fields": "created_at",
};

/** Save the video posts in an API page that match the keywords. Returns how many were new. */
async function saveVideoPosts(src: XSourceRow, page: TimelineResponse, keywords: string): Promise<number> {
  const media = new Map((page.includes?.media ?? []).map((m) => [m.media_key, m]));
  const candidates = (page.data ?? [])
    .map((t) => {
      const video = (t.attachments?.media_keys ?? []).map((k) => media.get(k)).find((m) => m?.type === "video");
      return video ? { t, video } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x && matchesKeywords(keywords, x.t.text));
  if (!candidates.length) return 0;
  const existing = new Set(
    (
      await db.video.findMany({
        where: { platform: "x", externalId: { in: candidates.map((c) => c.t.id) } },
        select: { externalId: true },
      })
    ).map((v) => v.externalId),
  );
  const fresh = candidates.filter((c) => !existing.has(c.t.id));
  if (!fresh.length) return 0;
  const creator = await findOrCreateCreator({ name: src.name, url: `https://x.com/${src.username}`, platform: "x" });
  for (const { t, video } of fresh) {
    await db.video.create({
      data: {
        title: titleFromPost(t.text) ?? `Clip by @${src.username}`,
        platform: "x",
        externalId: t.id,
        sourceUrl: `https://x.com/${src.username}/status/${t.id}`,
        thumbnailUrl: video.preview_image_url ?? null,
        description: "",
        status: src.autoPublish ? "published" : "draft",
        publishedAt: t.created_at ? new Date(t.created_at) : new Date(),
        categoryId: src.categoryId,
        creatorId: creator.id,
        xSourceId: src.id,
      },
    });
  }
  return fresh.length;
}

/** X search query: this account's posts with media that mention any keyword. */
export function buildSearchQuery(username: string, keywords: string): string {
  const base = `from:${username} has:media -is:retweet -is:reply`;
  const terms: string[] = [];
  for (const k of keywords.split(",").map((t) => t.trim()).filter(Boolean)) {
    const term = /[\s"]/.test(k) ? `"${k.replace(/"/g, "")}"` : k;
    // X caps query length; keep within 512 characters.
    if (base.length + 4 + [...terms, term].join(" OR ").length > 512) break;
    terms.push(term);
  }
  return terms.length ? `${base} (${terms.join(" OR ")})` : base;
}

export type BackfillResult = { added: number; scanned: number; done: boolean; mode: string; error?: string };

/**
 * Import an account's past GTA 6 videos, in chunks that fit a serverless time
 * limit. Prefers X's full-archive search (you pay only for matching posts);
 * if the API plan doesn't include it, scans the account's recent posts instead
 * (X allows the latest ~3,200), up to the source's backfillLimit.
 * Call repeatedly until `done`.
 */
export async function backfillXSource(id: string, budgetMs = 40_000): Promise<BackfillResult> {
  let src = await db.xSource.findUnique({ where: { id } });
  if (!src) return { added: 0, scanned: 0, done: true, mode: "none", error: "Source not found." };
  if (src.backfillStatus === "done") {
    src = await db.xSource.update({
      where: { id },
      data: { backfillStatus: "running", backfillCursor: null, backfillMode: null, backfillScanned: 0, backfillAdded: 0 },
    });
  }
  const keywords = src.keywords.trim() || DEFAULT_GTA6_KEYWORDS;
  const started = Date.now();
  let mode = src.backfillMode ?? "search";
  let cursor = src.backfillCursor;
  let scanned = src.backfillScanned;
  let added = src.backfillAdded;
  let done = false;
  let error: string | undefined;

  try {
    while (!done && Date.now() - started < budgetMs) {
      let page: TimelineResponse;
      if (mode === "search") {
        const params = new URLSearchParams({
          query: buildSearchQuery(src.username, keywords),
          max_results: "100",
          // GTA VI was first officially confirmed in February 2022.
          start_time: "2022-02-01T00:00:00Z",
          ...MEDIA_PARAMS,
        });
        if (cursor) params.set("next_token", cursor);
        try {
          page = await xGet<TimelineResponse & { meta?: { next_token?: string } }>(`/tweets/search/all?${params}`);
        } catch (e) {
          // Full-archive search isn't in every API plan: fall back to scanning the timeline.
          if (e instanceof XApiError && (e.status === 400 || e.status === 403 || e.status === 404) && !cursor) {
            mode = "timeline";
            continue;
          }
          throw e;
        }
      } else {
        const remaining = src.backfillLimit - scanned;
        if (remaining <= 0) {
          done = true;
          break;
        }
        const params = new URLSearchParams({
          max_results: String(Math.max(5, Math.min(100, remaining))),
          exclude: "replies,retweets",
          ...MEDIA_PARAMS,
        });
        if (cursor) params.set("pagination_token", cursor);
        page = await xGet<TimelineResponse & { meta?: { next_token?: string } }>(`/users/${src.userId}/tweets?${params}`);
      }
      scanned += page.data?.length ?? 0;
      added += await saveVideoPosts(src, page, keywords);
      cursor = (page.meta as { next_token?: string } | undefined)?.next_token ?? null;
      if (!cursor || (mode === "timeline" && scanned >= src.backfillLimit)) done = true;
    }
  } catch (e) {
    error = e instanceof Error ? e.message.slice(0, 300) : "Unknown error.";
  }

  await db.xSource.update({
    where: { id },
    data: {
      backfillStatus: done ? "done" : "running",
      backfillMode: mode,
      backfillCursor: done ? null : cursor,
      backfillScanned: scanned,
      backfillAdded: added,
      lastError: error ?? null,
    },
  });
  return { added, scanned, done, mode, error };
}

export async function runXSource(id: string): Promise<RunResult> {
  const src = await db.xSource.findUnique({ where: { id } });
  if (!src) return { source: id, added: 0, error: "Source not found." };
  try {
    const params = new URLSearchParams({
      max_results: src.lastSeenId ? "100" : "10",
      exclude: "replies,retweets",
      ...MEDIA_PARAMS,
    });
    if (src.lastSeenId) params.set("since_id", src.lastSeenId);
    const r = await xGet<TimelineResponse>(`/users/${src.userId}/tweets?${params}`);
    const added = await saveVideoPosts(src, r, src.keywords);
    await db.xSource.update({
      where: { id },
      data: { lastFetchedAt: new Date(), lastError: null, lastSeenId: r.meta?.newest_id ?? src.lastSeenId },
    });
    return { source: `@${src.username}`, added };
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 300) : "Unknown error.";
    await db.xSource.update({ where: { id }, data: { lastFetchedAt: new Date(), lastError: msg } });
    return { source: `@${src.username}`, added: 0, error: msg };
  }
}

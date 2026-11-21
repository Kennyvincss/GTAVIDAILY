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

async function xGet<T>(path: string): Promise<T> {
  const token = process.env.X_BEARER_TOKEN?.trim();
  if (!token) throw new Error("X isn't connected yet: add X_BEARER_TOKEN to your environment variables.");
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (res.status === 401) throw new Error("X rejected the API key (401). Check X_BEARER_TOKEN.");
  if (res.status === 402) throw new Error("Your X API credits have run out (402). Top up in the X Developer Console.");
  if (res.status === 403) throw new Error("X refused access (403). Check your app's permissions and credits in the X Developer Console.");
  if (res.status === 429) throw new Error("X rate limit reached (429). It will retry on the next check.");
  if (!res.ok) throw new Error(`X API answered HTTP ${res.status}.`);
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

export async function runXSource(id: string): Promise<RunResult> {
  const src = await db.xSource.findUnique({ where: { id } });
  if (!src) return { source: id, added: 0, error: "Source not found." };
  try {
    const params = new URLSearchParams({
      max_results: src.lastSeenId ? "100" : "10",
      exclude: "replies,retweets",
      expansions: "attachments.media_keys",
      "media.fields": "type,preview_image_url",
      "tweet.fields": "created_at",
    });
    if (src.lastSeenId) params.set("since_id", src.lastSeenId);
    const r = await xGet<TimelineResponse>(`/users/${src.userId}/tweets?${params}`);
    const media = new Map((r.includes?.media ?? []).map((m) => [m.media_key, m]));

    const candidates = (r.data ?? [])
      .map((t) => {
        const video = (t.attachments?.media_keys ?? []).map((k) => media.get(k)).find((m) => m?.type === "video");
        return video ? { t, video } : null;
      })
      .filter((x): x is NonNullable<typeof x> => !!x && matchesKeywords(src.keywords, x.t.text));

    const existing = new Set(
      (
        await db.video.findMany({
          where: { platform: "x", externalId: { in: candidates.map((c) => c.t.id) } },
          select: { externalId: true },
        })
      ).map((v) => v.externalId),
    );
    const fresh = candidates.filter((c) => !existing.has(c.t.id));
    const creator = fresh.length
      ? await findOrCreateCreator({ name: src.name, url: `https://x.com/${src.username}`, platform: "x" })
      : null;
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
          creatorId: creator?.id,
          xSourceId: src.id,
        },
      });
    }
    await db.xSource.update({
      where: { id },
      data: { lastFetchedAt: new Date(), lastError: null, lastSeenId: r.meta?.newest_id ?? src.lastSeenId },
    });
    return { source: `@${src.username}`, added: fresh.length };
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 300) : "Unknown error.";
    await db.xSource.update({ where: { id }, data: { lastFetchedAt: new Date(), lastError: msg } });
    return { source: `@${src.username}`, added: 0, error: msg };
  }
}

import "server-only";
import { db } from "@/lib/db";
import { fetchText } from "./fetch";
import { matchesKeywords, parseFeed } from "./parse";
import { findOrCreateCreator } from "@/lib/clip-info";
import { channelFeedUrl } from "./youtube";
import { runXSource, xConfigured } from "./x";

export type RunResult = { source: string; added: number; error?: string };

function message(e: unknown): string {
  if (e instanceof Error) return e.name === "TimeoutError" ? "Timed out after 12 seconds." : e.message.slice(0, 300);
  return "Unknown error.";
}

/** Import new uploads from one YouTube channel. Existing videos (by YouTube ID) are never duplicated. */
export async function runYouTubeSource(id: string): Promise<RunResult> {
  const src = await db.youTubeSource.findUnique({ where: { id } });
  if (!src) return { source: id, added: 0, error: "Source not found." };
  try {
    const { text } = await fetchText(channelFeedUrl(src.channelId));
    const feed = parseFeed(text);
    const candidates = feed.items.filter(
      (i) => i.youtubeId && matchesKeywords(src.keywords, i.title, i.summary),
    );
    const existing = new Set(
      (
        await db.video.findMany({
          where: { platform: "youtube", externalId: { in: candidates.map((c) => c.youtubeId!) } },
          select: { externalId: true },
        })
      ).map((v) => v.externalId),
    );
    const fresh = candidates.filter((c) => !existing.has(c.youtubeId!));
    // Credit the channel as the creator of everything imported from it.
    const creator = fresh.length
      ? await findOrCreateCreator({
          name: feed.title || src.title,
          url: `https://www.youtube.com/channel/${src.channelId}`,
          platform: "youtube",
        })
      : null;
    for (const v of fresh) {
      await db.video.create({
        data: {
          title: v.title.slice(0, 200),
          platform: "youtube",
          externalId: v.youtubeId!,
          sourceUrl: `https://www.youtube.com/watch?v=${v.youtubeId}`,
          creatorId: creator?.id,
          description: v.summary.slice(0, 5000),
          status: src.autoPublish ? "published" : "draft",
          publishedAt: v.publishedAt ?? new Date(),
          categoryId: src.categoryId,
          importSourceId: src.id,
        },
      });
    }
    await db.youTubeSource.update({
      where: { id },
      data: { lastFetchedAt: new Date(), lastError: null, title: feed.title || src.title },
    });
    return { source: src.title, added: fresh.length };
  } catch (e) {
    await db.youTubeSource.update({ where: { id }, data: { lastFetchedAt: new Date(), lastError: message(e) } });
    return { source: src.title, added: 0, error: message(e) };
  }
}

/** Pull new items from one news feed into the inbox. */
export async function runFeedSource(id: string): Promise<RunResult> {
  const src = await db.feedSource.findUnique({ where: { id } });
  if (!src) return { source: id, added: 0, error: "Source not found." };
  try {
    const { text } = await fetchText(src.url);
    const feed = parseFeed(text);
    const items = feed.items
      .filter((i) => matchesKeywords(src.keywords, i.title, i.summary))
      .map((i) => ({
        sourceId: src.id,
        guid: i.guid.slice(0, 500),
        title: i.title.slice(0, 300),
        link: i.link.slice(0, 1000),
        summary: i.summary,
        publishedAt: i.publishedAt,
      }));
    const { count } = await db.feedItem.createMany({ data: items, skipDuplicates: true });
    await db.feedSource.update({
      where: { id },
      data: { lastFetchedAt: new Date(), lastError: null, siteUrl: src.siteUrl ?? feed.siteUrl },
    });
    return { source: src.name, added: count };
  } catch (e) {
    await db.feedSource.update({ where: { id }, data: { lastFetchedAt: new Date(), lastError: message(e) } });
    return { source: src.name, added: 0, error: message(e) };
  }
}

/**
 * Refresh every active source not fetched in the last `staleMinutes`.
 * Called by the daily cron and in the background when admins open the import pages.
 */
export async function refreshStale(staleMinutes = 60): Promise<RunResult[]> {
  const cutoff = new Date(Date.now() - staleMinutes * 60_000);
  const stale = { active: true, OR: [{ lastFetchedAt: null }, { lastFetchedAt: { lt: cutoff } }] };
  const [yt, feeds, xs] = await Promise.all([
    db.youTubeSource.findMany({ where: stale, select: { id: true } }),
    db.feedSource.findMany({ where: stale, select: { id: true } }),
    xConfigured() ? db.xSource.findMany({ where: stale, select: { id: true } }) : Promise.resolve([]),
  ]);
  const results: RunResult[] = [];
  // Run a few at a time to stay well inside serverless time limits.
  const jobs = [
    ...yt.map((s) => () => runYouTubeSource(s.id)),
    ...feeds.map((s) => () => runFeedSource(s.id)),
    ...xs.map((s) => () => runXSource(s.id)),
  ];
  for (let i = 0; i < jobs.length; i += 4) {
    results.push(...(await Promise.all(jobs.slice(i, i + 4).map((j) => j()))));
  }
  return results;
}

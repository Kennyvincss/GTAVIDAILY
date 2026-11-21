// Shared by the build-time import script and the admin page, so no "server-only"
// or "@/" imports here.
import type { PrismaClient } from "@prisma/client";
import { ALL_PACK_ARTICLES } from "../content/articles";

export type PackImportResult = { added: number; recorded: number; skipped: number };

/**
 * Add every shipped article that hasn't been added before. Newest batch ends
 * up on top of the homepage. Articles that already exist (same slug) are only
 * recorded, never changed; ones an admin deleted are never re-added.
 */
export async function importPackArticles(
  db: PrismaClient,
  opts: { publish: boolean; slugs?: string[] },
): Promise<PackImportResult> {
  const done = new Set((await db.contentPackImport.findMany({ select: { slug: true } })).map((r) => r.slug));
  const candidates = ALL_PACK_ARTICLES.filter(
    (a) => (opts.slugs ? opts.slugs.includes(a.slug) : true) && !done.has(a.slug),
  );
  // Rank: newest batch first, then article order within the batch.
  candidates.sort((x, y) => y.batchIndex - x.batchIndex || x.index - y.index);

  const categories = new Map((await db.category.findMany({ select: { id: true, slug: true } })).map((c) => [c.slug, c.id]));
  const now = Date.now();
  let added = 0;
  let recorded = 0;
  for (const [rank, a] of candidates.entries()) {
    const exists = await db.article.findUnique({ where: { slug: a.slug }, select: { id: true } });
    if (!exists) {
      await db.article.create({
        data: {
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt,
          body: a.body,
          categoryId: categories.get(a.category) ?? null,
          status: opts.publish ? "published" : "draft",
          publishedAt: opts.publish ? new Date(now - rank * 60_000) : null,
        },
      });
      added++;
    } else {
      recorded++;
    }
    await db.contentPackImport.upsert({ where: { slug: a.slug }, update: {}, create: { slug: a.slug } });
  }
  return { added, recorded, skipped: ALL_PACK_ARTICLES.length - candidates.length };
}

/** Whether shipped articles go live automatically (default) or arrive as drafts. */
export function autoPublishPack(): boolean {
  return (process.env.CONTENT_AUTOPUBLISH ?? "true").toLowerCase() !== "false";
}

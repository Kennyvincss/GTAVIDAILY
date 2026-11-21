"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { ALL_PACK_ARTICLES } from "@/content/articles";
import { importPackArticles } from "@/lib/content-pack";

/** Add every researched article that hasn't been added yet (published). */
export async function importAllStarters() {
  await requireAdmin();
  await importPackArticles(db, { publish: true });
  revalidatePath("/", "layout");
}

/** Add one article, or bring back one that was deleted. */
export async function importStarter(slug: string) {
  await requireAdmin();
  if (!ALL_PACK_ARTICLES.some((a) => a.slug === slug)) return;
  await db.contentPackImport.deleteMany({ where: { slug } });
  await importPackArticles(db, { publish: true, slugs: [slug] });
  revalidatePath("/", "layout");
}

/** Publish every researched article that is still a draft, keeping batch order. */
export async function publishAllStarters() {
  await requireAdmin();
  const drafts = await db.article.findMany({
    where: { slug: { in: ALL_PACK_ARTICLES.map((a) => a.slug) }, status: "draft" },
    select: { id: true, slug: true },
  });
  const rank = new Map(
    [...ALL_PACK_ARTICLES]
      .sort((x, y) => y.batchIndex - x.batchIndex || x.index - y.index)
      .map((a, i) => [a.slug, i]),
  );
  const now = Date.now();
  for (const d of drafts) {
    await db.article.update({
      where: { id: d.id },
      data: { status: "published", publishedAt: new Date(now - (rank.get(d.slug) ?? 0) * 60_000) },
    });
  }
  revalidatePath("/", "layout");
}

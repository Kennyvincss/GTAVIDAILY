import "server-only";
import { db } from "@/lib/db";
import { lastDays } from "@/lib/dates";

export function articleWhere() {
  return { status: "published", publishedAt: { lte: new Date() } };
}

export const articleCardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  publishedAt: true,
  isSponsored: true,
  sponsorName: true,
  featured: true,
  category: { select: { name: true, slug: true } },
} as const;

export function getLatestArticles(take = 12, skip = 0, categoryId?: string) {
  return db.article.findMany({
    where: { ...articleWhere(), ...(categoryId ? { categoryId } : {}) },
    orderBy: { publishedAt: "desc" },
    select: articleCardSelect,
    take,
    skip,
  });
}

/**
 * Trending = most viewed published articles over the last 7 days, from real
 * page views. Returns an empty list when there is no traffic yet; callers
 * should fall back to "Latest" and label it as such.
 */
export async function getTrendingArticles(limit = 6) {
  const days = lastDays(7);
  const rows = await db.pageView.groupBy({
    by: ["articleId"],
    where: { day: { gte: days[0] }, articleId: { not: null } },
    _count: { articleId: true },
    orderBy: { _count: { articleId: "desc" } },
    take: limit * 2,
  });
  if (!rows.length) return [];
  const articles = await db.article.findMany({
    where: { ...articleWhere(), id: { in: rows.map((r) => r.articleId!) } },
    select: articleCardSelect,
  });
  return rows
    .map((r) => articles.find((a) => a.id === r.articleId))
    .filter((a): a is NonNullable<typeof a> => !!a)
    .slice(0, limit);
}

export function getVideos(take = 8, opts: { featuredOnly?: boolean; categoryId?: string } = {}) {
  return db.video.findMany({
    where: {
      status: "published",
      publishedAt: { lte: new Date() },
      ...(opts.featuredOnly ? { featured: true } : {}),
      ...(opts.categoryId ? { categoryId: opts.categoryId } : {}),
    },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    include: { category: { select: { name: true, slug: true } } },
    take,
  });
}

export function getAffiliateProducts(take?: number) {
  return db.affiliateProduct.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take,
  });
}

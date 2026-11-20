import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { addDays, lastDays, lastMonths } from "@/lib/dates";
import { REVENUE_STREAMS } from "@/lib/monetisation/streams";
import { PLACEMENTS } from "@/lib/monetisation/placements";

export type Series = { key: string; value: number }[];

function fill(keys: string[], rows: { key: string; value: number }[]): Series {
  const m = new Map(rows.map((r) => [r.key, r.value]));
  return keys.map((k) => ({ key: k, value: m.get(k) ?? 0 }));
}

async function countDistinctVisitors(fromDay: string, toDay: string): Promise<number> {
  const rows = await db.$queryRaw<{ c: bigint | number }[]>(
    Prisma.sql`SELECT COUNT(DISTINCT "visitorId") AS c FROM "DailyVisitor" WHERE "day" >= ${fromDay} AND "day" <= ${toDay}`,
  );
  return Number(rows[0]?.c ?? 0);
}

export async function getDashboard(days: number) {
  const dayKeys = lastDays(days);
  const fromDay = dayKeys[0];
  const toDay = dayKeys[dayKeys.length - 1];
  const from = new Date(`${fromDay}T00:00:00.000Z`);
  const monthKeys = lastMonths(12);
  const inRange = { day: { gte: fromDay, lte: toDay } };

  const [
    dailyVisitorRows,
    pageViewRows,
    monthlyRows,
    uniqueVisitors,
    totalPageViews,
    articleRows,
    pathRows,
    videoRows,
    sourceRows,
    referrerRows,
    categoryRows,
    subsActive,
    subsNewRows,
    subsUnsub,
    adRows,
    campaignRows,
    affiliateRows,
    revenueRows,
  ] = await Promise.all([
    db.dailyVisitor.groupBy({ by: ["day"], where: inRange, _count: { _all: true } }),
    db.pageView.groupBy({ by: ["day"], where: inRange, _count: { _all: true } }),
    db.monthlyVisitor.groupBy({ by: ["month"], where: { month: { gte: monthKeys[0] } }, _count: { _all: true } }),
    countDistinctVisitors(fromDay, toDay),
    db.pageView.count({ where: inRange }),
    db.pageView.groupBy({
      by: ["articleId"],
      where: { ...inRange, articleId: { not: null } },
      _count: { articleId: true },
      orderBy: { _count: { articleId: "desc" } },
      take: 10,
    }),
    db.pageView.groupBy({
      by: ["path"],
      where: inRange,
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
    db.videoEvent.groupBy({ by: ["videoId", "type"], where: inRange, _count: { _all: true } }),
    db.pageView.groupBy({ by: ["source"], where: { ...inRange, isEntry: true }, _count: { _all: true } }),
    db.pageView.groupBy({
      by: ["referrerHost"],
      where: { ...inRange, isEntry: true, referrerHost: { not: null } },
      _count: { referrerHost: true },
      orderBy: { _count: { referrerHost: "desc" } },
      take: 10,
    }),
    db.pageView.groupBy({
      by: ["categoryId"],
      where: { ...inRange, categoryId: { not: null } },
      _count: { categoryId: true },
      orderBy: { _count: { categoryId: "desc" } },
      take: 10,
    }),
    db.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
    db.newsletterSubscriber.groupBy({ by: ["day"], where: inRange, _count: { _all: true } }),
    db.newsletterSubscriber.count({ where: { unsubscribedAt: { gte: from } } }),
    db.adEvent.groupBy({ by: ["placementKey", "type"], where: inRange, _count: { _all: true } }),
    db.adEvent.groupBy({
      by: ["campaignId", "type"],
      where: { ...inRange, campaignId: { not: null } },
      _count: { _all: true },
    }),
    db.affiliateClick.groupBy({
      by: ["productId"],
      where: inRange,
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: 10,
    }),
    db.revenueEntry.groupBy({
      by: ["streamKey", "currency"],
      where: { receivedAt: { gte: from, lt: addDays(new Date(`${toDay}T00:00:00.000Z`), 1) } },
      _sum: { amountCents: true },
    }),
  ]);

  // Resolve names for grouped IDs.
  const videoIds = [...new Set(videoRows.map((r) => r.videoId))];
  const campaignIds = [...new Set(campaignRows.map((r) => r.campaignId!))];
  const [articles, videos, categories, campaigns, products] = await Promise.all([
    db.article.findMany({
      where: { id: { in: articleRows.map((r) => r.articleId!) } },
      select: { id: true, title: true, slug: true, isSponsored: true },
    }),
    db.video.findMany({ where: { id: { in: videoIds } }, select: { id: true, title: true, isSponsored: true } }),
    db.category.findMany({ where: { id: { in: categoryRows.map((r) => r.categoryId!) } } }),
    db.adCampaign.findMany({
      where: { id: { in: campaignIds } },
      select: { id: true, advertiser: true, title: true, placementKey: true },
    }),
    db.affiliateProduct.findMany({
      where: { id: { in: affiliateRows.map((r) => r.productId) } },
      select: { id: true, name: true, merchant: true },
    }),
  ]);

  const videoStats = new Map<string, { plays: number; completes: number }>();
  for (const r of videoRows) {
    const s = videoStats.get(r.videoId) ?? { plays: 0, completes: 0 };
    if (r.type === "play") s.plays += r._count._all;
    if (r.type === "complete") s.completes += r._count._all;
    videoStats.set(r.videoId, s);
  }

  const adByPlacement = PLACEMENTS.map((p) => {
    const get = (t: string) =>
      adRows.find((r) => r.placementKey === p.key && r.type === t)?._count._all ?? 0;
    return {
      key: p.key,
      name: p.name,
      impressions: get("impression"),
      clicks: get("click"),
      adsenseViews: get("adsense_view"),
    };
  });

  const adByCampaign = campaigns
    .map((c) => {
      const get = (t: string) => campaignRows.find((r) => r.campaignId === c.id && r.type === t)?._count._all ?? 0;
      return { ...c, impressions: get("impression"), clicks: get("click") };
    })
    .sort((a, b) => b.impressions - a.impressions);

  const range = { fromDay, toDay, from };
  const streamMetrics = await Promise.all(
    REVENUE_STREAMS.map(async (s) => ({
      key: s.key,
      label: s.label,
      adminHref: s.adminHref,
      metrics: await s.metrics(range),
    })),
  );

  return {
    range,
    days,
    uniqueVisitors,
    totalPageViews,
    dailyVisitors: fill(
      dayKeys,
      dailyVisitorRows.map((r) => ({ key: r.day, value: r._count._all })),
    ),
    dailyPageViews: fill(
      dayKeys,
      pageViewRows.map((r) => ({ key: r.day, value: r._count._all })),
    ),
    monthlyVisitors: fill(
      monthKeys,
      monthlyRows.map((r) => ({ key: r.month, value: r._count._all })),
    ),
    topArticles: articleRows
      .map((r) => ({ views: r._count.articleId, article: articles.find((a) => a.id === r.articleId) }))
      .filter((r) => r.article),
    topPaths: pathRows.map((r) => ({ path: r.path, views: r._count.path })),
    topVideos: [...videoStats.entries()]
      .map(([id, s]) => ({ ...s, video: videos.find((v) => v.id === id) }))
      .filter((r) => r.video)
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 10),
    sources: sourceRows.map((r) => ({ source: r.source, visits: r._count._all })).sort((a, b) => b.visits - a.visits),
    referrers: referrerRows.map((r) => ({ host: r.referrerHost!, visits: r._count.referrerHost })),
    categories: categoryRows
      .map((r) => ({ views: r._count.categoryId, category: categories.find((c) => c.id === r.categoryId) }))
      .filter((r) => r.category),
    newsletter: {
      active: subsActive,
      newInPeriod: subsNewRows.reduce((s, r) => s + r._count._all, 0),
      unsubscribedInPeriod: subsUnsub,
      daily: fill(
        dayKeys,
        subsNewRows.map((r) => ({ key: r.day, value: r._count._all })),
      ),
    },
    adByPlacement,
    adByCampaign,
    affiliate: affiliateRows
      .map((r) => ({ clicks: r._count.productId, product: products.find((p) => p.id === r.productId) }))
      .filter((r) => r.product),
    revenue: revenueRows.map((r) => ({
      streamKey: r.streamKey,
      currency: r.currency,
      amountCents: r._sum.amountCents ?? 0,
    })),
    streamMetrics,
  };
}

export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

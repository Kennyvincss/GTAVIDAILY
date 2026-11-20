import "server-only";
import { db } from "@/lib/db";
import { formatNumber, percent } from "@/lib/format";

/**
 * Revenue stream registry.
 *
 * Every monetisation feature registers itself here. The analytics dashboard,
 * the revenue ledger and the admin navigation all read from this list, so a
 * new stream (memberships, merch, events, paid guides…) only needs:
 *   1. its own tables/pages, and
 *   2. an entry here with a `metrics` function returning real, measured values.
 *
 * Metrics must come from recorded data. Never return estimates or projections.
 */

export type StreamMetric = { label: string; value: string; hint?: string };

export type MetricsRange = { fromDay: string; toDay: string; from: Date };

export type RevenueStream = {
  key: string;
  label: string;
  description: string;
  adminHref: string;
  metrics: (range: MetricsRange) => Promise<StreamMetric[]>;
};

export const REVENUE_STREAMS: RevenueStream[] = [
  {
    key: "advertising",
    label: "Advertising",
    description: "Direct-sold campaigns and Google AdSense across site placements.",
    adminHref: "/admin/ads",
    async metrics({ fromDay, toDay }) {
      const where = { day: { gte: fromDay, lte: toDay } };
      const [imps, clicks, adsenseViews, live] = await Promise.all([
        db.adEvent.count({ where: { ...where, type: "impression" } }),
        db.adEvent.count({ where: { ...where, type: "click" } }),
        db.adEvent.count({ where: { ...where, type: "adsense_view" } }),
        db.adCampaign.count({
          where: {
            active: true,
            startsAt: { lte: new Date() },
            OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
          },
        }),
      ]);
      return [
        { label: "Direct impressions", value: formatNumber(imps) },
        { label: "Direct clicks", value: formatNumber(clicks), hint: `CTR ${percent(clicks, imps)}` },
        { label: "AdSense slot views", value: formatNumber(adsenseViews), hint: "Earnings are reported in AdSense" },
        { label: "Live campaigns", value: formatNumber(live) },
      ];
    },
  },
  {
    key: "sponsored",
    label: "Sponsored content",
    description: "Paid articles and featured videos, labelled as sponsored.",
    adminHref: "/admin/articles",
    async metrics({ fromDay, toDay }) {
      const sponsoredArticles = await db.article.findMany({
        where: { isSponsored: true },
        select: { id: true },
      });
      const sponsoredVideos = await db.video.findMany({ where: { isSponsored: true }, select: { id: true } });
      const [views, plays] = await Promise.all([
        sponsoredArticles.length
          ? db.pageView.count({
              where: { day: { gte: fromDay, lte: toDay }, articleId: { in: sponsoredArticles.map((a) => a.id) } },
            })
          : 0,
        sponsoredVideos.length
          ? db.videoEvent.count({
              where: {
                day: { gte: fromDay, lte: toDay },
                type: "play",
                videoId: { in: sponsoredVideos.map((v) => v.id) },
              },
            })
          : 0,
      ]);
      return [
        { label: "Sponsored articles", value: formatNumber(sponsoredArticles.length) },
        { label: "Sponsored article views", value: formatNumber(views) },
        { label: "Sponsored videos", value: formatNumber(sponsoredVideos.length) },
        { label: "Sponsored video plays", value: formatNumber(plays) },
      ];
    },
  },
  {
    key: "creator_promotion",
    label: "Creator promotion",
    description: "Paid featured placements for gaming creators.",
    adminHref: "/admin/promotions",
    async metrics({ from }) {
      const [pending, approved, active, newRequests] = await Promise.all([
        db.promotionRequest.count({ where: { status: "pending" } }),
        db.promotionRequest.count({ where: { status: "approved" } }),
        db.promotionRequest.count({ where: { status: "active" } }),
        db.promotionRequest.count({ where: { createdAt: { gte: from } } }),
      ]);
      return [
        { label: "New requests (period)", value: formatNumber(newRequests) },
        { label: "Pending review", value: formatNumber(pending) },
        { label: "Awaiting payment", value: formatNumber(approved) },
        { label: "Active promotions", value: formatNumber(active) },
      ];
    },
  },
  {
    key: "affiliate",
    label: "Affiliate marketing",
    description: "Tracked outbound clicks to gaming products.",
    adminHref: "/admin/affiliates",
    async metrics({ fromDay, toDay }) {
      const [clicks, products] = await Promise.all([
        db.affiliateClick.count({ where: { day: { gte: fromDay, lte: toDay } } }),
        db.affiliateProduct.count({ where: { active: true } }),
      ]);
      return [
        { label: "Affiliate clicks", value: formatNumber(clicks), hint: "Conversions are reported by each network" },
        { label: "Active products", value: formatNumber(products) },
      ];
    },
  },
  {
    key: "newsletter",
    label: "Newsletter sponsorship",
    description: "Sponsored placements inside newsletter issues.",
    adminHref: "/admin/newsletter",
    async metrics() {
      const [subs, scheduled, sent] = await Promise.all([
        db.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
        db.newsletterSponsorship.count({ where: { status: "scheduled" } }),
        db.newsletterSponsorship.count({ where: { status: "sent" } }),
      ]);
      return [
        { label: "Active subscribers", value: formatNumber(subs) },
        { label: "Scheduled sponsorships", value: formatNumber(scheduled) },
        { label: "Sent sponsorships", value: formatNumber(sent) },
      ];
    },
  },
  {
    key: "other",
    label: "Other",
    description: "Anything not covered above (one-off deals, licensing…).",
    adminHref: "/admin/revenue",
    async metrics() {
      return [];
    },
  },
];

export function getStream(key: string): RevenueStream | undefined {
  return REVENUE_STREAMS.find((s) => s.key === key);
}

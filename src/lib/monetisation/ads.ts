import "server-only";
import { db } from "@/lib/db";
import { site } from "@/lib/site";

export type AdDecision =
  | {
      kind: "direct";
      placementKey: string;
      campaign: { id: string; advertiser: string; title: string; body: string | null; imageUrl: string | null };
    }
  | { kind: "adsense"; placementKey: string; client: string; slotId: string; format: string };

/**
 * Decide what fills a placement for this request.
 * Priority: live direct-sold campaign → Google AdSense (when configured) → nothing.
 */
export async function selectAd(placementKey: string): Promise<AdDecision | null> {
  const now = new Date();
  const placement = await db.adPlacement.findUnique({
    where: { key: placementKey },
    include: {
      campaigns: {
        where: { active: true, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      },
    },
  });
  if (!placement || !placement.enabled) return null;

  if (placement.mode !== "adsense" && placement.campaigns.length > 0) {
    const c = weightedPick(placement.campaigns);
    return {
      kind: "direct",
      placementKey,
      campaign: { id: c.id, advertiser: c.advertiser, title: c.title, body: c.body, imageUrl: c.imageUrl },
    };
  }

  if (placement.mode !== "direct" && site.adsenseClient && placement.adsenseSlotId) {
    return {
      kind: "adsense",
      placementKey,
      client: site.adsenseClient,
      slotId: placement.adsenseSlotId,
      format: placement.adsenseFormat,
    };
  }
  return null;
}

function weightedPick<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + Math.max(1, i.weight), 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= Math.max(1, item.weight);
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

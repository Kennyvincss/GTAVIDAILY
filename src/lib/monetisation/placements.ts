import { db } from "@/lib/db";

/**
 * Ad placement definitions. To add a placement: add it here, render
 * <AdSlot placement="your_key" /> where it should appear, and it will be
 * created in the database the next time the Ads admin page loads.
 */
export const PLACEMENTS = [
  {
    key: "homepage_banner",
    name: "Homepage banner",
    description: "Full-width leaderboard below the homepage hero.",
    adsenseFormat: "horizontal",
  },
  {
    key: "trending_inline",
    name: "Between trending content",
    description: "Native slot inside the homepage Trending list.",
    adsenseFormat: "fluid",
  },
  {
    key: "sidebar",
    name: "Sidebar",
    description: "Sticky slot in the right-hand sidebar on articles and listings.",
    adsenseFormat: "vertical",
  },
  {
    key: "in_article",
    name: "In-article",
    description: "Placed inside article bodies after the third paragraph.",
    adsenseFormat: "fluid",
  },
] as const;

export type PlacementKey = (typeof PLACEMENTS)[number]["key"];

export const PLACEMENT_KEYS = PLACEMENTS.map((p) => p.key) as readonly string[];

export function isPlacementKey(k: string): k is PlacementKey {
  return PLACEMENT_KEYS.includes(k);
}

/** Create any missing placements without touching admin-edited ones. */
export async function ensurePlacements(): Promise<void> {
  for (const p of PLACEMENTS) {
    await db.adPlacement.upsert({
      where: { key: p.key },
      update: {},
      create: { key: p.key, name: p.name, description: p.description, adsenseFormat: p.adsenseFormat },
    });
  }
}

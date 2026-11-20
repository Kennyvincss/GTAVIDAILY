import "server-only";
import { db } from "@/lib/db";

/** Creators currently featured (manually, or via an active paid promotion). */
export function getFeaturedCreators(limit = 6) {
  const now = new Date();
  return db.creator.findMany({
    where: { featured: true, OR: [{ featuredUntil: null }, { featuredUntil: { gt: now } }] },
    orderBy: [{ featuredUntil: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export const CREATOR_PLATFORMS = ["youtube", "twitch", "tiktok", "kick", "other"] as const;

export const REQUEST_STATUSES = ["pending", "approved", "active", "completed", "rejected"] as const;

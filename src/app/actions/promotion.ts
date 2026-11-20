"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { safeUrl } from "@/lib/format";
import { CREATOR_PLATFORMS } from "@/lib/monetisation/creators";

export type PromotionState = { ok: boolean; message: string } | null;

const schema = z.object({
  packageId: z.string().min(1),
  creatorName: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  platform: z.enum(CREATOR_PLATFORMS),
  channelUrl: z.string().trim().max(500),
  avatarUrl: z.string().trim().max(500).optional(),
  bio: z.string().trim().max(280).optional(),
  message: z.string().trim().max(2000).optional(),
  website: z.string().max(0).optional(), // honeypot
});

export async function requestPromotion(_prev: PromotionState, form: FormData): Promise<PromotionState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: "Please check the form — some fields are missing or invalid." };
  const d = parsed.data;

  const channelUrl = safeUrl(d.channelUrl);
  if (!channelUrl) return { ok: false, message: "Channel URL must start with http:// or https://." };
  const avatarUrl = d.avatarUrl ? safeUrl(d.avatarUrl) : null;

  const pkg = await db.promotionPackage.findFirst({ where: { id: d.packageId, active: true } });
  if (!pkg) return { ok: false, message: "That package is no longer available." };

  const recent = await db.promotionRequest.count({
    where: { email: d.email, status: "pending", createdAt: { gte: new Date(Date.now() - 86_400_000) } },
  });
  if (recent >= 3) return { ok: false, message: "You already have requests awaiting review." };

  await db.promotionRequest.create({
    data: {
      packageId: pkg.id,
      priceCents: pkg.priceCents,
      currency: pkg.currency,
      durationDays: pkg.durationDays,
      creatorName: d.creatorName,
      email: d.email,
      platform: d.platform,
      channelUrl,
      avatarUrl,
      bio: d.bio ?? "",
      message: d.message ?? "",
    },
  });
  return {
    ok: true,
    message: "Request received. We review every channel and will email you with next steps and payment details.",
  };
}

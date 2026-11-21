"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { addDays } from "@/lib/dates";
import { parseMoneyToCents, safeUrl, slugify } from "@/lib/format";
import { CREATOR_PLATFORMS } from "@/lib/monetisation/creators";
import { bool, int, optDate, optStr, str } from "./form";
import type { FormState } from "./content";

const CURRENCIES = ["GBP", "USD", "EUR"];

// ── Pricing packages ────────────────────────────────────────────────────────

export async function savePackage(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(form, "id");
  const name = str(form, "name", 80);
  const priceCents = parseMoneyToCents(str(form, "price"));
  const durationDays = int(form, "durationDays");
  if (!name) return { error: "Name is required." };
  if (priceCents == null) return { error: "Enter a price like 49.00." };
  if (durationDays < 1 || durationDays > 365) return { error: "Duration must be 1–365 days." };
  const currency = CURRENCIES.includes(str(form, "currency")) ? str(form, "currency") : "GBP";
  const data = {
    name,
    description: str(form, "description", 400),
    priceCents,
    currency,
    durationDays,
    active: bool(form, "active"),
    sortOrder: int(form, "sortOrder"),
  };
  if (id) await db.promotionPackage.update({ where: { id }, data });
  else await db.promotionPackage.create({ data });
  revalidatePath("/admin/promotions");
  return {};
}

export async function deletePackage(form: FormData) {
  await requireAdmin();
  await db.promotionPackage.delete({ where: { id: str(form, "id") } });
  revalidatePath("/admin/promotions");
}

// ── Request workflow: pending → approved → active → completed (or rejected) ─

export async function reviewRequest(decision: "approved" | "rejected", form: FormData) {
  await requireAdmin();
  const id = str(form, "id");
  if (decision !== "approved" && decision !== "rejected") return;
  await db.promotionRequest.update({
    where: { id },
    data: { status: decision, reviewedAt: new Date(), adminNotes: str(form, "adminNotes", 2000) },
  });
  revalidatePath("/admin/promotions");
}

/** Start the paid placement: create/feature the creator and optionally book the payment. */
export async function activateRequest(form: FormData) {
  await requireAdmin();
  const id = str(form, "id");
  const req = await db.promotionRequest.findUnique({ where: { id } });
  if (!req || (req.status !== "approved" && req.status !== "pending")) return;

  const startsAt = optDate(form, "startsAt") ?? new Date();
  const endsAt = addDays(startsAt, req.durationDays);

  let creator =
    (req.creatorId && (await db.creator.findUnique({ where: { id: req.creatorId } }))) ||
    (await db.creator.findFirst({ where: { channelUrl: req.channelUrl } }));
  const featuredUntil = creator?.featuredUntil && creator.featuredUntil > endsAt ? creator.featuredUntil : endsAt;
  if (creator) {
    creator = await db.creator.update({
      where: { id: creator.id },
      data: { featured: true, featuredUntil, avatarUrl: creator.avatarUrl ?? req.avatarUrl, bio: creator.bio || req.bio },
    });
  } else {
    let slug = slugify(req.creatorName) || "creator";
  if (slug === "promote") slug = "promote-creator"; // /creators/promote is the request form
    if (await db.creator.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
    creator = await db.creator.create({
      data: {
        name: req.creatorName,
        slug,
        platform: req.platform,
        channelUrl: req.channelUrl,
        avatarUrl: req.avatarUrl,
        bio: req.bio,
        featured: true,
        featuredUntil,
      },
    });
  }

  await db.promotionRequest.update({
    where: { id },
    data: { status: "active", creatorId: creator.id, startsAt, endsAt, reviewedAt: req.reviewedAt ?? new Date() },
  });

  if (bool(form, "recordPayment") && req.priceCents > 0) {
    const already = await db.revenueEntry.findFirst({ where: { sourceType: "promotion_request", sourceId: id } });
    if (!already) {
      await db.revenueEntry.create({
        data: {
          streamKey: "creator_promotion",
          amountCents: req.priceCents,
          currency: req.currency,
          description: `Creator promotion: ${req.creatorName} (${req.durationDays} days)`,
          sourceType: "promotion_request",
          sourceId: id,
        },
      });
    }
  }
  revalidatePath("/", "layout");
}

export async function endRequest(form: FormData) {
  await requireAdmin();
  const id = str(form, "id");
  const req = await db.promotionRequest.findUnique({ where: { id } });
  if (!req || req.status !== "active") return;
  await db.promotionRequest.update({ where: { id }, data: { status: "completed", endsAt: new Date() } });
  if (req.creatorId) {
    const otherActive = await db.promotionRequest.count({
      where: { creatorId: req.creatorId, status: "active", NOT: { id } },
    });
    if (!otherActive) await db.creator.update({ where: { id: req.creatorId }, data: { featured: false, featuredUntil: null } });
  }
  revalidatePath("/", "layout");
}

// ── Creators (manual curation) ──────────────────────────────────────────────

export async function saveCreator(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(form, "id");
  const name = str(form, "name", 80);
  const channelUrl = safeUrl(str(form, "channelUrl", 500));
  if (!name) return { error: "Name is required." };
  if (!channelUrl) return { error: "Channel URL must be http(s)." };
  const platform = (CREATOR_PLATFORMS as readonly string[]).includes(str(form, "platform")) ? str(form, "platform") : "other";
  const avatarRaw = optStr(form, "avatarUrl", 500);
  const data = {
    name,
    platform,
    channelUrl,
    avatarUrl: avatarRaw ? safeUrl(avatarRaw) : null,
    bio: str(form, "bio", 280),
    featured: bool(form, "featured"),
    featuredUntil: optDate(form, "featuredUntil"),
  };
  if (id) {
    await db.creator.update({ where: { id }, data });
  } else {
    let slug = slugify(name) || "creator";
  if (slug === "promote") slug = "promote-creator"; // /creators/promote is the request form
    if (await db.creator.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
    await db.creator.create({ data: { ...data, slug } });
  }
  revalidatePath("/", "layout");
  redirect("/admin/creators");
}

export async function deleteCreator(form: FormData) {
  await requireAdmin();
  await db.creator.delete({ where: { id: str(form, "id") } });
  redirect("/admin/creators");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { parseMoneyToCents, safeUrl } from "@/lib/format";
import { optDate, optStr, str } from "./form";
import type { FormState } from "./content";

export async function saveSponsorship(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(form, "id");
  const sponsor = str(form, "sponsor", 120);
  const headline = str(form, "headline", 160);
  const body = str(form, "body", 1000);
  const targetUrl = safeUrl(str(form, "targetUrl", 1000));
  const issueDate = optDate(form, "issueDate");
  if (!sponsor || !headline || !body) return { error: "Sponsor, headline and copy are required." };
  if (!targetUrl) return { error: "Link must be http(s)." };
  if (!issueDate) return { error: "Choose the issue date." };
  const priceRaw = str(form, "price");
  const priceCents = priceRaw ? parseMoneyToCents(priceRaw) : null;
  if (priceRaw && priceCents == null) return { error: "Enter a price like 150.00." };
  const imageRaw = optStr(form, "imageUrl", 1000);
  const data = {
    sponsor,
    headline,
    body,
    targetUrl,
    imageUrl: imageRaw ? safeUrl(imageRaw) : null,
    issueDate,
    position: ["top", "middle", "bottom"].includes(str(form, "position")) ? str(form, "position") : "top",
    priceCents,
    currency: ["GBP", "USD", "EUR"].includes(str(form, "currency")) ? str(form, "currency") : "GBP",
  };
  if (id) await db.newsletterSponsorship.update({ where: { id }, data });
  else await db.newsletterSponsorship.create({ data });
  redirect("/admin/newsletter");
}

export async function setSponsorshipStatus(form: FormData) {
  await requireAdmin();
  const status = str(form, "status");
  if (!["scheduled", "sent", "cancelled"].includes(status)) return;
  await db.newsletterSponsorship.update({ where: { id: str(form, "id") }, data: { status } });
  revalidatePath("/admin/newsletter");
}

/** Book the agreed sponsorship fee in the revenue ledger once it has actually been paid. */
export async function recordSponsorshipPayment(form: FormData) {
  await requireAdmin();
  const id = str(form, "id");
  const s = await db.newsletterSponsorship.findUnique({ where: { id } });
  if (!s || !s.priceCents) return;
  const already = await db.revenueEntry.findFirst({ where: { sourceType: "newsletter_sponsorship", sourceId: id } });
  if (already) return;
  await db.revenueEntry.create({
    data: {
      streamKey: "newsletter",
      amountCents: s.priceCents,
      currency: s.currency,
      description: `Newsletter sponsorship: ${s.sponsor}`,
      sourceType: "newsletter_sponsorship",
      sourceId: id,
    },
  });
  revalidatePath("/admin/newsletter");
}

export async function deleteSponsorship(form: FormData) {
  await requireAdmin();
  await db.newsletterSponsorship.delete({ where: { id: str(form, "id") } });
  redirect("/admin/newsletter");
}

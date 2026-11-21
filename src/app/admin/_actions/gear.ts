"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { AMAZON_STORES, STARTER_GEAR, amazonSearchUrl } from "@/content/starter-gear";
import { str } from "./form";
import type { FormState } from "./content";

const TAG = /^[\w-]{3,40}$/;

/** Add the selected ready-made gear picks as Amazon affiliate products. Never overwrites existing products. */
export async function importStarterGear(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const domain = str(form, "store");
  if (!AMAZON_STORES[domain]) return { error: "Choose your Amazon store." };
  const tag = str(form, "tag", 40);
  if (tag && !TAG.test(tag)) return { error: "That doesn't look like an Associates tag (e.g. yourname-21)." };
  const picked = new Set(form.getAll("pick").map(String));
  const items = STARTER_GEAR.filter((g) => picked.has(g.slug));
  if (!items.length) return { error: "Tick at least one product." };

  let added = 0;
  for (const g of items) {
    if (await db.affiliateProduct.findUnique({ where: { slug: g.slug } })) continue;
    await db.affiliateProduct.create({
      data: {
        slug: g.slug,
        name: g.name,
        description: g.description,
        category: g.category,
        merchant: AMAZON_STORES[domain],
        affiliateUrl: amazonSearchUrl(domain, g.query, tag || null),
        sortOrder: STARTER_GEAR.indexOf(g),
        active: true,
      },
    });
    added++;
  }
  revalidatePath("/", "layout");
  // Redirect so the confirmation survives the form disappearing once every pick is added.
  redirect(`/admin/affiliates?added=${added}${tag ? "" : "&untagged=1"}`);
}

/** Set (or replace) the Associates tag on every Amazon product link. */
export async function applyAmazonTag(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const tag = str(form, "tag", 40);
  if (!TAG.test(tag)) return { error: "Enter your Associates tag (e.g. yourname-21)." };
  const products = await db.affiliateProduct.findMany({ select: { id: true, affiliateUrl: true } });
  let updated = 0;
  for (const p of products) {
    let u: URL;
    try {
      u = new URL(p.affiliateUrl.replaceAll("{clickId}", "__CLICK__"));
    } catch {
      continue;
    }
    if (!/(^|\.)amazon\.[a-z.]+$/.test(u.hostname)) continue;
    u.searchParams.set("tag", tag);
    await db.affiliateProduct.update({
      where: { id: p.id },
      data: { affiliateUrl: u.toString().replaceAll("__CLICK__", "{clickId}") },
    });
    updated++;
  }
  revalidatePath("/admin/affiliates");
  return { notice: updated ? `Tag “${tag}” applied to ${updated} Amazon link${updated === 1 ? "" : "s"}.` : "No Amazon links found." };
}

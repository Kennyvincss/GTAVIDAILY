"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { safeUrl, slugify } from "@/lib/format";
import { bool, int, optStr, str } from "./form";
import type { FormState } from "./content";

export async function saveProduct(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(form, "id");
  const name = str(form, "name", 120);
  const merchant = str(form, "merchant", 80);
  const rawUrl = str(form, "affiliateUrl", 2000);
  // Validate with the placeholder substituted so {clickId} templates are allowed.
  if (!safeUrl(rawUrl.replaceAll("{clickId}", "x"))) return { error: "Affiliate URL must be a full http(s) URL." };
  if (!name || !merchant) return { error: "Name and merchant are required." };
  const slug = slugify(str(form, "slug") || name);
  const clash = await db.affiliateProduct.findFirst({ where: { slug, NOT: id ? { id } : undefined } });
  if (clash) return { error: "Another product already uses that slug." };
  const imageRaw = optStr(form, "imageUrl", 1000);
  const data = {
    name,
    slug,
    merchant,
    affiliateUrl: rawUrl,
    description: str(form, "description", 400),
    imageUrl: imageRaw ? safeUrl(imageRaw) : null,
    priceText: optStr(form, "priceText", 40),
    category: str(form, "category", 40) || "Gear",
    active: bool(form, "active"),
    sortOrder: int(form, "sortOrder"),
  };
  if (id) await db.affiliateProduct.update({ where: { id }, data });
  else await db.affiliateProduct.create({ data });
  revalidatePath("/", "layout");
  redirect("/admin/affiliates");
}

export async function deleteProduct(form: FormData) {
  await requireAdmin();
  await db.affiliateProduct.delete({ where: { id: str(form, "id") } });
  redirect("/admin/affiliates");
}

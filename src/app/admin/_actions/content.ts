"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { safeUrl, slugify } from "@/lib/format";
import { parseClipUrl } from "@/lib/clips";
import { bool, optDate, optStr, str } from "./form";

export type FormState = { error?: string; notice?: string } | null;

function sponsorFields(form: FormData) {
  const isSponsored = bool(form, "isSponsored");
  const sponsorName = optStr(form, "sponsorName", 120);
  const sponsorUrlRaw = optStr(form, "sponsorUrl", 500);
  const sponsorUrl = sponsorUrlRaw ? safeUrl(sponsorUrlRaw) : null;
  if (isSponsored && !sponsorName) throw new Error("Sponsored content must name the sponsor.");
  if (sponsorUrlRaw && !sponsorUrl) throw new Error("Sponsor URL must be http(s).");
  return {
    isSponsored,
    sponsorName: isSponsored ? sponsorName : null,
    sponsorUrl: isSponsored ? sponsorUrl : null,
    sponsorDisclosure: isSponsored ? optStr(form, "sponsorDisclosure", 500) : null,
  };
}

export async function saveArticle(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(form, "id");
  try {
    const title = str(form, "title", 200);
    if (!title) throw new Error("Title is required.");
    const slug = slugify(str(form, "slug") || title);
    if (!slug) throw new Error("Slug is invalid.");
    const status = str(form, "status") === "published" ? "published" : "draft";
    let publishedAt = optDate(form, "publishedAt");
    if (status === "published" && !publishedAt) publishedAt = new Date();
    const coverRaw = optStr(form, "coverImage", 1000);
    const data = {
      title,
      slug,
      excerpt: str(form, "excerpt", 400),
      body: str(form, "body", 200_000),
      coverImage: coverRaw ? (coverRaw.startsWith("/") && !coverRaw.startsWith("//") ? coverRaw : safeUrl(coverRaw)) : null,
      categoryId: optStr(form, "categoryId"),
      status,
      publishedAt,
      featured: bool(form, "featured"),
      ...sponsorFields(form),
    };
    const clash = await db.article.findFirst({ where: { slug, NOT: id ? { id } : undefined } });
    if (clash) throw new Error("Another article already uses that slug.");
    if (id) await db.article.update({ where: { id }, data });
    else await db.article.create({ data });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save." };
  }
  revalidatePath("/", "layout");
  redirect("/admin/articles");
}

export async function deleteArticle(form: FormData) {
  await requireAdmin();
  await db.article.delete({ where: { id: str(form, "id") } });
  revalidatePath("/", "layout");
  redirect("/admin/articles");
}

export async function saveVideo(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(form, "id");
  try {
    const title = str(form, "title", 200);
    if (!title) throw new Error("Title is required.");
    const clip = parseClipUrl(str(form, "link", 1000));
    if (!clip) throw new Error("Enter a YouTube, TikTok or Twitch clip link.");
    if (!clip.externalId) throw new Error("Paste the full TikTok link (tiktok.com/@user/video/…), not a short link.");
    const data = {
      title,
      platform: clip.platform,
      externalId: clip.externalId,
      sourceUrl: clip.url,
      creatorId: optStr(form, "creatorId"),
      description: str(form, "description", 5000),
      categoryId: optStr(form, "categoryId"),
      status: str(form, "status") === "draft" ? "draft" : "published",
      publishedAt: optDate(form, "publishedAt") ?? new Date(),
      featured: bool(form, "featured"),
      ...sponsorFields(form),
    };
    if (id) await db.video.update({ where: { id }, data });
    else await db.video.create({ data });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save." };
  }
  revalidatePath("/", "layout");
  redirect("/admin/videos");
}

export async function deleteVideo(form: FormData) {
  await requireAdmin();
  await db.video.delete({ where: { id: str(form, "id") } });
  redirect("/admin/videos");
}

export async function createCategory(form: FormData) {
  await requireAdmin();
  const name = str(form, "name", 60);
  const slug = slugify(str(form, "slug") || name);
  if (!name || !slug) return;
  await db.category.upsert({ where: { slug }, update: { name }, create: { name, slug } });
  revalidatePath("/admin/categories");
}

export async function deleteCategory(form: FormData) {
  await requireAdmin();
  await db.category.delete({ where: { id: str(form, "id") } });
  revalidatePath("/admin/categories");
}

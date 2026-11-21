"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { slugify } from "@/lib/format";
import { fetchText } from "@/lib/importers/fetch";
import { discoverFeedUrl, looksLikeFeed, parseFeed } from "@/lib/importers/parse";
import { refreshStale, runFeedSource, runYouTubeSource } from "@/lib/importers/run";
import { resolveChannelId } from "@/lib/importers/youtube";
import { bool, optStr, str } from "./form";
import type { FormState } from "./content";

const err = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
const summarise = (added: number, error?: string) =>
  error ? { error } : { notice: added ? `Imported ${added} new item${added === 1 ? "" : "s"}.` : "Connected. Nothing new to import right now." };

// ── YouTube channels ────────────────────────────────────────────────────────

export async function addYouTubeSource(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  try {
    const channelId = await resolveChannelId(str(form, "channel", 500));
    if (await db.youTubeSource.findUnique({ where: { channelId } })) return { error: "That channel is already connected." };
    const src = await db.youTubeSource.create({
      data: {
        channelId,
        title: channelId,
        keywords: str(form, "keywords", 300),
        autoPublish: bool(form, "autoPublish"),
        categoryId: optStr(form, "categoryId"),
      },
    });
    const r = await runYouTubeSource(src.id);
    revalidatePath("/admin/youtube");
    return summarise(r.added, r.error);
  } catch (e) {
    return { error: err(e) };
  }
}

export async function updateYouTubeSource(form: FormData) {
  await requireAdmin();
  await db.youTubeSource.update({
    where: { id: str(form, "id") },
    data: {
      keywords: str(form, "keywords", 300),
      autoPublish: bool(form, "autoPublish"),
      active: bool(form, "active"),
      categoryId: optStr(form, "categoryId"),
    },
  });
  revalidatePath("/admin/youtube");
}

export async function deleteYouTubeSource(form: FormData) {
  await requireAdmin();
  // Imported videos stay; they just lose the link to the source.
  await db.youTubeSource.delete({ where: { id: str(form, "id") } });
  revalidatePath("/admin/youtube");
}

export async function fetchYouTubeSource(form: FormData) {
  await requireAdmin();
  await runYouTubeSource(str(form, "id"));
  revalidatePath("/admin/youtube");
}

export async function publishVideo(form: FormData) {
  await requireAdmin();
  await db.video.update({ where: { id: str(form, "id") }, data: { status: "published" } });
  revalidatePath("/", "layout");
}

export async function discardVideo(form: FormData) {
  await requireAdmin();
  const v = await db.video.findUnique({ where: { id: str(form, "id") } });
  if (v && v.status === "draft") await db.video.delete({ where: { id: v.id } });
  revalidatePath("/admin/youtube");
}

// ── News feeds ──────────────────────────────────────────────────────────────

export async function addFeedSource(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  try {
    const input = str(form, "url", 1000);
    let { text, finalUrl, contentType } = await fetchText(input);
    let feedUrl = finalUrl;
    if (!looksLikeFeed(text, contentType)) {
      const found = discoverFeedUrl(text, finalUrl);
      if (!found) return { error: "No RSS or Atom feed found on that page. Paste the feed URL directly." };
      ({ text, finalUrl } = await fetchText(found));
      feedUrl = finalUrl;
    }
    const feed = parseFeed(text);
    if (await db.feedSource.findUnique({ where: { url: feedUrl } })) return { error: "That feed is already connected." };
    const src = await db.feedSource.create({
      data: {
        url: feedUrl,
        name: str(form, "name", 80) || feed.title || new URL(feedUrl).hostname,
        siteUrl: feed.siteUrl,
        keywords: form.has("keywords") ? str(form, "keywords", 300) : undefined,
      },
    });
    const r = await runFeedSource(src.id);
    revalidatePath("/admin/inbox");
    return summarise(r.added, r.error);
  } catch (e) {
    return { error: err(e) };
  }
}

export async function updateFeedSource(form: FormData) {
  await requireAdmin();
  await db.feedSource.update({
    where: { id: str(form, "id") },
    data: { name: str(form, "name", 80) || undefined, keywords: str(form, "keywords", 300), active: bool(form, "active") },
  });
  revalidatePath("/admin/inbox");
}

export async function deleteFeedSource(form: FormData) {
  await requireAdmin();
  await db.feedSource.delete({ where: { id: str(form, "id") } });
  revalidatePath("/admin/inbox");
}

export async function fetchFeedSource(form: FormData) {
  await requireAdmin();
  await runFeedSource(str(form, "id"));
  revalidatePath("/admin/inbox");
}

export async function fetchAllNow() {
  await requireAdmin();
  await refreshStale(0);
  revalidatePath("/admin", "layout");
}

/** Turn an inbox item into an article draft that credits the source, then open it in the editor. */
export async function draftFromItem(form: FormData) {
  await requireAdmin();
  const item = await db.feedItem.findUnique({ where: { id: str(form, "id") }, include: { source: true } });
  if (!item) return;
  if (item.articleId && (await db.article.findUnique({ where: { id: item.articleId } }))) {
    redirect(`/admin/articles/${item.articleId}`);
  }
  let slug = slugify(item.title) || "story";
  if (await db.article.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
  const news = await db.category.findUnique({ where: { slug: "news" } });
  const article = await db.article.create({
    data: {
      title: item.title,
      slug,
      excerpt: "",
      status: "draft",
      categoryId: news?.id ?? null,
      body: [
        "<!-- Write this story in your own words: what happened, why it matters for GTA VI, and your take.",
        "     Don't paste text from the source. Delete this note before publishing. -->",
        "",
        "",
        "",
        `*Source: [${item.source.name}](${item.link})*`,
      ].join("\n"),
    },
  });
  await db.feedItem.update({ where: { id: item.id }, data: { status: "drafted", articleId: article.id } });
  redirect(`/admin/articles/${article.id}`);
}

export async function setItemStatus(status: "new" | "dismissed", form: FormData) {
  await requireAdmin();
  await db.feedItem.update({ where: { id: str(form, "id") }, data: { status } });
  revalidatePath("/admin/inbox");
}

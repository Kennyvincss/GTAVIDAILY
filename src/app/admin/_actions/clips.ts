"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { fetchClipInfo, findOrCreateCreator } from "@/lib/clip-info";
import { platformLabel } from "@/lib/clips";
import { db } from "@/lib/db";
import { safeUrl } from "@/lib/format";
import { bool, optStr, str } from "./form";
import type { FormState } from "./content";

/**
 * Paste a clip link: the clip goes to Videos and the person who posted it is
 * added to Creators (or matched to an existing creator) and credited on the clip.
 */
export async function addClip(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const links = [...new Set(str(form, "link", 20_000).split(/[\s,]+/).filter((l) => /^https?:\/\//i.test(l)))];
  if (links.length === 0) return { error: "Paste at least one clip link (starting with https://)." };
  if (links.length === 1) return addOne(links[0], form, false);
  if (links.length > 25) return { error: "Paste up to 25 links at a time." };

  // Several links: custom title/creator fields apply to single links only.
  const added: string[] = [];
  const failed: string[] = [];
  for (const link of links) {
    const r = await addOne(link, form, true);
    if (r?.error) failed.push(`${shorten(link)}: ${r.error}`);
    else added.push(r?.notice ?? link);
  }
  revalidatePath("/", "layout");
  if (added.length === 0) return { error: `None added. ${failed.join(" · ")}` };
  return {
    notice: `Added ${added.length} of ${links.length} clips.${failed.length ? ` Skipped: ${failed.join(" · ")}` : ""}`,
  };
}

const shorten = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").slice(0, 48);

async function addOne(link: string, form: FormData, bulk: boolean): Promise<FormState> {
  try {
    const info = await fetchClipInfo(link);

    const existing = await db.video.findFirst({
      where: { platform: info.platform, externalId: info.externalId },
      select: { title: true },
    });
    if (existing) return { error: `That clip is already in Videos (“${existing.title}”).` };

    const overrideUrl = bulk ? null : optStr(form, "creatorUrl", 500);
    const creatorUrl = overrideUrl ? safeUrl(overrideUrl) : info.authorUrl;
    if (overrideUrl && !creatorUrl) return { error: "Creator channel link must start with https://." };
    const creatorName =
      (bulk ? "" : str(form, "creatorName", 80)) ||
      info.authorName ||
      (creatorUrl ? decodeURIComponent(new URL(creatorUrl).pathname.split("/").filter(Boolean).pop() ?? "") : "");

    const creator =
      creatorUrl && creatorName
        ? await findOrCreateCreator({
            name: creatorName,
            url: creatorUrl,
            platform: info.platform,
            avatarUrl: overrideUrl ? null : info.authorAvatar,
          })
        : null;

    const customTitle = bulk ? "" : str(form, "title", 200);
    const title = customTitle || info.title?.slice(0, 200) || `${platformLabel(info.platform)} clip`;
    const needsTitle = !customTitle && !info.title;

    await db.video.create({
      data: {
        title,
        platform: info.platform,
        externalId: info.externalId,
        sourceUrl: info.sourceUrl,
        thumbnailUrl: info.thumbnailUrl,
        description: "",
        status: bool(form, "publish") ? "published" : "draft",
        publishedAt: new Date(),
        categoryId: optStr(form, "categoryId"),
        creatorId: creator?.id ?? null,
      },
    });
    if (!bulk) revalidatePath("/", "layout");

    const where = bool(form, "publish") ? "published to Videos" : "saved to Videos as a draft";
    const titleTip = needsTitle ? ` ${platformLabel(info.platform)} doesn't share clip titles — open the video in the list below to give it one.` : "";
    if (!creator) {
      return {
        notice: `“${title}” ${where}. The creator couldn't be detected from this link — open the video and pick a creator, or add it again with “Creator channel link” filled in.${titleTip}`,
      };
    }
    return { notice: `“${title}” ${where}, credited to ${creator.name}.${titleTip}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't add that clip." };
  }
}

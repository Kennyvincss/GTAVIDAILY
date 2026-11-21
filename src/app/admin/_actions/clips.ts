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
  try {
    const info = await fetchClipInfo(str(form, "link", 1000));

    const existing = await db.video.findFirst({
      where: { platform: info.platform, externalId: info.externalId },
      select: { title: true },
    });
    if (existing) return { error: `That clip is already in Videos (“${existing.title}”).` };

    const overrideUrl = optStr(form, "creatorUrl", 500);
    const creatorUrl = overrideUrl ? safeUrl(overrideUrl) : info.authorUrl;
    if (overrideUrl && !creatorUrl) return { error: "Creator channel link must start with https://." };
    const creatorName =
      str(form, "creatorName", 80) ||
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

    const customTitle = str(form, "title", 200);
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
    revalidatePath("/", "layout");

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

import "server-only";
import { db } from "@/lib/db";
import { slugify } from "@/lib/format";
import { fetchText } from "@/lib/importers/fetch";
import { normaliseChannelUrl, parseClipUrl, type Platform } from "@/lib/clips";

export type ClipInfo = {
  platform: Platform;
  externalId: string;
  sourceUrl: string;
  title: string | null;
  authorName: string | null;
  authorUrl: string | null;
  thumbnailUrl: string | null;
  authorAvatar?: string | null;
};

async function oembed(endpoint: string): Promise<Record<string, unknown> | null> {
  try {
    const { text } = await fetchText(endpoint);
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/**
 * Look up a clip's title and creator from its link using each platform's
 * public oEmbed endpoint (no API keys). Twitch has no public oEmbed, so the
 * channel comes from the link itself.
 */
export async function fetchClipInfo(link: string): Promise<ClipInfo> {
  let parsed = parseClipUrl(link);
  if (!parsed) throw new Error("That link isn't a YouTube, TikTok or Twitch clip.");

  if (parsed.platform === "tiktok" && !parsed.externalId) {
    const { finalUrl } = await fetchText(parsed.url);
    parsed = parseClipUrl(finalUrl);
    if (!parsed?.externalId) throw new Error("Couldn't open that TikTok short link. Paste the full tiktok.com/@user/video/… link.");
  }
  const externalId = parsed.externalId!;

  if (parsed.platform === "youtube") {
    const o = await oembed(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(parsed.url)}`);
    if (!o) throw new Error("YouTube didn't return details for that video. Is it public and embeddable?");
    return {
      platform: "youtube",
      externalId,
      sourceUrl: parsed.url,
      title: s(o.title),
      authorName: s(o.author_name),
      authorUrl: s(o.author_url),
      thumbnailUrl: null,
    };
  }

  if (parsed.platform === "tiktok") {
    const o = await oembed(`https://www.tiktok.com/oembed?url=${encodeURIComponent(parsed.url)}`);
    const handle = s(o?.author_unique_id) ?? parsed.channel ?? null;
    return {
      platform: "tiktok",
      externalId: s(o?.embed_product_id) ?? externalId,
      sourceUrl: parsed.url,
      title: s(o?.title),
      authorName: s(o?.author_name) ?? (handle ? `@${handle}` : null),
      authorUrl: s(o?.author_url) ?? (handle ? `https://www.tiktok.com/@${handle}` : null),
      thumbnailUrl: s(o?.thumbnail_url),
    };
  }

  if (parsed.platform === "x") return fetchXInfo(externalId, parsed.url, parsed.channel);

  return {
    platform: "twitch",
    externalId,
    sourceUrl: parsed.url,
    title: null,
    authorName: parsed.channel ?? null,
    authorUrl: parsed.channel ? `https://www.twitch.tv/${parsed.channel}` : null,
    thumbnailUrl: null,
  };
}

/** Turn a post's text into a clip title: drop links, hashtags at the end and extra spaces. */
export function titleFromPost(text: string): string | null {
  const t = text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/pic\.twitter\.com\/\S+/g, "")
    .replace(/(\s#\w+)+\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return null;
  return t.length > 110 ? `${t.slice(0, 107).trimEnd()}…` : t;
}

const decode = (h: string) =>
  h
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

/**
 * X posts: creator and text from X's official oEmbed endpoint. X's oEmbed has
 * no thumbnail, so the thumbnail (and avatar) come from the public FxTwitter
 * API when it's available; everything still works without it.
 */
async function fetchXInfo(id: string, url: string, handleFromUrl?: string): Promise<ClipInfo> {
  const [o, fx] = await Promise.all([
    oembed(`https://publish.twitter.com/oembed?omit_script=true&dnt=true&url=${encodeURIComponent(url.replace("://x.com/", "://twitter.com/"))}`),
    oembed(`https://api.fxtwitter.com/status/${id}`),
  ]);
  const tweet = (fx?.tweet ?? null) as Record<string, unknown> | null;
  const author = (tweet?.author ?? null) as Record<string, unknown> | null;
  if (!o && !tweet) throw new Error("X didn't return that post. Check it's public and the link is right.");

  const media = (tweet?.media ?? null) as { videos?: { thumbnail_url?: string }[]; photos?: { url?: string }[] } | null;
  if (tweet && media && !media.videos?.length) {
    throw new Error("That X post doesn't contain a video. Paste the link to a post with a clip.");
  }

  const postHtml = s(o?.html)?.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1];
  const text = s(tweet?.text) ?? (postHtml ? decode(postHtml) : null);
  const handle = s(author?.screen_name) ?? s(o?.author_url)?.split("/").filter(Boolean).pop() ?? handleFromUrl ?? null;

  return {
    platform: "x",
    externalId: id,
    sourceUrl: handle ? `https://x.com/${handle}/status/${id}` : url,
    title: text ? titleFromPost(text) : null,
    authorName: s(author?.name) ?? s(o?.author_name) ?? (handle ? `@${handle}` : null),
    authorUrl: handle ? `https://x.com/${handle}` : null,
    thumbnailUrl: s(media?.videos?.[0]?.thumbnail_url) ?? null,
    authorAvatar: s(author?.avatar_url),
  };
}

/**
 * Find the creator behind a channel, or add them. Matches on the channel URL,
 * then on the same name on the same platform (one channel can have several URL forms).
 * New creators are listed, not featured: featuring stays a paid promotion.
 */
export async function findOrCreateCreator(input: { name: string; url: string; platform: Platform; avatarUrl?: string | null }) {
  const channelUrl = normaliseChannelUrl(input.url);
  const existing =
    (await db.creator.findFirst({ where: { channelUrl: { equals: channelUrl, mode: "insensitive" } } })) ??
    (await db.creator.findFirst({ where: { platform: input.platform, name: { equals: input.name, mode: "insensitive" } } }));
  if (existing) {
    if (!existing.avatarUrl && input.avatarUrl) {
      return db.creator.update({ where: { id: existing.id }, data: { avatarUrl: input.avatarUrl } });
    }
    return existing;
  }
  let slug = slugify(input.name.replace(/^@/, "")) || "creator";
  if (slug === "promote") slug = "promote-creator"; // /creators/promote is the request form
  if (await db.creator.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
  return db.creator.create({
    data: { name: input.name.slice(0, 80), slug, platform: input.platform, channelUrl, avatarUrl: input.avatarUrl ?? null },
  });
}

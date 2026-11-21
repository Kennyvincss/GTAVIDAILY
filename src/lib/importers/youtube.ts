import "server-only";
import { fetchText } from "./fetch";

export function channelFeedUrl(channelId: string) {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
}

const CHANNEL_ID = /^UC[\w-]{22}$/;

/**
 * Resolve a channel ID from a bare ID, a /channel/UC… URL, or a handle/legacy
 * URL (youtube.com/@name, /c/name, /user/name), which is looked up on YouTube.
 */
export async function resolveChannelId(input: string): Promise<string> {
  const s = input.trim();
  if (CHANNEL_ID.test(s)) return s;
  if (/^@[\w.-]{3,}$/.test(s)) return resolveChannelId(`https://www.youtube.com/${s}`);

  let u: URL;
  try {
    u = new URL(s);
  } catch {
    throw new Error("Paste a YouTube channel URL (e.g. https://www.youtube.com/@RockstarGames) or a channel ID starting with UC.");
  }
  if (!/(^|\.)youtube\.com$/.test(u.hostname)) throw new Error("That isn't a youtube.com URL.");
  const direct = u.pathname.match(/^\/channel\/(UC[\w-]{22})/)?.[1] ?? u.searchParams.get("channel_id");
  if (direct && CHANNEL_ID.test(direct)) return direct;

  const { text } = await fetchText(`https://www.youtube.com${u.pathname.split("/").slice(0, 2).join("/")}`);
  const found =
    text.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/)?.[1] ??
    text.match(/<meta itemprop="identifier" content="(UC[\w-]{22})"/)?.[1] ??
    text.match(/"externalId":"(UC[\w-]{22})"/)?.[1] ??
    text.match(/"channelId":"(UC[\w-]{22})"/)?.[1];
  if (!found) throw new Error("Couldn't find that channel. Try the channel's /channel/UC… URL instead.");
  return found;
}

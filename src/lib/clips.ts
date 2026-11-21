import { parseYouTubeId } from "@/lib/youtube";

export const PLATFORMS = {
  x: "X",
  youtube: "YouTube",
  tiktok: "TikTok",
  twitch: "Twitch",
} as const;
export type Platform = keyof typeof PLATFORMS;

export type ParsedClip = {
  platform: Platform;
  /** May be null for TikTok short links, which must be resolved first */
  externalId: string | null;
  /** Channel name when it is visible in the URL (TikTok @user, twitch.tv/<channel>/clip/…) */
  channel?: string;
  url: string;
};

/** Recognise a clip link without any network calls. */
export function parseClipUrl(input: string): ParsedClip | null {
  const raw = input.trim();
  const yt = parseYouTubeId(raw);
  if (yt) return { platform: "youtube", externalId: yt, url: `https://www.youtube.com/watch?v=${yt}` };

  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www|m|vm|vt)\./, "").toLowerCase();
  const path = u.pathname.replace(/\/+$/, "");

  // X / Twitter posts, including common mirror domains people share
  if (/^(x|twitter|mobile\.twitter|fxtwitter|vxtwitter|fixupx|fixvx|twittpr)\.com$/.test(host)) {
    const m = path.match(/^\/(?:([\w]{1,15})|i(?:\/web)?)\/status(?:es)?\/(\d{5,25})/);
    if (m) {
      const user = m[1] && m[1] !== "i" ? m[1] : undefined;
      return {
        platform: "x",
        externalId: m[2],
        channel: user,
        url: user ? `https://x.com/${user}/status/${m[2]}` : `https://x.com/i/status/${m[2]}`,
      };
    }
    return null;
  }

  if (host === "tiktok.com") {
    const m = path.match(/^\/@([\w.-]+)\/video\/(\d{8,25})/);
    if (m) return { platform: "tiktok", externalId: m[2], channel: m[1], url: `https://www.tiktok.com/@${m[1]}/video/${m[2]}` };
    const embed = path.match(/^\/(?:embed(?:\/v2)?|player\/v1)\/(\d{8,25})/);
    if (embed) return { platform: "tiktok", externalId: embed[1], url: raw };
    // Short share links (vm.tiktok.com/…, tiktok.com/t/…) are resolved by following the redirect.
    if (/^(vm|vt)\./.test(u.hostname) || path.startsWith("/t/")) return { platform: "tiktok", externalId: null, url: raw };
    return null;
  }

  if (host === "twitch.tv") {
    const m = path.match(/^\/([\w]{3,25})\/clip\/([\w-]{5,100})/);
    if (m) return { platform: "twitch", externalId: m[2], channel: m[1], url: `https://www.twitch.tv/${m[1]}/clip/${m[2]}` };
    return null;
  }
  if (host === "clips.twitch.tv") {
    const slug = path === "/embed" ? u.searchParams.get("clip") : path.slice(1);
    if (slug && /^[\w-]{5,100}$/.test(slug)) return { platform: "twitch", externalId: slug, url: `https://clips.twitch.tv/${slug}` };
    return null;
  }
  return null;
}

/** Canonical form used to recognise the same channel across links. */
export function normaliseChannelUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^(www|m)\./, "").toLowerCase();
    if (host === "twitter.com" || host === "mobile.twitter.com") return `https://x.com${u.pathname.replace(/\/+$/, "")}`;
    return `https://${host === "youtube.com" || host === "tiktok.com" || host === "twitch.tv" ? `www.${host}` : host}${u.pathname.replace(/\/+$/, "")}`;
  } catch {
    return url.trim();
  }
}

export function clipThumbnail(v: { platform: string; externalId: string; thumbnailUrl: string | null }): string | null {
  if (v.platform === "youtube") return `https://i.ytimg.com/vi/${v.externalId}/hqdefault.jpg`;
  return v.thumbnailUrl;
}

export function clipWatchUrl(v: { platform: string; externalId: string; sourceUrl: string | null }): string {
  if (v.sourceUrl) return v.sourceUrl;
  if (v.platform === "youtube") return `https://www.youtube.com/watch?v=${v.externalId}`;
  if (v.platform === "twitch") return `https://clips.twitch.tv/${v.externalId}`;
  if (v.platform === "x") return `https://x.com/i/status/${v.externalId}`;
  return `https://www.tiktok.com/embed/v2/${v.externalId}`;
}

const OTHER_LABELS: Record<string, string> = { kick: "Kick", other: "Creator" };

export function platformLabel(p: string): string {
  return PLATFORMS[p as Platform] ?? OTHER_LABELS[p] ?? "Video";
}

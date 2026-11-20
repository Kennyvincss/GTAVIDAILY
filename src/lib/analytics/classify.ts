const SEARCH = [
  /(^|\.)google\./, /(^|\.)bing\.com$/, /(^|\.)duckduckgo\.com$/, /(^|\.)yahoo\./, /(^|\.)yandex\./,
  /(^|\.)baidu\.com$/, /(^|\.)ecosia\.org$/, /(^|\.)brave\.com$/, /(^|\.)startpage\.com$/, /(^|\.)qwant\.com$/,
];
const SOCIAL = [
  /(^|\.)twitter\.com$/, /(^|\.)x\.com$/, /^t\.co$/, /(^|\.)facebook\.com$/, /(^|\.)fb\.me$/,
  /(^|\.)instagram\.com$/, /(^|\.)reddit\.com$/, /(^|\.)youtube\.com$/, /(^|\.)tiktok\.com$/,
  /(^|\.)discord(app)?\.com$/, /(^|\.)twitch\.tv$/, /(^|\.)linkedin\.com$/, /(^|\.)threads\.net$/,
  /(^|\.)bsky\.app$/, /(^|\.)pinterest\./, /(^|\.)whatsapp\.com$/, /(^|\.)telegram\.org$/, /^lnkd\.in$/,
];
const EMAIL = [/mail\./, /(^|\.)outlook\.(com|live\.com)$/, /(^|\.)proton\.me$/];

export const SOURCE_LABELS: Record<string, string> = {
  direct: "Direct",
  search: "Search",
  social: "Social",
  referral: "Referral",
  newsletter: "Newsletter",
  campaign: "Campaign (UTM)",
};

export function classifySource(opts: {
  referrerHost: string | null;
  ownHost: string;
  utmSource: string | null;
  utmMedium: string | null;
}): string {
  const medium = opts.utmMedium?.toLowerCase() ?? "";
  const source = opts.utmSource?.toLowerCase() ?? "";
  if (medium === "email" || medium === "newsletter" || source === "newsletter") return "newsletter";
  if (medium === "social") return "social";
  if (medium === "cpc" || medium === "organic") return medium === "cpc" ? "campaign" : "search";
  if (source) return "campaign";

  const host = opts.referrerHost;
  if (!host || host === opts.ownHost) return "direct";
  if (SEARCH.some((r) => r.test(host))) return "search";
  if (SOCIAL.some((r) => r.test(host))) return "social";
  if (EMAIL.some((r) => r.test(host))) return "newsletter";
  return "referral";
}

const BOT_UA =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|monitor|curl|wget|python-requests|axios|node-fetch/i;

export function isBot(ua: string | null): boolean {
  return !ua || BOT_UA.test(ua);
}

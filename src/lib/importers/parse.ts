import { XMLParser } from "fast-xml-parser";

export type ParsedItem = {
  guid: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: Date | null;
  /** Present for YouTube channel feeds */
  youtubeId?: string;
};

export type ParsedFeed = { title: string; siteUrl: string | null; items: ParsedItem[] };

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  processEntities: true,
  htmlEntities: true,
  trimValues: true,
  parseTagValue: false,
  isArray: (name) => ["item", "entry", "link"].includes(name),
});

const arr = <T>(v: T | T[] | undefined | null): T[] => (v == null ? [] : Array.isArray(v) ? v : [v]);

/** Read a text node that may be a string, number, CDATA or { "#text": … } object. */
function text(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (Array.isArray(v)) return text(v[0]);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if ("#text" in o) return text(o["#text"]);
    if ("__cdata" in o) return text(o.__cdata);
  }
  return "";
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };

/** HTML → short plain text. */
export function plain(html: string, max = 300): string {
  const t = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (m, e: string) => {
      if (e[0] === "#") {
        const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : m;
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, " ")
    .trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

function date(v: unknown): Date | null {
  const s = text(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function atomLink(links: unknown): string {
  const list = arr(links as Record<string, string>[] | Record<string, string>);
  const alt = list.find((l) => typeof l === "object" && (!l["@_rel"] || l["@_rel"] === "alternate")) ?? list[0];
  if (!alt) return "";
  return typeof alt === "string" ? alt : (alt["@_href"] ?? text(alt));
}

/** Parse RSS 2.0, RSS 1.0 (RDF), Atom and YouTube channel feeds. */
export function parseFeed(xml: string): ParsedFeed {
  let doc: Record<string, unknown>;
  try {
    doc = parser.parse(xml);
  } catch {
    throw new Error("The feed isn't valid XML.");
  }

  // Atom (also YouTube)
  const feed = doc.feed as Record<string, unknown> | undefined;
  if (feed) {
    const items = arr(feed.entry as Record<string, unknown>[]).map((e) => {
      const media = e["media:group"] as Record<string, unknown> | undefined;
      const youtubeId = text(e["yt:videoId"]) || undefined;
      const link = atomLink(e.link) || (youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : "");
      return {
        guid: text(e.id) || link,
        title: plain(text(e.title), 300),
        link,
        summary: plain(text(e.summary) || text(e.content) || text(media?.["media:description"]), 600),
        publishedAt: date(e.published) ?? date(e.updated),
        youtubeId,
      };
    });
    return { title: plain(text(feed.title), 120), siteUrl: atomLink(feed.link) || null, items: items.filter((i) => i.title && i.link) };
  }

  // RSS 2.0 / RSS 1.0
  const channel = ((doc.rss as Record<string, unknown> | undefined)?.channel ??
    (doc["rdf:RDF"] as Record<string, unknown> | undefined)?.channel) as Record<string, unknown> | undefined;
  const rawItems = arr(
    ((channel?.item ?? (doc["rdf:RDF"] as Record<string, unknown> | undefined)?.item) as Record<string, unknown>[]) ?? [],
  );
  if (!channel && rawItems.length === 0) throw new Error("This doesn't look like an RSS or Atom feed.");
  const items = rawItems.map((i) => {
    const link = text(arr(i.link as unknown[])[0]) || atomLink(i.link) || text(i.guid);
    return {
      guid: text(i.guid) || link || text(i.title),
      title: plain(text(i.title), 300),
      link,
      summary: plain(text(i.description) || text(i["content:encoded"]), 600),
      publishedAt: date(i.pubDate) ?? date(i["dc:date"]),
    };
  });
  return {
    title: plain(text(channel?.title), 120),
    siteUrl: text(arr(channel?.link as unknown[])[0]) || null,
    items: items.filter((i) => i.title && /^https?:\/\//.test(i.link)),
  };
}

/** Find an RSS/Atom feed URL advertised in an HTML page. */
export function discoverFeedUrl(html: string, pageUrl: string): string | null {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    if (!/rel=["']?alternate/i.test(tag)) continue;
    if (!/type=["']?application\/(rss|atom)\+xml/i.test(tag)) continue;
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (href) {
      try {
        return new URL(href.replace(/&amp;/g, "&"), pageUrl).toString();
      } catch {
        /* keep looking */
      }
    }
  }
  return null;
}

export function looksLikeFeed(body: string, contentType: string): boolean {
  if (/(rss|atom|xml)/i.test(contentType) && !/html/i.test(contentType)) return true;
  return /^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<(rss|feed|rdf:RDF)\b/i.test(body);
}

/** Does `text` mention any of the comma-separated keywords? Empty list = everything matches. */
export function matchesKeywords(keywords: string, ...fields: string[]): boolean {
  const words = keywords
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
  if (words.length === 0) return true;
  const hay = fields.join(" ").toLowerCase();
  return words.some((w) => hay.includes(w));
}

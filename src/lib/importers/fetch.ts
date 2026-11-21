import "server-only";
import { site } from "@/lib/site";

const MAX_BYTES = 3 * 1024 * 1024;

/** Admin-entered URLs only: http(s), and never local/private hosts. */
export function assertPublicUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error("That isn't a valid URL.");
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("Only http(s) URLs are supported.");
  const h = u.hostname.toLowerCase();
  if (
    h === "localhost" ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    h.startsWith("[")
  ) {
    throw new Error("That address isn't publicly reachable.");
  }
  return u;
}

/** Fetch a public page or feed as text, with a timeout and a size cap. */
export async function fetchText(url: string): Promise<{ text: string; finalUrl: string; contentType: string }> {
  const u = assertPublicUrl(url);
  const res = await fetch(u, {
    headers: {
      "User-Agent": `GTAVIDailyBot/1.0 (+${site.url})`,
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5",
      "Accept-Language": "en",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${u.hostname} answered HTTP ${res.status}.`);
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES) throw new Error("The response is too large.");
  const text = await res.text();
  if (text.length > MAX_BYTES) throw new Error("The response is too large.");
  return { text, finalUrl: res.url || u.toString(), contentType: res.headers.get("content-type") ?? "" };
}

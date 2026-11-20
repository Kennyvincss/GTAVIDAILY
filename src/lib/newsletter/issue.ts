import "server-only";
import { db } from "@/lib/db";
import { addDays } from "@/lib/dates";
import { site } from "@/lib/site";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Tag on-site links so newsletter traffic shows up as "Newsletter" in analytics. */
function tag(path: string, issueDay: string, content: string) {
  const u = new URL(path, site.url);
  u.searchParams.set("utm_source", "newsletter");
  u.searchParams.set("utm_medium", "email");
  u.searchParams.set("utm_campaign", `daily-${issueDay}`);
  u.searchParams.set("utm_content", content);
  return u.toString();
}

type Sponsorship = { id: string; sponsor: string; headline: string; body: string; targetUrl: string; imageUrl: string | null };

function sponsorBlock(s: Sponsorship) {
  return `
<tr><td style="padding:16px 24px">
  <table role="presentation" width="100%" style="border:1px solid #e9d8a6;background:#fffaf0;border-radius:10px">
    <tr><td style="padding:16px">
      <p style="margin:0 0 6px;font:700 11px/1 Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;color:#9a6b00">Sponsored · ${esc(s.sponsor)}</p>
      ${s.imageUrl ? `<img src="${esc(s.imageUrl)}" alt="" width="100%" style="display:block;border-radius:8px;margin:8px 0">` : ""}
      <p style="margin:0 0 6px;font:700 17px/1.3 Arial,sans-serif;color:#111">${esc(s.headline)}</p>
      <p style="margin:0 0 10px;font:14px/1.5 Arial,sans-serif;color:#333">${esc(s.body)}</p>
      <a href="${esc(s.targetUrl)}" style="font:700 14px Arial,sans-serif;color:#d6266f">Learn more →</a>
    </td></tr>
  </table>
</td></tr>`;
}

/**
 * Build a ready-to-send HTML issue for a given day: the latest published
 * stories plus any sponsorships scheduled for that date at their positions.
 * `{{unsubscribe_url}}` is left as a merge tag for your email provider; the
 * subscriber CSV export includes each subscriber's unsubscribe URL.
 */
export async function buildIssue(issueDay: string) {
  const start = new Date(`${issueDay}T00:00:00.000Z`);
  const end = addDays(start, 1);
  const [articles, sponsorships] = await Promise.all([
    db.article.findMany({
      where: { status: "published", publishedAt: { lte: end } },
      orderBy: { publishedAt: "desc" },
      take: 8,
      select: { title: true, slug: true, excerpt: true, isSponsored: true, sponsorName: true },
    }),
    db.newsletterSponsorship.findMany({
      where: { issueDate: { gte: start, lt: end }, status: { not: "cancelled" } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const at = (pos: string) => sponsorships.filter((s) => s.position === pos).map(sponsorBlock).join("");
  const story = (a: (typeof articles)[number], i: number) => `
<tr><td style="padding:12px 24px;border-top:${i ? "1px solid #eee" : "0"}">
  ${a.isSponsored ? `<p style="margin:0 0 4px;font:700 11px Arial,sans-serif;text-transform:uppercase;color:#9a6b00">Sponsored${a.sponsorName ? ` · ${esc(a.sponsorName)}` : ""}</p>` : ""}
  <a href="${esc(tag(`/news/${a.slug}`, issueDay, `story-${i + 1}`))}" style="font:700 17px/1.3 Arial,sans-serif;color:#111;text-decoration:none">${esc(a.title)}</a>
  <p style="margin:6px 0 0;font:14px/1.5 Arial,sans-serif;color:#555">${esc(a.excerpt)}</p>
</td></tr>`;
  const mid = Math.ceil(articles.length / 2);

  const html = `<!doctype html>
<html><body style="margin:0;background:#f3f1f7">
<table role="presentation" width="100%" style="background:#f3f1f7"><tr><td align="center" style="padding:24px 8px">
<table role="presentation" width="600" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden">
  <tr><td style="background:#0b0716;padding:20px 24px">
    <a href="${esc(tag("/", issueDay, "logo"))}" style="font:900 22px Arial Black,Arial,sans-serif;color:#ff3d8b;text-decoration:none">GTA VI <span style="color:#fff">Daily</span></a>
    <p style="margin:4px 0 0;font:13px Arial,sans-serif;color:#a89cc2">${esc(new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeZone: "UTC" }).format(start))}</p>
  </td></tr>
  ${at("top")}
  ${articles.slice(0, mid).map(story).join("")}
  ${at("middle")}
  ${articles.slice(mid).map((a, i) => story(a, i + mid)).join("")}
  ${at("bottom")}
  <tr><td style="padding:20px 24px;background:#faf9fc;font:12px/1.5 Arial,sans-serif;color:#888">
    You're receiving this because you subscribed at ${esc(site.url.replace(/^https?:\/\//, ""))}.
    Sponsored sections are paid placements. <a href="{{unsubscribe_url}}" style="color:#888">Unsubscribe</a>
  </td></tr>
</table></td></tr></table>
</body></html>`;

  return { html, articleCount: articles.length, sponsorships };
}

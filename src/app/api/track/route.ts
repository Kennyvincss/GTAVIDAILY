import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { dayKey, monthKey } from "@/lib/dates";
import { classifySource } from "@/lib/analytics/classify";
import { existingVisitorId, shouldRecord } from "@/lib/analytics/record";
import { VISITOR_COOKIE, VISITOR_MAX_AGE } from "@/lib/analytics/visitor";

// Only public site routes are recorded.
// /api/health and other API routes are never tracked.
const TRACKABLE = /^\/($|news(\/|$)|category\/|videos(\/|$)|creators(\/|$)|gear$|newsletter$|advertise$|privacy$)/;

export async function POST(req: NextRequest) {
  if (!(await shouldRecord(req))) return new NextResponse(null, { status: 204 });

  let body: { url?: unknown; referrer?: unknown; entry?: unknown };
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (typeof body.url !== "string" || body.url.length > 2000) return new NextResponse(null, { status: 400 });

  let url: URL;
  try {
    url = new URL(body.url, req.nextUrl.origin);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (!TRACKABLE.test(path)) return new NextResponse(null, { status: 204 });

  const isEntry = body.entry === true;
  let referrerHost: string | null = null;
  if (isEntry && typeof body.referrer === "string" && body.referrer) {
    try {
      referrerHost = new URL(body.referrer).hostname.replace(/^www\./, "").toLowerCase().slice(0, 255);
    } catch {
      /* ignore */
    }
  }
  const ownHost = req.nextUrl.hostname.replace(/^www\./, "");
  if (referrerHost === ownHost) referrerHost = null;

  const utm = (k: string) => url.searchParams.get(k)?.slice(0, 100) || null;
  const utmSource = isEntry ? utm("utm_source") : null;
  const utmMedium = isEntry ? utm("utm_medium") : null;
  const utmCampaign = isEntry ? utm("utm_campaign") : null;
  const source = isEntry ? classifySource({ referrerHost, ownHost, utmSource, utmMedium }) : "internal";

  // Resolve the content behind the path.
  let articleId: string | null = null;
  let videoId: string | null = null;
  let categoryId: string | null = null;
  const [, section, slug] = path.split("/");
  if (section === "news" && slug) {
    const a = await db.article.findFirst({ where: { slug, status: "published" }, select: { id: true, categoryId: true } });
    if (a) ({ id: articleId, categoryId } = a);
  } else if (section === "videos" && slug) {
    const v = await db.video.findFirst({ where: { id: slug, status: "published" }, select: { id: true, categoryId: true } });
    if (v) ({ id: videoId, categoryId } = v);
  } else if (section === "category" && slug) {
    const c = await db.category.findUnique({ where: { slug }, select: { id: true } });
    if (c) categoryId = c.id;
  }

  const existing = existingVisitorId(req);
  const visitorId = existing ?? crypto.randomUUID();
  const now = new Date();
  const day = dayKey(now);
  const month = monthKey(now);

  await db.$transaction([
    db.pageView.create({
      data: {
        path: path.slice(0, 500),
        day,
        visitorId,
        articleId,
        videoId,
        categoryId,
        isEntry,
        source,
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
      },
    }),
    db.dailyVisitor.upsert({ where: { day_visitorId: { day, visitorId } }, update: {}, create: { day, visitorId } }),
    db.monthlyVisitor.upsert({
      where: { month_visitorId: { month, visitorId } },
      update: {},
      create: { month, visitorId },
    }),
  ]);

  const res = new NextResponse(null, { status: 204 });
  if (!existing) {
    res.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: VISITOR_MAX_AGE,
      path: "/",
    });
  }
  return res;
}

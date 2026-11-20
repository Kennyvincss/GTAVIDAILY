import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { dayKey } from "@/lib/dates";
import { shouldRecord } from "@/lib/analytics/record";
import { isPlacementKey } from "@/lib/monetisation/placements";

/** Records viewable impressions (≥50% on screen) for direct ads and AdSense slots. */
export async function POST(req: NextRequest) {
  if (!(await shouldRecord(req))) return new NextResponse(null, { status: 204 });
  let body: { placementKey?: unknown; campaignId?: unknown; type?: unknown };
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const { placementKey, campaignId, type } = body;
  if (typeof placementKey !== "string" || !isPlacementKey(placementKey)) return new NextResponse(null, { status: 400 });
  if (type !== "impression" && type !== "adsense_view") return new NextResponse(null, { status: 400 });

  let cid: string | null = null;
  if (type === "impression") {
    if (typeof campaignId !== "string") return new NextResponse(null, { status: 400 });
    const c = await db.adCampaign.findUnique({ where: { id: campaignId }, select: { id: true, placementKey: true } });
    if (!c || c.placementKey !== placementKey) return new NextResponse(null, { status: 400 });
    cid = c.id;
  }
  await db.adEvent.create({ data: { placementKey, campaignId: cid, type, day: dayKey() } });
  return new NextResponse(null, { status: 204 });
}

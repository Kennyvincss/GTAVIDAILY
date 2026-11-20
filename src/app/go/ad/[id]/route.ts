import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { dayKey } from "@/lib/dates";
import { shouldRecord } from "@/lib/analytics/record";

/** Direct-ad click redirect. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.adCampaign.findUnique({ where: { id } });
  if (!campaign) return NextResponse.redirect(new URL("/", req.url));
  if (await shouldRecord(req)) {
    await db.adEvent.create({
      data: { placementKey: campaign.placementKey, campaignId: campaign.id, type: "click", day: dayKey() },
    });
  }
  const res = NextResponse.redirect(campaign.targetUrl, 302);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { dayKey } from "@/lib/dates";
import { existingVisitorId, shouldRecord } from "@/lib/analytics/record";
import { buildAffiliateUrl } from "@/lib/monetisation/affiliate";

/** Affiliate redirect: records the click, then forwards to the merchant's tracking URL. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await db.affiliateProduct.findUnique({ where: { slug } });
  if (!product || !product.active) return NextResponse.redirect(new URL("/gear", req.url));

  let clickId = "na";
  if (await shouldRecord(req)) {
    const from = req.nextUrl.searchParams.get("from");
    const click = await db.affiliateClick.create({
      data: {
        productId: product.id,
        sourcePath: from && from.startsWith("/") ? from.slice(0, 500) : null,
        visitorId: existingVisitorId(req),
        day: dayKey(),
      },
    });
    clickId = click.id;
  }
  const res = NextResponse.redirect(buildAffiliateUrl(product.affiliateUrl, clickId), 302);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Referrer-Policy", "no-referrer-when-downgrade");
  return res;
}

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { dayKey } from "@/lib/dates";
import { existingVisitorId, shouldRecord } from "@/lib/analytics/record";

/** Play / complete events reported by the YouTube IFrame Player API. */
export async function POST(req: NextRequest) {
  if (!(await shouldRecord(req))) return new NextResponse(null, { status: 204 });
  let body: { videoId?: unknown; type?: unknown };
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (typeof body.videoId !== "string" || (body.type !== "play" && body.type !== "complete")) {
    return new NextResponse(null, { status: 400 });
  }
  const video = await db.video.findUnique({ where: { id: body.videoId }, select: { id: true } });
  if (!video) return new NextResponse(null, { status: 404 });
  await db.videoEvent.create({
    data: { videoId: video.id, type: body.type, visitorId: existingVisitorId(req), day: dayKey() },
  });
  return new NextResponse(null, { status: 204 });
}

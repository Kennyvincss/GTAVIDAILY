import { refreshStale } from "@/lib/importers/run";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Scheduled import (see vercel.json "crons"). Vercel sends
 * `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set on the project.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "Set CRON_SECRET to enable scheduled imports." }, { status: 401 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const results = await refreshStale(30);
  return Response.json({ ok: true, results });
}

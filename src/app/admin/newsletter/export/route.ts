import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { site } from "@/lib/site";

const csv = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Active subscribers with per-subscriber unsubscribe URLs, for import into an email provider. */
export async function GET() {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const subs = await db.newsletterSubscriber.findMany({ where: { unsubscribedAt: null }, orderBy: { createdAt: "asc" } });
  const lines = ["email,subscribed_at,source,unsubscribe_url"];
  for (const s of subs) {
    lines.push(
      [s.email, s.createdAt.toISOString(), s.source, `${site.url}/newsletter/unsubscribe?token=${s.unsubscribeToken}`]
        .map(csv)
        .join(","),
    );
  }
  return new Response(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

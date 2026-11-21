import { db } from "@/lib/db";
import { adminConfigProblem } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Deployment health check. Reports which required settings are present and
 * whether the database is reachable and migrated. Never returns secret values.
 */
export async function GET() {
  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DIRECT_URL: !!process.env.DIRECT_URL,
    ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: !!process.env.ADMIN_SESSION_SECRET,
    NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
  };
  let database: string;
  try {
    await db.category.count();
    database = "ok";
  } catch (e) {
    const code = (e as { code?: string; errorCode?: string }).code ?? (e as { errorCode?: string }).errorCode;
    database =
      code === "P2021"
        ? "connected, but tables are missing: migrations have not run (check the build log for `prisma migrate deploy`)"
        : code === "P1001" || code === "P1000" || code === "P1013"
          ? `cannot connect (${code}): check DATABASE_URL`
          : `error${code ? ` (${code})` : ""}: ${e instanceof Error ? e.message.split("\n").filter(Boolean).at(-1)?.slice(0, 200) : "unknown"}`;
  }
  const admin = adminConfigProblem() ?? "ok";
  const ok = database === "ok" && admin === "ok";
  return Response.json({ ok, database, admin, env }, { status: ok ? 200 : 500, headers: { "Cache-Control": "no-store" } });
}

import "server-only";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { isBot } from "./classify";
import { VISITOR_COOKIE, validVisitorId } from "./visitor";

/**
 * Shared gate for every analytics write: ignores bots, admins (so editing
 * doesn't inflate numbers) and visitors sending Do Not Track / GPC.
 */
export async function shouldRecord(req: NextRequest): Promise<boolean> {
  if (isBot(req.headers.get("user-agent"))) return false;
  if (req.headers.get("dnt") === "1" || req.headers.get("sec-gpc") === "1") return false;
  if (await verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value)) return false;
  return true;
}

export function existingVisitorId(req: NextRequest): string | null {
  const v = req.cookies.get(VISITOR_COOKIE)?.value;
  return validVisitorId(v) ? v : null;
}

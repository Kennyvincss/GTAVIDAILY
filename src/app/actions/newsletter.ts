"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { dayKey } from "@/lib/dates";

export type SubscribeState = { ok: boolean; message: string } | null;

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  source: z.string().max(40).regex(/^[\w-]+$/).catch("site"),
  website: z.string().max(0).optional(), // honeypot
});

export async function subscribe(_prev: SubscribeState, form: FormData): Promise<SubscribeState> {
  const parsed = schema.safeParse({
    email: form.get("email"),
    source: form.get("source") ?? "site",
    website: form.get("website") ?? "",
  });
  if (!parsed.success) return { ok: false, message: "Please enter a valid email address." };
  const { email, source } = parsed.data;

  const existing = await db.newsletterSubscriber.findUnique({ where: { email } });
  if (existing && !existing.unsubscribedAt) return { ok: true, message: "You're already subscribed. See you in your inbox." };
  if (existing) {
    // Re-subscribing counts as a new subscription today.
    await db.newsletterSubscriber.update({
      where: { email },
      data: { unsubscribedAt: null, day: dayKey(), createdAt: new Date(), source },
    });
  } else {
    await db.newsletterSubscriber.create({
      data: { email, source, day: dayKey(), unsubscribeToken: randomBytes(24).toString("hex") },
    });
  }
  return { ok: true, message: "You're in. The next GTA VI Daily briefing is on its way." };
}

export async function unsubscribe(token: string): Promise<boolean> {
  if (!/^[a-f0-9]{48}$/.test(token)) return false;
  const sub = await db.newsletterSubscriber.findUnique({ where: { unsubscribeToken: token } });
  if (!sub) return false;
  if (!sub.unsubscribedAt) {
    await db.newsletterSubscriber.update({ where: { id: sub.id }, data: { unsubscribedAt: new Date() } });
  }
  return true;
}

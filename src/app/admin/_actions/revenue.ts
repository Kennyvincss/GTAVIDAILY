"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { parseMoneyToCents } from "@/lib/format";
import { getStream } from "@/lib/monetisation/streams";
import { optDate, str } from "./form";
import type { FormState } from "./content";

/** Record money actually received (e.g. an AdSense payout or an invoice paid). */
export async function addRevenue(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const streamKey = str(form, "streamKey");
  if (!getStream(streamKey)) return { error: "Choose a revenue stream." };
  const amountCents = parseMoneyToCents(str(form, "amount"));
  if (amountCents == null || amountCents <= 0) return { error: "Enter an amount like 120.50." };
  await db.revenueEntry.create({
    data: {
      streamKey,
      amountCents,
      currency: ["GBP", "USD", "EUR"].includes(str(form, "currency")) ? str(form, "currency") : "GBP",
      description: str(form, "description", 300),
      receivedAt: optDate(form, "receivedAt") ?? new Date(),
    },
  });
  revalidatePath("/admin/revenue");
  return null;
}

export async function deleteRevenue(form: FormData) {
  await requireAdmin();
  await db.revenueEntry.delete({ where: { id: str(form, "id") } });
  revalidatePath("/admin/revenue");
}

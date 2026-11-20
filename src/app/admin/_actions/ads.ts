"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { safeUrl } from "@/lib/format";
import { isPlacementKey } from "@/lib/monetisation/placements";
import { bool, int, optDate, optStr, str } from "./form";
import type { FormState } from "./content";

export async function savePlacement(form: FormData) {
  await requireAdmin();
  const key = str(form, "key");
  if (!isPlacementKey(key)) return;
  const mode = ["auto", "direct", "adsense"].includes(str(form, "mode")) ? str(form, "mode") : "auto";
  const slot = str(form, "adsenseSlotId", 40);
  await db.adPlacement.update({
    where: { key },
    data: {
      enabled: bool(form, "enabled"),
      mode,
      adsenseSlotId: /^\d{6,20}$/.test(slot) ? slot : null,
      adsenseFormat: ["auto", "horizontal", "vertical", "rectangle", "fluid"].includes(str(form, "adsenseFormat"))
        ? str(form, "adsenseFormat")
        : "auto",
    },
  });
  revalidatePath("/admin/ads");
}

export async function saveCampaign(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(form, "id");
  const placementKey = str(form, "placementKey");
  if (!isPlacementKey(placementKey)) return { error: "Choose a placement." };
  const targetUrl = safeUrl(str(form, "targetUrl", 1000));
  if (!targetUrl) return { error: "Target URL must be http(s)." };
  const imageRaw = optStr(form, "imageUrl", 1000);
  const imageUrl = imageRaw ? safeUrl(imageRaw) : null;
  if (imageRaw && !imageUrl) return { error: "Image URL must be http(s)." };
  const advertiser = str(form, "advertiser", 120);
  const title = str(form, "title", 160);
  if (!advertiser || !title) return { error: "Advertiser and headline are required." };
  const startsAt = optDate(form, "startsAt") ?? new Date();
  const endsAt = optDate(form, "endsAt");
  if (endsAt && endsAt <= startsAt) return { error: "End date must be after the start date." };
  const data = {
    placementKey,
    advertiser,
    title,
    body: optStr(form, "body", 300),
    imageUrl,
    targetUrl,
    startsAt,
    endsAt,
    active: bool(form, "active"),
    weight: Math.min(100, Math.max(1, int(form, "weight", 1))),
  };
  if (id) await db.adCampaign.update({ where: { id }, data });
  else await db.adCampaign.create({ data });
  redirect("/admin/ads");
}

export async function deleteCampaign(form: FormData) {
  await requireAdmin();
  await db.adCampaign.delete({ where: { id: str(form, "id") } });
  redirect("/admin/ads");
}

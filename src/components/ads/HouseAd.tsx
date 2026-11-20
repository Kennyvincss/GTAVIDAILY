"use client";

import { useEffect, useRef } from "react";
import { beacon, onceViewable } from "../beacon";

type Props = {
  placementKey: string;
  variant: "banner" | "inline" | "sidebar";
  campaign: { id: string; advertiser: string; title: string; body: string | null; imageUrl: string | null };
};

/** A directly sold ad. Impressions are counted when viewable; clicks via /go/ad/[id]. */
export function HouseAd({ placementKey, variant, campaign }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    return onceViewable(ref.current, () =>
      beacon("/api/ad-event", { placementKey, campaignId: campaign.id, type: "impression" }),
    );
  }, [placementKey, campaign.id]);

  const layout =
    variant === "banner"
      ? "flex-col sm:flex-row sm:items-center"
      : variant === "sidebar"
        ? "flex-col"
        : "flex-col sm:flex-row sm:items-center";

  return (
    <a
      ref={ref}
      href={`/go/ad/${campaign.id}`}
      target="_blank"
      rel="sponsored noopener"
      className={`flex ${layout} gap-4 rounded-xl border border-line bg-surface-2 p-4 no-underline transition hover:border-pink`}
    >
      {campaign.imageUrl && (
        <img
          src={campaign.imageUrl}
          alt=""
          className={
            variant === "sidebar"
              ? "aspect-[6/5] w-full rounded-lg object-cover"
              : "aspect-[16/9] w-full rounded-lg object-cover sm:w-56"
          }
        />
      )}
      <div className="min-w-0">
        <p className="text-xs text-muted">{campaign.advertiser}</p>
        <p className="mt-1 font-bold leading-snug">{campaign.title}</p>
        {campaign.body && <p className="mt-1 text-sm text-muted">{campaign.body}</p>}
      </div>
    </a>
  );
}

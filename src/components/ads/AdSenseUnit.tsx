"use client";

import { useEffect, useRef } from "react";
import { beacon, onceViewable } from "../beacon";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type Props = { placementKey: string; client: string; slotId: string; format: string };

/** Google AdSense responsive unit. Earnings and fill are reported in AdSense itself. */
export function AdSenseUnit({ placementKey, client, slotId, format }: Props) {
  const ref = useRef<HTMLModElement>(null);
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* AdSense script blocked or not loaded */
    }
    if (!ref.current) return;
    return onceViewable(ref.current, () => beacon("/api/ad-event", { placementKey, type: "adsense_view" }));
  }, [placementKey]);

  return (
    <ins
      ref={ref}
      className="adsbygoogle block"
      style={{ display: "block", minHeight: 90 }}
      data-ad-client={client}
      data-ad-slot={slotId}
      data-ad-format={format === "fluid" ? "fluid" : format}
      data-ad-layout={format === "fluid" ? "in-article" : undefined}
      data-full-width-responsive="true"
    />
  );
}

import { selectAd } from "@/lib/monetisation/ads";
import type { PlacementKey } from "@/lib/monetisation/placements";
import { AdSenseUnit } from "./AdSenseUnit";
import { HouseAd } from "./HouseAd";

type Props = {
  placement: PlacementKey;
  variant?: "banner" | "inline" | "sidebar";
  className?: string;
};

/**
 * Drop-in ad placement. Renders nothing when the placement is disabled or has
 * no live campaign and no AdSense slot, so layouts never show empty boxes.
 */
export async function AdSlot({ placement, variant = "inline", className = "" }: Props) {
  const ad = await selectAd(placement);
  if (!ad) return null;
  return (
    <aside aria-label="Advertisement" className={className} data-placement={placement}>
      <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">Advertisement</p>
      {ad.kind === "direct" ? (
        <HouseAd placementKey={placement} variant={variant} campaign={ad.campaign} />
      ) : (
        <AdSenseUnit placementKey={placement} client={ad.client} slotId={ad.slotId} format={ad.format} />
      )}
    </aside>
  );
}

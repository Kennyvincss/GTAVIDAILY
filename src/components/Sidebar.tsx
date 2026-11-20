import Link from "next/link";
import { getAffiliateProducts } from "@/lib/content";
import { getFeaturedCreators } from "@/lib/monetisation/creators";
import { AdSlot } from "./ads/AdSlot";
import { AffiliateCard, CreatorCard } from "./Cards";
import { NewsletterForm } from "./NewsletterForm";

export async function Sidebar({ from }: { from: string }) {
  const [products, creators] = await Promise.all([getAffiliateProducts(3), getFeaturedCreators(3)]);
  return (
    <div className="space-y-6 lg:sticky lg:top-28">
      <AdSlot placement="sidebar" variant="sidebar" />

      <section className="card p-4">
        <p className="font-bold">The daily briefing</p>
        <p className="mb-3 mt-1 text-sm text-muted">Every GTA VI headline in one email.</p>
        <NewsletterForm source="sidebar" compact />
      </section>

      {creators.length > 0 && (
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="eyebrow">Featured creators</p>
            <span className="text-[0.65rem] text-muted">Promoted</span>
          </div>
          <div className="space-y-2">
            {creators.map((c) => (
              <CreatorCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="eyebrow">Gear picks</p>
            <Link href="/gear" className="text-xs text-muted">All →</Link>
          </div>
          <div className="space-y-2">
            {products.map((p) => (
              <AffiliateCard key={p.id} p={p} from={from} compact />
            ))}
          </div>
          <p className="mt-2 text-[0.7rem] text-muted">Affiliate links — we may earn a commission.</p>
        </section>
      )}
    </div>
  );
}

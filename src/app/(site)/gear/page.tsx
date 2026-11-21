import type { Metadata } from "next";
import { AffiliateCard } from "@/components/Cards";
import { getAffiliateProducts } from "@/lib/content";

export const metadata: Metadata = { title: "Gear for GTA VI" };

export default async function GearPage() {
  const products = await getAffiliateProducts();
  // Amazon Associates requires this exact disclosure wherever its links appear.
  const hasAmazon = products.some((p) => /(^|\.)amazon\.[a-z.]+\//.test(p.affiliateUrl.replace(/^https?:\/\/(www\.)?/, "x.")));
  const groups = new Map<string, typeof products>();
  for (const p of products) groups.set(p.category, [...(groups.get(p.category) ?? []), p]);
  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Gear for GTA VI</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Consoles, controllers, headsets and more that we recommend. These are affiliate links: if you buy through
          them we may earn a commission, at no extra cost to you. It never affects what we recommend.
          {hasAmazon && " As an Amazon Associate, GTA VI Daily earns from qualifying purchases."}
        </p>
      </header>
      {products.length === 0 && <p className="text-muted">No recommendations yet.</p>}
      {[...groups.entries()].map(([cat, items]) => (
        <section key={cat}>
          <h2 className="eyebrow mb-3">{cat}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => (
              <AffiliateCard key={p.id} p={p} from="/gear" />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

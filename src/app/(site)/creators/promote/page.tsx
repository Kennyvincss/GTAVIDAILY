import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { PromoteForm } from "./PromoteForm";

export const metadata: Metadata = { title: "Promote your channel" };

export default async function PromotePage() {
  const packages = await db.promotionPackage.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }],
  });
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="eyebrow text-pink">For creators</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl">Get your GTA VI channel in front of fans</h1>
        <p className="mt-2 text-muted">
          Featured creators appear on the homepage, in the sidebar across every article, and on our creators page —
          clearly labelled as a promotion.
        </p>
      </header>
      {packages.length === 0 ? (
        <div className="card p-6 text-muted">Promotion slots aren&apos;t open right now. Check back soon.</div>
      ) : (
        <PromoteForm
          packages={packages.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            durationDays: p.durationDays,
            price: formatMoney(p.priceCents, p.currency),
          }))}
        />
      )}
    </div>
  );
}

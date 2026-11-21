import Link from "next/link";
import { FormShell } from "@/components/admin/FormShell";
import { StarterGearForm } from "@/components/admin/StarterGearForm";
import { Empty, Field, PageHeader, Pill, Section } from "@/components/admin/ui";
import { AMAZON_STORES, STARTER_GEAR } from "@/content/starter-gear";
import { applyAmazonTag } from "../../_actions/gear";
import { db } from "@/lib/db";
import { lastDays } from "@/lib/dates";
import { formatNumber } from "@/lib/format";

export default async function AffiliatesAdmin({ searchParams }: { searchParams: Promise<{ added?: string; untagged?: string }> }) {
  const sp = await searchParams;
  const justAdded = sp.added != null ? Number(sp.added) || 0 : null;
  const from30 = lastDays(30)[0];
  const [products, clicks30, clicksAll] = await Promise.all([
    db.affiliateProduct.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
    db.affiliateClick.groupBy({ by: ["productId"], where: { day: { gte: from30 } }, _count: { _all: true } }),
    db.affiliateClick.groupBy({ by: ["productId"], _count: { _all: true } }),
  ]);
  const c = (rows: typeof clicks30, id: string) => rows.find((r) => r.productId === id)?._count._all ?? 0;
  const existing = new Set(products.map((p) => p.slug));
  const starterLeft = STARTER_GEAR.filter((g) => !existing.has(g.slug)).length;
  const amazonCount = products.filter((p) => /(^|\.)amazon\./.test(safeHost(p.affiliateUrl))).length;
  const untagged = products.filter((p) => /(^|\.)amazon\./.test(safeHost(p.affiliateUrl)) && !/[?&]tag=/.test(p.affiliateUrl)).length;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Affiliates"
        sub="Product recommendations on /gear, the homepage and sidebars. Links are cloaked through /go/<slug> to count clicks."
        action={<Link href="/admin/affiliates/new" className="btn">Add product</Link>}
      />
      {justAdded != null && (
        <p className="rounded-lg bg-ok/10 p-3 text-sm text-ok">
          Added {justAdded} product{justAdded === 1 ? "" : "s"} to your <Link href="/gear" className="underline">Gear page</Link>.
          {sp.untagged ? " They don't have your Amazon Associates tag yet, so add it in the box below to start earning." : ""}
        </p>
      )}

      {starterLeft > 0 && (
        <Section
          title="Ready-made gear picks"
          sub={`${STARTER_GEAR.length} products picked for GTA VI players (PS5 and Xbox only — no PC version is announced). Each links to an Amazon search for that exact product with your Associates tag. No prices or Amazon photos are shown, as Amazon's rules require.`}
        >
          <StarterGearForm
            items={STARTER_GEAR.map((g) => ({ slug: g.slug, name: g.name, category: g.category, description: g.description, added: existing.has(g.slug) }))}
            stores={Object.entries(AMAZON_STORES)}
          />
        </Section>
      )}

      {amazonCount > 0 && (
        <Section
          title="Amazon Associates tag"
          sub={untagged > 0 ? `${untagged} of your ${amazonCount} Amazon links have no tag yet, so they don't earn commission.` : `All ${amazonCount} Amazon links carry a tag. Changed your tag? Update them all here.`}
        >
          <FormShell action={applyAmazonTag} submitLabel="Apply to all Amazon links" className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Field label="Associates tag" name="tag" required placeholder="e.g. gtavidaily-21" className="sm:w-72" />
          </FormShell>
        </Section>
      )}

      {products.length === 0 ? (
        <Empty>No affiliate products yet.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Product</th><th>Merchant</th><th>Category</th><th>Status</th><th className="num">Clicks 30d</th><th className="num">All time</th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/affiliates/${p.id}`} className="font-semibold no-underline hover:text-pink">{p.name}</Link>
                    <div className="font-mono text-xs text-muted">/go/{p.slug}</div>
                  </td>
                  <td className="text-muted">{p.merchant}</td>
                  <td className="text-muted">{p.category}</td>
                  <td><Pill status={p.active ? "active" : "inactive"} /></td>
                  <td className="num">{formatNumber(c(clicks30, p.id))}</td>
                  <td className="num">{formatNumber(c(clicksAll, p.id))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function safeHost(url: string): string {
  try {
    return new URL(url.replaceAll("{clickId}", "x")).hostname;
  } catch {
    return "";
  }
}

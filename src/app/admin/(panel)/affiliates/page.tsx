import Link from "next/link";
import { Empty, PageHeader, Pill } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { lastDays } from "@/lib/dates";
import { formatNumber } from "@/lib/format";

export default async function AffiliatesAdmin() {
  const from30 = lastDays(30)[0];
  const [products, clicks30, clicksAll] = await Promise.all([
    db.affiliateProduct.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
    db.affiliateClick.groupBy({ by: ["productId"], where: { day: { gte: from30 } }, _count: { _all: true } }),
    db.affiliateClick.groupBy({ by: ["productId"], _count: { _all: true } }),
  ]);
  const c = (rows: typeof clicks30, id: string) => rows.find((r) => r.productId === id)?._count._all ?? 0;
  return (
    <div>
      <PageHeader
        title="Affiliates"
        sub="Product recommendations on /gear, the homepage and sidebars. Links are cloaked through /go/<slug> to count clicks."
        action={<Link href="/admin/affiliates/new" className="btn">Add product</Link>}
      />
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

import Link from "next/link";
import { Empty, PageHeader, Pill } from "@/components/admin/ui";
import { platformLabel } from "@/lib/clips";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { completeExpiredPromotions } from "@/lib/monetisation/creators";

export default async function CreatorsAdmin() {
  await completeExpiredPromotions();
  const creators = await db.creator.findMany({
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { requests: true, videos: true } } },
  });
  const now = new Date();
  return (
    <div>
      <PageHeader
        title="Creators"
        sub="Creators are added automatically when you add one of their clips or a paid promotion starts. “Featured” is the paid placement."
        action={<Link href="/admin/creators/new" className="btn">Add creator</Link>}
      />
      {creators.length === 0 ? (
        <Empty>No creators yet.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Creator</th><th>Platform</th><th>Featured</th><th>Until</th><th className="num">Clips</th><th className="num">Promotions</th></tr></thead>
            <tbody>
              {creators.map((c) => {
                const live = c.featured && (!c.featuredUntil || c.featuredUntil > now);
                return (
                  <tr key={c.id}>
                    <td><Link href={`/admin/creators/${c.id}`} className="font-semibold no-underline hover:text-pink">{c.name}</Link></td>
                    <td className="text-muted">{platformLabel(c.platform)}</td>
                    <td><Pill status={live ? "live" : c.featured ? "ended" : "inactive"} /></td>
                    <td className="text-muted">{c.featuredUntil ? formatDate(c.featuredUntil) : c.featured ? "No end date" : "—"}</td>
                    <td className="num">{c._count.videos}</td>
                    <td className="num">{c._count.requests}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

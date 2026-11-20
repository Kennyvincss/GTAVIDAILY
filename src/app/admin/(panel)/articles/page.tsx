import Link from "next/link";
import { Empty, PageHeader, Pill } from "@/components/admin/ui";
import { SponsoredBadge } from "@/components/Sponsored";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function ArticlesAdmin({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const filter = (await searchParams).filter;
  const articles = await db.article.findMany({
    where: filter === "sponsored" ? { isSponsored: true } : undefined,
    orderBy: { updatedAt: "desc" },
    include: { category: true },
    take: 200,
  });
  return (
    <div>
      <PageHeader
        title="Articles"
        sub="News, guides and sponsored articles."
        action={<Link href="/admin/articles/new" className="btn">New article</Link>}
      />
      <div className="mb-4 flex gap-2 text-sm">
        <Link href="/admin/articles" className={`btn btn-sm ${filter ? "btn-ghost" : ""}`}>All</Link>
        <Link href="/admin/articles?filter=sponsored" className={`btn btn-sm ${filter === "sponsored" ? "" : "btn-ghost"}`}>Sponsored</Link>
      </div>
      {articles.length === 0 ? (
        <Empty>No articles yet.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Published</th></tr></thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link href={`/admin/articles/${a.id}`} className="font-semibold no-underline hover:text-pink">{a.title}</Link>
                    <div className="mt-1 flex gap-2">
                      {a.isSponsored && <SponsoredBadge name={a.sponsorName} />}
                      {a.featured && <span className="text-xs text-aqua">Featured</span>}
                    </div>
                  </td>
                  <td className="text-muted">{a.category?.name ?? "—"}</td>
                  <td><Pill status={a.status} /></td>
                  <td className="text-muted">{formatDate(a.publishedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

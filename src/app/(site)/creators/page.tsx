import type { Metadata } from "next";
import Link from "next/link";
import { CreatorCard } from "@/components/Cards";
import { db } from "@/lib/db";
import { getFeaturedCreators } from "@/lib/monetisation/creators";

export const metadata: Metadata = { title: "Creators" };

export default async function CreatorsPage() {
  const [featured, withClips] = await Promise.all([
    getFeaturedCreators(24),
    db.creator.findMany({
      where: { videos: { some: { status: "published", publishedAt: { lte: new Date() } } } },
      include: { _count: { select: { videos: { where: { status: "published" } } } } },
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
  ]);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">Creators</h1>
          <p className="mt-1 text-muted">The people behind the GTA VI clips on this site.</p>
        </div>
        <Link href="/creators/promote" className="btn">Promote your channel</Link>
      </div>

      {featured.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="eyebrow text-aqua">Featured</h2>
            <span className="text-xs text-muted">Paid promotions</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => (
              <CreatorCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="eyebrow mb-3">Clips from</h2>
        {withClips.length === 0 ? (
          <div className="card p-8 text-center text-muted">No creator clips yet.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {withClips.map((c) => (
              <CreatorCard
                key={c.id}
                c={c}
                href={`/creators/${c.slug}`}
                meta={`${c._count.videos} clip${c._count.videos === 1 ? "" : "s"}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

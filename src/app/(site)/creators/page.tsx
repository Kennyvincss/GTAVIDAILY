import type { Metadata } from "next";
import Link from "next/link";
import { CreatorCard } from "@/components/Cards";
import { getFeaturedCreators } from "@/lib/monetisation/creators";

export const metadata: Metadata = { title: "Featured creators" };

export default async function CreatorsPage() {
  const creators = await getFeaturedCreators(48);
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">Featured creators</h1>
          <p className="mt-1 text-muted">GTA VI channels worth following. Featured placements are paid promotions.</p>
        </div>
        <Link href="/creators/promote" className="btn">Promote your channel</Link>
      </div>
      {creators.length === 0 ? (
        <div className="card p-8 text-center text-muted">
          No creators are featured right now.{" "}
          <Link href="/creators/promote" className="text-aqua underline">Be the first.</Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((c) => (
            <CreatorCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VideoCard } from "@/components/Cards";
import { platformLabel } from "@/lib/clips";
import { db } from "@/lib/db";

async function load(slug: string) {
  return db.creator.findUnique({
    where: { slug },
    include: {
      videos: {
        where: { status: "published", publishedAt: { lte: new Date() } },
        orderBy: { publishedAt: "desc" },
        take: 60,
      },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await load((await params).slug);
  return c ? { title: `${c.name} — GTA VI clips`, description: c.bio || `GTA VI clips by ${c.name}.` } : {};
}

export default async function CreatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const c = await load((await params).slug);
  if (!c) notFound();
  const promoted = c.featured && (!c.featuredUntil || c.featuredUntil > new Date());
  return (
    <div className="space-y-8">
      <header className="card flex flex-wrap items-center gap-4 p-5">
        {c.avatarUrl ? (
          <img src={c.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="grid h-16 w-16 place-items-center rounded-full bg-surface-2 text-2xl font-bold text-pink">
            {c.name.replace(/^@/, "").slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{platformLabel(c.platform)} creator{promoted ? " · Promoted" : ""}</p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl">{c.name}</h1>
          {c.bio && <p className="mt-1 text-sm text-muted">{c.bio}</p>}
        </div>
        <a href={c.channelUrl} target="_blank" rel={promoted ? "sponsored noopener" : "noopener"} className="btn">
          Visit channel ↗
        </a>
      </header>
      <section>
        <h2 className="eyebrow mb-3">Clips on GTA VI Daily</h2>
        {c.videos.length === 0 ? (
          <p className="text-muted">No clips yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {c.videos.map((v) => (
              <VideoCard key={v.id} v={v} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

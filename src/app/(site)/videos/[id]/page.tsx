import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VideoCard } from "@/components/Cards";
import { Sidebar } from "@/components/Sidebar";
import { SponsorDisclosure, SponsoredBadge } from "@/components/Sponsored";
import { VideoEmbed } from "@/components/VideoEmbed";
import { getVideos } from "@/lib/content";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

async function load(id: string) {
  return db.video.findFirst({ where: { id, status: "published", publishedAt: { lte: new Date() } }, include: { category: true } });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const v = await load((await params).id);
  return v ? { title: v.isSponsored ? `${v.title} (Sponsored)` : v.title, description: v.description.slice(0, 160) } : {};
}

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const v = await load((await params).id);
  if (!v) notFound();
  const more = (await getVideos(7)).filter((x) => x.id !== v.id).slice(0, 6);
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <VideoEmbed videoId={v.id} youtubeId={v.youtubeId} title={v.title} />
        <div className="mt-4 flex flex-wrap gap-2">
          {v.category && <span className="eyebrow text-pink">{v.category.name}</span>}
          {v.isSponsored && <SponsoredBadge name={v.sponsorName} />}
        </div>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl sm:text-3xl">{v.title}</h1>
        <p className="mt-1 text-sm text-muted">{formatDate(v.publishedAt)}</p>
        {v.isSponsored && (
          <div className="mt-4">
            <SponsorDisclosure item={v} kind="video" />
          </div>
        )}
        {v.description && <p className="mt-4 whitespace-pre-line text-ink/90">{v.description}</p>}
        {more.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl">More videos</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((m) => (
                <VideoCard key={m.id} v={m} />
              ))}
            </div>
          </section>
        )}
      </div>
      <aside className="min-w-0"><Sidebar from={`/videos/${v.id}`} /></aside>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TikTokEmbed, TwitchClipEmbed } from "@/components/ClipEmbeds";
import { VideoCard } from "@/components/Cards";
import { Sidebar } from "@/components/Sidebar";
import { SponsorDisclosure, SponsoredBadge } from "@/components/Sponsored";
import { VideoEmbed } from "@/components/VideoEmbed";
import { clipWatchUrl, platformLabel } from "@/lib/clips";
import { getVideos } from "@/lib/content";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

async function load(id: string) {
  return db.video.findFirst({
    where: { id, status: "published", publishedAt: { lte: new Date() } },
    include: { category: true, creator: true },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const v = await load((await params).id);
  if (!v) return {};
  const by = v.creator ? ` — clip by ${v.creator.name}` : "";
  return {
    title: v.isSponsored ? `${v.title} (Sponsored)` : v.title,
    description: (v.description || `${v.title}${by}`).slice(0, 160),
  };
}

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const v = await load((await params).id);
  if (!v) notFound();
  const [more, fromCreator] = await Promise.all([
    getVideos(7),
    v.creatorId
      ? db.video.count({ where: { creatorId: v.creatorId, status: "published", NOT: { id: v.id } } })
      : Promise.resolve(0),
  ]);
  const others = more.filter((x) => x.id !== v.id).slice(0, 6);
  const platform = platformLabel(v.platform);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        {v.platform === "tiktok" ? (
          <TikTokEmbed id={v.externalId} title={v.title} />
        ) : v.platform === "twitch" ? (
          <TwitchClipEmbed slug={v.externalId} title={v.title} />
        ) : (
          <VideoEmbed videoId={v.id} youtubeId={v.externalId} title={v.title} />
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {v.category && (
            <Link href={`/category/${v.category.slug}`} className="eyebrow text-pink no-underline">{v.category.name}</Link>
          )}
          {v.isSponsored && <SponsoredBadge name={v.sponsorName} />}
        </div>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl sm:text-3xl">{v.title}</h1>
        <p className="mt-1 text-sm text-muted">{formatDate(v.publishedAt)}</p>

        {v.creator && (
          <div className="card mt-4 flex flex-wrap items-center gap-3 p-4">
            {v.creator.avatarUrl ? (
              <img src={v.creator.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
            ) : (
              <span className="grid h-11 w-11 place-items-center rounded-full bg-surface-2 text-lg font-bold text-pink">
                {v.creator.name.replace(/^@/, "").slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">Clip by</p>
              <Link href={`/creators/${v.creator.slug}`} className="font-bold no-underline hover:text-pink">{v.creator.name}</Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {fromCreator > 0 && (
                <Link href={`/creators/${v.creator.slug}`} className="btn btn-sm btn-ghost">
                  {fromCreator} more clip{fromCreator === 1 ? "" : "s"}
                </Link>
              )}
              <a href={v.creator.channelUrl} target="_blank" rel="noopener" className="btn btn-sm">
                Visit on {platform} ↗
              </a>
            </div>
          </div>
        )}

        {v.isSponsored && (
          <div className="mt-4">
            <SponsorDisclosure item={v} kind="video" />
          </div>
        )}
        {v.description && <p className="mt-4 whitespace-pre-line text-ink/90">{v.description}</p>}
        <p className="mt-4 text-xs text-muted">
          <a href={clipWatchUrl(v)} target="_blank" rel="noopener" className="underline">Watch on {platform}</a>
        </p>

        {others.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl">More videos</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((m) => (
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

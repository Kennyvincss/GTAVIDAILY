import Link from "next/link";
import { AddClipForm } from "@/components/admin/AddClipForm";
import { Empty, PageHeader, Pill, Section } from "@/components/admin/ui";
import { SponsoredBadge } from "@/components/Sponsored";
import { platformLabel } from "@/lib/clips";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function VideosAdmin() {
  const [videos, categories] = await Promise.all([
    db.video.findMany({
      orderBy: { publishedAt: "desc" },
      include: {
        creator: { select: { name: true, id: true } },
        _count: { select: { events: { where: { type: "play" } } } },
      },
      take: 200,
    }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Videos"
        sub="Clips from YouTube, TikTok and Twitch, embedded on the site and credited to their creators."
        action={
          <div className="flex gap-2">
            <Link href="/admin/auto-import" className="btn btn-ghost">Auto-import (YouTube &amp; X)</Link>
            <Link href="/admin/videos/new" className="btn btn-ghost">Add manually</Link>
          </div>
        }
      />

      <Section title="Add a clip from a link" sub="Each clip goes to Videos and whoever posted it is added to Creators (or matched to an existing creator) and credited on the clip. Paste one link, or several — one per line.">
        <AddClipForm categories={categories} />
      </Section>

      {videos.length === 0 ? (
        <Empty>No videos yet.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Video</th><th>Creator</th><th>Status</th><th>Added</th><th className="num">Plays*</th></tr></thead>
            <tbody>
              {videos.map((v) => (
                <tr key={v.id}>
                  <td>
                    <Link href={`/admin/videos/${v.id}`} className="font-semibold no-underline hover:text-pink">{v.title}</Link>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      <span className="text-muted">{platformLabel(v.platform)}</span>
                      {v.featured && <span className="text-aqua">Featured</span>}
                      {v.isSponsored && <SponsoredBadge name={v.sponsorName} />}
                    </div>
                  </td>
                  <td>
                    {v.creator ? (
                      <Link href={`/admin/creators/${v.creator.id}`} className="no-underline hover:text-pink">{v.creator.name}</Link>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td><Pill status={v.status} /></td>
                  <td className="text-muted">{formatDate(v.publishedAt)}</td>
                  <td className="num">{v.platform === "youtube" ? v._count.events : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="p-3 text-xs text-muted">*Plays are measurable for YouTube embeds only; TikTok and Twitch don&apos;t report plays to the embedding site.</p>
        </div>
      )}
    </div>
  );
}

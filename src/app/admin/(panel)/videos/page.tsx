import Link from "next/link";
import { Empty, PageHeader, Pill } from "@/components/admin/ui";
import { SponsoredBadge } from "@/components/Sponsored";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function VideosAdmin() {
  const videos = await db.video.findMany({
    orderBy: { publishedAt: "desc" },
    include: { _count: { select: { events: { where: { type: "play" } } } } },
    take: 200,
  });
  return (
    <div>
      <PageHeader title="Videos" sub="Embedded YouTube videos, featured and sponsored." action={<Link href="/admin/videos/new" className="btn">Add video</Link>} />
      {videos.length === 0 ? (
        <Empty>No videos yet.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Video</th><th>Status</th><th>Published</th><th className="num">Plays (all time)</th></tr></thead>
            <tbody>
              {videos.map((v) => (
                <tr key={v.id}>
                  <td>
                    <Link href={`/admin/videos/${v.id}`} className="font-semibold no-underline hover:text-pink">{v.title}</Link>
                    <div className="mt-1 flex gap-2">
                      {v.featured && <span className="text-xs text-aqua">Featured</span>}
                      {v.isSponsored && <SponsoredBadge name={v.sponsorName} />}
                    </div>
                  </td>
                  <td><Pill status={v.status} /></td>
                  <td className="text-muted">{formatDate(v.publishedAt)}</td>
                  <td className="num">{v._count.events}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

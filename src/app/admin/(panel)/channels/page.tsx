import Link from "next/link";
import { ClipThumb } from "@/components/ClipThumb";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Empty, PageHeader, Pill } from "@/components/admin/ui";
import { clipThumbnail, clipWatchUrl, platformLabel } from "@/lib/clips";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { deleteVideoFromChannel, publishAllFromSource, setVideoStatus } from "../../_actions/imports";

const PREVIEW = 12;

type VideoRow = {
  id: string;
  title: string;
  platform: string;
  externalId: string;
  thumbnailUrl: string | null;
  sourceUrl: string | null;
  status: string;
  publishedAt: Date;
};

const videoSelect = {
  id: true,
  title: true,
  platform: true,
  externalId: true,
  thumbnailUrl: true,
  sourceUrl: true,
  status: true,
  publishedAt: true,
} as const;

function VideoTile({ v }: { v: VideoRow }) {
  return (
    <div className="flex flex-col rounded-xl border border-line p-2.5">
      <a href={clipWatchUrl(v)} target="_blank" rel="noopener noreferrer" className="block aspect-video overflow-hidden rounded-lg">
        <ClipThumb src={clipThumbnail(v)} platform={platformLabel(v.platform)} />
      </a>
      <Link href={`/admin/videos/${v.id}`} className="mt-2 line-clamp-2 text-sm font-semibold no-underline hover:text-pink">
        {v.title}
      </Link>
      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted">
        <span>{formatDate(v.publishedAt)}</span>
        <Pill status={v.status} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {v.status === "draft" ? (
          <form action={setVideoStatus.bind(null, "published")}>
            <input type="hidden" name="id" value={v.id} />
            <button className="btn btn-sm">Publish</button>
          </form>
        ) : (
          <>
            <Link href={`/videos/${v.id}`} className="btn btn-sm btn-ghost">View</Link>
            <form action={setVideoStatus.bind(null, "draft")}>
              <input type="hidden" name="id" value={v.id} />
              <button className="btn btn-sm btn-ghost">Unpublish</button>
            </form>
          </>
        )}
        <form action={deleteVideoFromChannel}>
          <input type="hidden" name="id" value={v.id} />
          <ConfirmButton message={`Delete “${v.title}” from your site? This can't be undone.`} className="btn btn-sm btn-danger">
            Delete
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}

function SourceBlock({
  sourceKey,
  title,
  subtitle,
  href,
  videos,
  total,
  drafts,
  expanded,
}: {
  sourceKey: string;
  title: string;
  subtitle: string;
  href?: string;
  videos: VideoRow[];
  total: number;
  drafts: number;
  expanded: boolean;
}) {
  return (
    <section id={sourceKey} className="card p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-bold">
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className="no-underline hover:text-pink">{title} ↗</a>
            ) : (
              title
            )}
          </h2>
          <p className="text-xs text-muted">
            {subtitle} · {total} video{total === 1 ? "" : "s"}
            {drafts > 0 ? ` · ${drafts} awaiting review` : ""}
          </p>
        </div>
        {drafts > 0 && (
          <form action={publishAllFromSource.bind(null, sourceKey)}>
            <button className="btn btn-sm">Publish all {drafts} draft{drafts === 1 ? "" : "s"}</button>
          </form>
        )}
      </div>
      {videos.length === 0 ? (
        <Empty>No videos imported from here yet.</Empty>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {videos.map((v) => (
            <VideoTile key={v.id} v={v} />
          ))}
        </div>
      )}
      {total > videos.length && !expanded && (
        <div className="mt-3 text-center">
          <Link href={`/admin/channels?source=${encodeURIComponent(sourceKey)}#${sourceKey}`} className="btn btn-sm btn-ghost">
            Show all {total} videos
          </Link>
        </div>
      )}
      {expanded && (
        <div className="mt-3 text-center">
          <Link href="/admin/channels" className="btn btn-sm btn-ghost">Back to all channels</Link>
        </div>
      )}
    </section>
  );
}

export default async function ChannelsPage({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const focus = (await searchParams).source ?? null;
  const take = (key: string) => (focus === key ? 500 : PREVIEW);

  const [yt, xs] = await Promise.all([
    db.youTubeSource.findMany({ orderBy: { createdAt: "asc" } }),
    db.xSource.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const load = async (key: string, where: object) => {
    const [videos, total, drafts] = await Promise.all([
      db.video.findMany({ where, orderBy: { publishedAt: "desc" }, select: videoSelect, take: take(key) }),
      db.video.count({ where }),
      db.video.count({ where: { ...where, status: "draft" } }),
    ]);
    return { videos, total, drafts };
  };

  const blocks = await Promise.all([
    ...yt.map(async (s) => ({
      key: `yt:${s.id}`,
      title: s.title,
      subtitle: `YouTube channel${s.active ? "" : " (paused)"}`,
      href: `https://www.youtube.com/channel/${s.channelId}`,
      ...(await load(`yt:${s.id}`, { importSourceId: s.id })),
    })),
    ...xs.map(async (s) => ({
      key: `x:${s.id}`,
      title: `${s.name} (@${s.username})`,
      subtitle: `X account${s.active ? "" : " (paused)"}`,
      href: `https://x.com/${s.username}`,
      ...(await load(`x:${s.id}`, { xSourceId: s.id })),
    })),
  ]);
  const links = await load("links", { importSourceId: null, xSourceId: null });

  const shown = focus ? blocks.filter((b) => b.key === focus) : blocks;
  const totalVideos = blocks.reduce((n, b) => n + b.total, 0) + links.total;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My channels"
        sub={`Every YouTube channel and X account you've connected, with the videos imported through each — ${totalVideos} video${totalVideos === 1 ? "" : "s"} in total.`}
        action={<Link href="/admin/auto-import" className="btn btn-sm">Connect a channel</Link>}
      />

      {!focus && blocks.length > 0 && (
        <nav className="flex flex-wrap gap-2 text-sm">
          {blocks.map((b) => (
            <a key={b.key} href={`#${b.key}`} className="rounded-full border border-line px-3 py-1 text-muted no-underline hover:text-ink">
              {b.title} <span className="text-xs">({b.total})</span>
            </a>
          ))}
          {links.total > 0 && (
            <a href="#links" className="rounded-full border border-line px-3 py-1 text-muted no-underline hover:text-ink">
              Added from links <span className="text-xs">({links.total})</span>
            </a>
          )}
        </nav>
      )}

      {blocks.length === 0 && !focus && (
        <Empty>
          No channels connected yet. <Link href="/admin/auto-import" className="text-aqua underline">Connect a YouTube channel or X account</Link>.
        </Empty>
      )}

      {shown.map((b) => (
        <SourceBlock
          key={b.key}
          sourceKey={b.key}
          title={b.title}
          subtitle={b.subtitle}
          href={b.href}
          videos={b.videos}
          total={b.total}
          drafts={b.drafts}
          expanded={focus === b.key}
        />
      ))}

      {(!focus || focus === "links") && links.total > 0 && (
        <SourceBlock
          sourceKey="links"
          title="Added from links"
          subtitle="Clips you pasted on the Videos page"
          videos={links.videos}
          total={links.total}
          drafts={links.drafts}
          expanded={focus === "links"}
        />
      )}
    </div>
  );
}

import Link from "next/link";
import { after } from "next/server";
import { FormShell } from "@/components/admin/FormShell";
import { Check, Empty, Field, PageHeader, Pill, Section } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { refreshStale } from "@/lib/importers/run";
import { youtubeThumb } from "@/lib/youtube";
import {
  addYouTubeSource,
  deleteYouTubeSource,
  discardVideo,
  fetchYouTubeSource,
  publishVideo,
  updateYouTubeSource,
} from "../../_actions/imports";

function ago(d: Date | null) {
  if (!d) return "never";
  const m = Math.round((Date.now() - d.getTime()) / 60_000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : formatDate(d);
}

export default async function YouTubeImportPage() {
  // Keep channels fresh in the background whenever an admin looks at this page.
  after(() => refreshStale(60).catch(() => {}));

  const [sources, drafts, categories] = await Promise.all([
    db.youTubeSource.findMany({ orderBy: { createdAt: "asc" }, include: { _count: { select: { videos: true } } } }),
    db.video.findMany({
      where: { status: "draft", importSourceId: { not: null } },
      orderBy: { publishedAt: "desc" },
      include: { importSource: { select: { title: true } } },
      take: 60,
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const CategorySelect = ({ value }: { value?: string | null }) => (
    <select className="select" name="categoryId" defaultValue={value ?? ""}>
      <option value="">No category</option>
      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="YouTube import"
        sub="Connect YouTube channels and their new uploads arrive in Videos automatically. Embedding public YouTube videos is allowed by YouTube's terms."
        action={<Link href="/admin/videos" className="btn btn-ghost btn-sm">All videos</Link>}
      />

      <Section title="Connect a channel" sub="Paste the channel's URL, e.g. https://www.youtube.com/@RockstarGames. Channels are checked about once an hour while you use the admin, and daily via the scheduled job.">
        <FormShell action={addYouTubeSource} submitLabel="Connect channel" resetOnSuccess className="grid items-end gap-3 md:grid-cols-2">
          <Field label="Channel URL or ID" name="channel" required placeholder="https://www.youtube.com/@RockstarGames" className="md:col-span-2" />
          <Field label="Only import videos mentioning (comma-separated, optional)" name="keywords" placeholder="GTA, Grand Theft Auto" hint="Leave blank for channels that only post GTA VI content." />
          <div>
            <label className="label">Category for imported videos</label>
            <CategorySelect />
          </div>
          <Check name="autoPublish" label="Publish new videos immediately (otherwise they wait below for your review)" />
        </FormShell>
      </Section>

      <Section title={`Awaiting review (${drafts.length})`} sub="Imported as drafts. Publish the ones you want on the site.">
        {drafts.length === 0 ? (
          <Empty>Nothing waiting. New uploads from your channels will show up here.</Empty>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {drafts.map((v) => (
              <div key={v.id} className="rounded-xl border border-line p-3">
                <a href={`https://www.youtube.com/watch?v=${v.externalId}`} target="_blank" rel="noopener noreferrer">
                  <img src={youtubeThumb(v.externalId)} alt="" className="aspect-video w-full rounded-lg object-cover" />
                </a>
                <p className="mt-2 line-clamp-2 text-sm font-semibold">{v.title}</p>
                <p className="text-xs text-muted">{v.importSource?.title} · {formatDate(v.publishedAt)}</p>
                <div className="mt-2 flex gap-2">
                  <form action={publishVideo}><input type="hidden" name="id" value={v.id} /><button className="btn btn-sm">Publish</button></form>
                  <Link href={`/admin/videos/${v.id}`} className="btn btn-sm btn-ghost">Edit</Link>
                  <form action={discardVideo}><input type="hidden" name="id" value={v.id} /><button className="btn btn-sm btn-danger">Discard</button></form>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Connected channels">
        {sources.length === 0 ? (
          <Empty>No channels connected yet.</Empty>
        ) : (
          <div className="space-y-3">
            {sources.map((s) => (
              <div key={s.id} className="rounded-xl border border-line p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <a href={`https://www.youtube.com/channel/${s.channelId}`} target="_blank" rel="noopener noreferrer" className="font-semibold">{s.title}</a>
                    <p className="text-xs text-muted">
                      {s._count.videos} videos imported · checked {ago(s.lastFetchedAt)}
                    </p>
                    {s.lastError && <p className="mt-1 text-xs text-bad">Last check failed: {s.lastError}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill status={s.active ? "active" : "inactive"} />
                    <form action={fetchYouTubeSource}><input type="hidden" name="id" value={s.id} /><button className="btn btn-sm btn-ghost">Check now</button></form>
                  </div>
                </div>
                <form action={updateYouTubeSource} className="mt-3 grid items-end gap-3 md:grid-cols-[1.4fr_1fr_auto_auto_auto]">
                  <input type="hidden" name="id" value={s.id} />
                  <div>
                    <label className="label">Keywords</label>
                    <input className="input" name="keywords" defaultValue={s.keywords} placeholder="Import everything" />
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <CategorySelect value={s.categoryId} />
                  </div>
                  <Check name="autoPublish" label="Auto-publish" defaultChecked={s.autoPublish} />
                  <Check name="active" label="Active" defaultChecked={s.active} />
                  <button className="btn btn-sm">Save</button>
                </form>
                <form action={deleteYouTubeSource} className="mt-2 text-right">
                  <input type="hidden" name="id" value={s.id} />
                  <button className="text-xs text-bad">Disconnect (keeps imported videos)</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

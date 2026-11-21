import Link from "next/link";
import { after } from "next/server";
import { FormShell } from "@/components/admin/FormShell";
import { Check, Empty, Field, PageHeader, Pill, Section } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { refreshStale } from "@/lib/importers/run";
import { DEFAULT_GTA6_KEYWORDS, xConfigured } from "@/lib/importers/x";
import { clipThumbnail } from "@/lib/clips";
import { ClipThumb } from "@/components/ClipThumb";
import {
  addXSource,
  addYouTubeSource,
  backfillX,
  deleteXSource,
  deleteYouTubeSource,
  discardVideo,
  fetchXSource,
  fetchYouTubeSource,
  publishVideo,
  updateXSource,
  updateYouTubeSource,
} from "../../_actions/imports";

function ago(d: Date | null) {
  if (!d) return "never";
  const m = Math.round((Date.now() - d.getTime()) / 60_000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : formatDate(d);
}

// Importing an account's back catalogue runs in ~40s chunks inside this limit.
export const maxDuration = 60;

const DepthSelect = () => (
  <select className="select" name="depth" defaultValue="1000">
    <option value="500">last 500 posts (≈ $2.50 max)</option>
    <option value="1000">last 1,000 posts (≈ $5 max)</option>
    <option value="3200">last 3,200 posts, X&apos;s limit (≈ $16 max)</option>
  </select>
);

export default async function AutoImportPage() {
  // Keep channels fresh in the background whenever an admin looks at this page.
  after(() => refreshStale(60).catch(() => {}));

  const xReady = xConfigured();
  const [sources, xSources, drafts, categories] = await Promise.all([
    db.youTubeSource.findMany({ orderBy: { createdAt: "asc" }, include: { _count: { select: { videos: true } } } }),
    db.xSource.findMany({ orderBy: { createdAt: "asc" }, include: { _count: { select: { videos: true } } } }),
    db.video.findMany({
      where: { status: "draft", OR: [{ importSourceId: { not: null } }, { xSourceId: { not: null } }] },
      orderBy: { publishedAt: "desc" },
      include: { importSource: { select: { title: true } }, xSource: { select: { username: true } } },
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
        title="Auto-import"
        sub="Connect YouTube channels and X accounts: their new videos arrive here for review (or go live automatically), credited to the creator."
        action={<Link href="/admin/videos" className="btn btn-ghost btn-sm">All videos</Link>}
      />

      <Section title="YouTube: connect a channel" sub="Paste the channel's URL, e.g. https://www.youtube.com/@RockstarGames. Channels are checked about once an hour while you use the admin, and daily via the scheduled job.">
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
          <Empty>Nothing waiting. New videos from your channels and accounts will show up here.</Empty>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {drafts.map((v) => (
              <div key={v.id} className="rounded-xl border border-line p-3">
                <a href={v.sourceUrl ?? "#"} target="_blank" rel="noopener noreferrer" className="block aspect-video overflow-hidden rounded-lg">
                  <ClipThumb src={clipThumbnail(v)} platform={v.platform === "x" ? "X" : "YouTube"} />
                </a>
                <p className="mt-2 line-clamp-2 text-sm font-semibold">{v.title}</p>
                <p className="text-xs text-muted">{v.xSource ? `@${v.xSource.username} on X` : v.importSource?.title} · {formatDate(v.publishedAt)}</p>
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

      <Section title="Connected YouTube channels">
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

      <Section
        title="X accounts"
        sub="Paste an X profile link: its GTA 6 video posts are imported as clips (embedded from X, credited to the creator), and new ones keep arriving. Uses X's official pay-per-use API; regular checks only ask for posts newer than the last one seen."
      >
        {!xReady ? (
          <div className="space-y-3 text-sm">
            <p className="rounded-lg bg-sunset/10 p-3 text-sunset">X isn&apos;t connected yet. It takes about 10 minutes:</p>
            <ol className="list-decimal space-y-1.5 pl-5 text-muted">
              <li>Sign in at <a href="https://developer.x.com" target="_blank" rel="noopener noreferrer" className="text-aqua underline">developer.x.com</a> with your X account and open the Developer Console.</li>
              <li>Create a project and an app, then buy a small amount of API credit (X charges per post read).</li>
              <li>In the app&apos;s <b>Keys and tokens</b>, copy the <b>Bearer Token</b>.</li>
              <li>In Vercel → your project → <b>Settings → Environment Variables</b>, add <code>X_BEARER_TOKEN</code> with that value, then <b>Redeploy</b>.</li>
            </ol>
            <p className="text-muted">
              No API? You can still add X clips for free: paste several post links at once (one per line) into{" "}
              <Link href="/admin/videos" className="text-aqua underline">Videos → Add a clip from a link</Link>.
            </p>
          </div>
        ) : (
          <FormShell action={addXSource} submitLabel="Connect X account" resetOnSuccess className="grid items-end gap-3 md:grid-cols-2">
            <Field label="X account" name="account" required placeholder="https://x.com/RockstarGames or @RockstarGames" className="md:col-span-2" />
            <Field
              label="Only import posts mentioning (comma-separated)"
              name="keywords"
              defaultValue={DEFAULT_GTA6_KEYWORDS}
              hint="Keeps it to GTA 6 clips. Clear it only for accounts that post nothing but GTA 6."
            />
            <div>
              <label className="label">Category for imported clips</label>
              <CategorySelect />
            </div>
            <Check name="autoPublish" label="Publish clips immediately (otherwise they wait above for your review)" />
            <div className="rounded-lg border border-line p-3 md:col-span-2">
              <Check name="importPast" label="Also import all of their past GTA 6 videos" defaultChecked />
              <p className="mt-1 text-xs text-muted">
                Uses X&apos;s archive search when your API plan includes it — you then pay only for matching posts (about $0.005 each).
                Otherwise it checks the account&apos;s recent posts, up to:
              </p>
              <div className="mt-2 max-w-sm"><DepthSelect /></div>
            </div>
          </FormShell>
        )}

        {xSources.length > 0 && (
          <div className="mt-5 space-y-3">
            {xSources.map((s) => (
              <div key={s.id} className="rounded-xl border border-line p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <a href={`https://x.com/${s.username}`} target="_blank" rel="noopener noreferrer" className="font-semibold">{s.name} <span className="text-muted">@{s.username}</span></a>
                    <p className="text-xs text-muted">
                      {s._count.videos} clip{s._count.videos === 1 ? "" : "s"} imported · checked {ago(s.lastFetchedAt)}
                    </p>
                    {s.lastError && <p className="mt-1 text-xs text-bad">Last check failed: {s.lastError}</p>}
                    <p className="mt-1 text-xs text-muted">
                      Past videos:{" "}
                      {s.backfillStatus === "none"
                        ? "not imported yet"
                        : s.backfillStatus === "running"
                          ? `import in progress (checked ${s.backfillScanned} posts so far) — press Continue`
                          : s.backfillMode === "timeline"
                            ? `all imported (checked their last ${s.backfillScanned} posts)`
                            : "all imported (searched their full history)"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill status={s.active ? "active" : "inactive"} />
                    {xReady && (
                      <form action={fetchXSource}><input type="hidden" name="id" value={s.id} /><button className="btn btn-sm btn-ghost">Check now</button></form>
                    )}
                  </div>
                </div>
                {xReady && (
                  <FormShell
                    action={backfillX}
                    submitLabel={s.backfillStatus === "running" ? "Continue importing" : s.backfillStatus === "done" ? "Re-scan for past GTA 6 videos" : "Import all past GTA 6 videos"}
                    className="mt-3 flex flex-wrap items-end gap-3 rounded-lg bg-surface-2 p-3"
                  >
                    <input type="hidden" name="id" value={s.id} />
                    {s.backfillStatus !== "running" && (
                      <div className="min-w-[16rem]">
                        <label className="label">If archive search isn&apos;t available, check</label>
                        <DepthSelect />
                      </div>
                    )}
                  </FormShell>
                )}
                <form action={updateXSource} className="mt-3 grid items-end gap-3 md:grid-cols-[1.4fr_1fr_auto_auto_auto]">
                  <input type="hidden" name="id" value={s.id} />
                  <div>
                    <label className="label">Keywords</label>
                    <input className="input" name="keywords" defaultValue={s.keywords} placeholder="Import every video post" />
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <CategorySelect value={s.categoryId} />
                  </div>
                  <Check name="autoPublish" label="Auto-publish" defaultChecked={s.autoPublish} />
                  <Check name="active" label="Active" defaultChecked={s.active} />
                  <button className="btn btn-sm">Save</button>
                </form>
                <form action={deleteXSource} className="mt-2 text-right">
                  <input type="hidden" name="id" value={s.id} />
                  <button className="text-xs text-bad">Disconnect (keeps imported clips)</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

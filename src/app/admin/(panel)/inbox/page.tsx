import Link from "next/link";
import { after } from "next/server";
import { FormShell } from "@/components/admin/FormShell";
import { Check, Empty, Field, PageHeader, Pill, Section } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { refreshStale } from "@/lib/importers/run";
import {
  addFeedSource,
  deleteFeedSource,
  draftFromItem,
  fetchAllNow,
  fetchFeedSource,
  setItemStatus,
  updateFeedSource,
} from "../../_actions/imports";

const TABS = [
  { key: "new", label: "New" },
  { key: "drafted", label: "Drafted" },
  { key: "dismissed", label: "Dismissed" },
] as const;

function ago(d: Date | null) {
  if (!d) return "never";
  const m = Math.round((Date.now() - d.getTime()) / 60_000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : formatDate(d);
}

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  after(() => refreshStale(60).catch(() => {}));
  const requested = (await searchParams).status;
  const status = TABS.some((t) => t.key === requested) ? requested! : "new";

  const [items, counts, sources] = await Promise.all([
    db.feedItem.findMany({
      where: { status },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      include: { source: { select: { name: true } } },
      take: 100,
    }),
    db.feedItem.groupBy({ by: ["status"], _count: { _all: true } }),
    db.feedSource.findMany({ orderBy: { createdAt: "asc" }, include: { _count: { select: { items: true } } } }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="News inbox"
        sub="Headlines from the news feeds you follow, as story ideas. “Write about this” opens a draft that credits the source — write the story in your own words; never copy the original text."
        action={
          <form action={fetchAllNow}>
            <button className="btn btn-sm btn-ghost">Check all sources now</button>
          </form>
        }
      />

      <Section title="Story ideas">
        <div className="mb-4 flex flex-wrap gap-1">
          {TABS.map((t) => (
            <Link key={t.key} href={`/admin/inbox?status=${t.key}`} className={`btn btn-sm ${t.key === status ? "" : "btn-ghost"}`}>
              {t.label} ({count(t.key)})
            </Link>
          ))}
        </div>
        {items.length === 0 ? (
          <Empty>
            {sources.length === 0 ? "Add a news feed below to start receiving story ideas." : `No ${status} items.`}
          </Empty>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((i) => (
              <li key={i.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <a href={i.link} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-pink">{i.title}</a>
                  <p className="text-xs text-muted">{i.source.name} · {formatDate(i.publishedAt ?? i.createdAt)}</p>
                  {i.summary && <p className="mt-1 line-clamp-2 text-sm text-muted">{i.summary}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  {i.status === "drafted" && i.articleId ? (
                    <Link href={`/admin/articles/${i.articleId}`} className="btn btn-sm btn-ghost">Open draft</Link>
                  ) : (
                    <form action={draftFromItem}><input type="hidden" name="id" value={i.id} /><button className="btn btn-sm">Write about this</button></form>
                  )}
                  {i.status === "new" && (
                    <form action={setItemStatus.bind(null, "dismissed")}><input type="hidden" name="id" value={i.id} /><button className="btn btn-sm btn-ghost">Dismiss</button></form>
                  )}
                  {i.status === "dismissed" && (
                    <form action={setItemStatus.bind(null, "new")}><input type="hidden" name="id" value={i.id} /><button className="btn btn-sm btn-ghost">Restore</button></form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Add a news feed" sub="Paste a site's homepage, a news section, or its RSS/Atom feed URL — the feed is found automatically when the site advertises one.">
        <FormShell action={addFeedSource} submitLabel="Add feed" resetOnSuccess className="grid items-end gap-3 md:grid-cols-2">
          <Field label="Site or feed URL" name="url" required placeholder="https://www.example-gaming-news.com/" className="md:col-span-2" />
          <Field label="Name (optional)" name="name" placeholder="Taken from the feed if blank" />
          <Field label="Only keep items mentioning (comma-separated)" name="keywords" defaultValue="GTA, Grand Theft Auto, Rockstar" hint="Clear it to keep everything, e.g. for a GTA-only source." />
        </FormShell>
      </Section>

      <Section title="Sources">
        {sources.length === 0 ? (
          <Empty>No feeds yet.</Empty>
        ) : (
          <div className="space-y-3">
            {sources.map((s) => (
              <div key={s.id} className="rounded-xl border border-line p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{s.name}</p>
                    <p className="truncate font-mono text-xs text-muted">{s.url}</p>
                    <p className="text-xs text-muted">{s._count.items} items · checked {ago(s.lastFetchedAt)}</p>
                    {s.lastError && <p className="mt-1 text-xs text-bad">Last check failed: {s.lastError}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill status={s.active ? "active" : "inactive"} />
                    <form action={fetchFeedSource}><input type="hidden" name="id" value={s.id} /><button className="btn btn-sm btn-ghost">Check now</button></form>
                  </div>
                </div>
                <form action={updateFeedSource} className="mt-3 grid items-end gap-3 md:grid-cols-[1fr_1.4fr_auto_auto]">
                  <input type="hidden" name="id" value={s.id} />
                  <div><label className="label">Name</label><input className="input" name="name" defaultValue={s.name} /></div>
                  <div><label className="label">Keywords</label><input className="input" name="keywords" defaultValue={s.keywords} placeholder="Keep everything" /></div>
                  <Check name="active" label="Active" defaultChecked={s.active} />
                  <button className="btn btn-sm">Save</button>
                </form>
                <form action={deleteFeedSource} className="mt-2 text-right">
                  <input type="hidden" name="id" value={s.id} />
                  <button className="text-xs text-bad">Remove feed and its inbox items</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

import Link from "next/link";
import { BarChart, ShareList } from "@/components/admin/BarChart";
import { Empty, PageHeader, Section, Stat } from "@/components/admin/ui";
import { SOURCE_LABELS } from "@/lib/analytics/classify";
import { getDashboard } from "@/lib/analytics/queries";
import { dayKey } from "@/lib/dates";
import { formatMoney, formatNumber, percent } from "@/lib/format";
import { getStream } from "@/lib/monetisation/streams";

const RANGES = [7, 30, 90] as const;

const shortDay = (k: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${k}T00:00:00Z`));
const shortMonth = (k: string) =>
  new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(`${k}-01T00:00:00Z`));

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const requested = Number((await searchParams).days);
  const days = (RANGES as readonly number[]).includes(requested) ? requested : 30;
  const d = await getDashboard(days);

  const today = d.dailyVisitors.find((x) => x.key === dayKey())?.value ?? 0;
  const thisMonth = d.monthlyVisitors.at(-1)?.value ?? 0;
  const entries = d.sources.reduce((s, x) => s + x.visits, 0);
  const revenueByCurrency = new Map<string, number>();
  for (const r of d.revenue) revenueByCurrency.set(r.currency, (revenueByCurrency.get(r.currency) ?? 0) + r.amountCents);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        sub={`First-party data, ${shortDay(d.range.fromDay)} – ${shortDay(d.range.toDay)} (UTC). Bots, admins and Do Not Track visitors are excluded.`}
        action={
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <Link key={r} href={`/admin?days=${r}`} className={`btn btn-sm ${r === days ? "" : "btn-ghost"}`}>
                {r} days
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Visitors today" value={formatNumber(today)} />
        <Stat label="Visitors this month" value={formatNumber(thisMonth)} />
        <Stat label={`Unique visitors (${days}d)`} value={formatNumber(d.uniqueVisitors)} />
        <Stat label={`Page views (${days}d)`} value={formatNumber(d.totalPageViews)} hint={d.uniqueVisitors ? `${(d.totalPageViews / d.uniqueVisitors).toFixed(1)} per visitor` : undefined} />
        <Stat label="Newsletter subscribers" value={formatNumber(d.newsletter.active)} hint={`+${formatNumber(d.newsletter.newInPeriod)} / −${formatNumber(d.newsletter.unsubscribedInPeriod)} in period`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Daily visitors" sub="Unique visitors per UTC day">
          <BarChart data={d.dailyVisitors} label="Daily unique visitors" formatKey={shortDay} />
        </Section>
        <Section title="Monthly visitors" sub="Unique visitors per calendar month, last 12 months">
          <BarChart data={d.monthlyVisitors} label="Monthly unique visitors" formatKey={shortMonth} color="var(--color-sunset)" />
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Most visited articles">
          {d.topArticles.length === 0 ? (
            <Empty>No article views recorded in this period.</Empty>
          ) : (
            <table className="table">
              <thead><tr><th>Article</th><th className="num">Views</th></tr></thead>
              <tbody>
                {d.topArticles.map((r) => (
                  <tr key={r.article!.id}>
                    <td>
                      <Link href={`/news/${r.article!.slug}`} className="no-underline hover:text-pink">{r.article!.title}</Link>
                      {r.article!.isSponsored && <span className="ml-2 text-xs text-sponsor">Sponsored</span>}
                    </td>
                    <td className="num">{formatNumber(r.views)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="Most watched videos" sub="Plays and completions reported by the YouTube player on this site">
          {d.topVideos.length === 0 ? (
            <Empty>No embedded video plays recorded in this period.</Empty>
          ) : (
            <table className="table">
              <thead><tr><th>Video</th><th className="num">Plays</th><th className="num">Completed</th></tr></thead>
              <tbody>
                {d.topVideos.map((r) => (
                  <tr key={r.video!.id}>
                    <td>{r.video!.title}{r.video!.isSponsored && <span className="ml-2 text-xs text-sponsor">Sponsored</span>}</td>
                    <td className="num">{formatNumber(r.plays)}</td>
                    <td className="num">{formatNumber(r.completes)} <span className="text-muted">({percent(r.completes, r.plays)})</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Section title="Traffic sources" sub={`${formatNumber(entries)} visits (landing pages)`}>
          {d.sources.length === 0 ? (
            <Empty>No visits recorded yet.</Empty>
          ) : (
            <ShareList rows={d.sources.map((s) => ({ label: SOURCE_LABELS[s.source] ?? s.source, value: s.visits }))} />
          )}
        </Section>
        <Section title="Top referrers">
          {d.referrers.length === 0 ? (
            <Empty>No referring sites recorded yet.</Empty>
          ) : (
            <ShareList rows={d.referrers.map((r) => ({ label: r.host, value: r.visits }))} />
          )}
        </Section>
        <Section title="Most popular categories" sub="Views of articles, videos and category pages">
          {d.categories.length === 0 ? (
            <Empty>No category views recorded yet.</Empty>
          ) : (
            <ShareList rows={d.categories.map((c) => ({ label: c.category!.name, value: c.views }))} />
          )}
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Newsletter subscriptions" sub="New subscribers per day">
          <BarChart data={d.newsletter.daily} label="New newsletter subscribers per day" formatKey={shortDay} color="var(--color-aqua)" height={120} />
        </Section>
        <Section title="Top pages">
          {d.topPaths.length === 0 ? (
            <Empty>No page views recorded yet.</Empty>
          ) : (
            <table className="table">
              <thead><tr><th>Path</th><th className="num">Views</th></tr></thead>
              <tbody>
                {d.topPaths.map((p) => (
                  <tr key={p.path}><td className="font-mono text-xs">{p.path}</td><td className="num">{formatNumber(p.views)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </div>

      <Section
        title="Advertisement performance"
        sub="Viewable impressions (≥50% on screen for 1s) and clicks measured on this site. AdSense earnings, RPM and fill rate are only available in your AdSense account."
        action={<Link href="/admin/ads" className="text-sm text-muted">Manage ads →</Link>}
      >
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th>Placement</th><th className="num">Direct impressions</th><th className="num">Clicks</th><th className="num">CTR</th><th className="num">AdSense slot views</th></tr>
            </thead>
            <tbody>
              {d.adByPlacement.map((p) => (
                <tr key={p.key}>
                  <td>{p.name}</td>
                  <td className="num">{formatNumber(p.impressions)}</td>
                  <td className="num">{formatNumber(p.clicks)}</td>
                  <td className="num">{percent(p.clicks, p.impressions)}</td>
                  <td className="num">{formatNumber(p.adsenseViews)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {d.adByCampaign.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <p className="eyebrow mb-2">By campaign</p>
            <table className="table">
              <thead><tr><th>Campaign</th><th>Placement</th><th className="num">Impressions</th><th className="num">Clicks</th><th className="num">CTR</th></tr></thead>
              <tbody>
                {d.adByCampaign.map((c) => (
                  <tr key={c.id}>
                    <td><Link href={`/admin/ads/${c.id}`} className="no-underline hover:text-pink">{c.advertiser} — {c.title}</Link></td>
                    <td className="text-muted">{c.placementKey}</td>
                    <td className="num">{formatNumber(c.impressions)}</td>
                    <td className="num">{formatNumber(c.clicks)}</td>
                    <td className="num">{percent(c.clicks, c.impressions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Affiliate clicks" sub="Outbound clicks via /go links. Sales and commission are reported by each affiliate network.">
          {d.affiliate.length === 0 ? (
            <Empty>No affiliate clicks recorded in this period.</Empty>
          ) : (
            <table className="table">
              <thead><tr><th>Product</th><th className="num">Clicks</th></tr></thead>
              <tbody>
                {d.affiliate.map((a) => (
                  <tr key={a.product!.id}><td>{a.product!.name} <span className="text-muted">· {a.product!.merchant}</span></td><td className="num">{formatNumber(a.clicks)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="Recorded revenue" sub="Money actually received, from the revenue ledger" action={<Link href="/admin/revenue" className="text-sm text-muted">Ledger →</Link>}>
          {d.revenue.length === 0 ? (
            <Empty>No revenue recorded in this period.</Empty>
          ) : (
            <>
              <table className="table">
                <thead><tr><th>Stream</th><th className="num">Amount</th></tr></thead>
                <tbody>
                  {d.revenue.map((r) => (
                    <tr key={r.streamKey + r.currency}>
                      <td>{getStream(r.streamKey)?.label ?? r.streamKey}</td>
                      <td className="num">{formatMoney(r.amountCents, r.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-right text-sm font-bold">
                Total: {[...revenueByCurrency.entries()].map(([c, v]) => formatMoney(v, c)).join(" + ")}
              </p>
            </>
          )}
        </Section>
      </div>

      <section>
        <h2 className="mb-3 font-bold">Revenue streams</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {d.streamMetrics.filter((s) => s.metrics.length > 0).map((s) => (
            <Link key={s.key} href={s.adminHref} className="card block p-4 no-underline transition hover:border-pink">
              <p className="font-bold">{s.label}</p>
              <dl className="mt-3 grid grid-cols-2 gap-3">
                {s.metrics.map((m) => (
                  <div key={m.label}>
                    <dt className="text-xs text-muted">{m.label}</dt>
                    <dd className="font-bold tabular-nums">{m.value}</dd>
                    {m.hint && <dd className="text-[0.68rem] text-muted">{m.hint}</dd>}
                  </div>
                ))}
              </dl>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

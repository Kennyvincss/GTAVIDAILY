import Link from "next/link";
import { Empty, PageHeader, Pill, Section } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDate, formatNumber, percent } from "@/lib/format";
import { ensurePlacements } from "@/lib/monetisation/placements";
import { site } from "@/lib/site";
import { savePlacement } from "../../_actions/ads";

function campaignState(c: { active: boolean; startsAt: Date; endsAt: Date | null }) {
  const now = new Date();
  if (!c.active) return "inactive";
  if (c.startsAt > now) return "scheduled";
  if (c.endsAt && c.endsAt <= now) return "ended";
  return "live";
}

export default async function AdsAdmin() {
  await ensurePlacements();
  const [placements, campaigns, stats] = await Promise.all([
    db.adPlacement.findMany({ orderBy: { key: "asc" } }),
    db.adCampaign.findMany({ orderBy: { createdAt: "desc" } }),
    db.adEvent.groupBy({ by: ["campaignId", "type"], where: { campaignId: { not: null } }, _count: { _all: true } }),
  ]);
  const stat = (id: string, t: string) => stats.find((s) => s.campaignId === id && s.type === t)?._count._all ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advertising"
        sub="Configure placements, connect Google AdSense and run directly sold campaigns."
        action={<Link href="/admin/ads/new" className="btn">New campaign</Link>}
      />

      <Section title="Google AdSense">
        {site.adsenseClient ? (
          <p className="text-sm">
            Connected as <code className="text-aqua">{site.adsenseClient}</code>. The AdSense script loads site-wide and{" "}
            <a href="/ads.txt" className="text-aqua underline">/ads.txt</a> is published. Add an ad unit&apos;s slot ID to a
            placement below to serve AdSense there.
          </p>
        ) : (
          <p className="text-sm text-muted">
            Not connected. Set <code>NEXT_PUBLIC_ADSENSE_CLIENT</code> (e.g. <code>ca-pub-…</code>) in the environment and redeploy.
            The AdSense script, account meta tag and <code>/ads.txt</code> are then added automatically. Until then, placements
            only show direct campaigns and render nothing when none are live.
          </p>
        )}
      </Section>

      <Section title="Placements" sub="Auto = a live direct campaign wins, otherwise AdSense fills the slot.">
        <div className="space-y-4">
          {placements.map((p) => (
            <form key={p.key} action={savePlacement} className="grid items-end gap-3 rounded-xl border border-line p-3 md:grid-cols-[1.4fr_auto_1fr_1fr_1fr_auto]">
              <input type="hidden" name="key" value={p.key} />
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-muted">{p.description}</p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="enabled" defaultChecked={p.enabled} className="h-4 w-4 accent-pink" /> Enabled
              </label>
              <div>
                <label className="label">Mode</label>
                <select className="select" name="mode" defaultValue={p.mode}>
                  <option value="auto">Auto</option>
                  <option value="direct">Direct only</option>
                  <option value="adsense">AdSense only</option>
                </select>
              </div>
              <div>
                <label className="label">AdSense slot ID</label>
                <input className="input" name="adsenseSlotId" defaultValue={p.adsenseSlotId ?? ""} placeholder="1234567890" inputMode="numeric" />
              </div>
              <div>
                <label className="label">AdSense format</label>
                <select className="select" name="adsenseFormat" defaultValue={p.adsenseFormat}>
                  {["auto", "horizontal", "vertical", "rectangle", "fluid"].map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <button className="btn btn-sm">Save</button>
            </form>
          ))}
        </div>
      </Section>

      <Section title="Direct campaigns" sub="Sold directly to advertisers. Impressions and clicks are counted all-time.">
        {campaigns.length === 0 ? (
          <Empty>No campaigns yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Campaign</th><th>Placement</th><th>Status</th><th>Dates</th><th className="num">Impr.</th><th className="num">Clicks</th><th className="num">CTR</th></tr></thead>
              <tbody>
                {campaigns.map((c) => {
                  const imp = stat(c.id, "impression");
                  const clk = stat(c.id, "click");
                  return (
                    <tr key={c.id}>
                      <td><Link href={`/admin/ads/${c.id}`} className="font-semibold no-underline hover:text-pink">{c.advertiser}</Link><div className="text-xs text-muted">{c.title}</div></td>
                      <td className="text-muted">{placements.find((p) => p.key === c.placementKey)?.name}</td>
                      <td><Pill status={campaignState(c)} /></td>
                      <td className="text-xs text-muted">{formatDate(c.startsAt)} – {c.endsAt ? formatDate(c.endsAt) : "open"}</td>
                      <td className="num">{formatNumber(imp)}</td>
                      <td className="num">{formatNumber(clk)}</td>
                      <td className="num">{percent(clk, imp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

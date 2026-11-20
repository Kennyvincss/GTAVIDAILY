import Link from "next/link";
import { Empty, PageHeader, Pill, Section, Stat } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { recordSponsorshipPayment, setSponsorshipStatus } from "../../_actions/newsletter";

export default async function NewsletterAdmin() {
  const [active, total, bySource, sponsorships, paid] = await Promise.all([
    db.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
    db.newsletterSubscriber.count(),
    db.newsletterSubscriber.groupBy({ by: ["source"], where: { unsubscribedAt: null }, _count: { _all: true } }),
    db.newsletterSponsorship.findMany({ orderBy: { issueDate: "desc" }, take: 100 }),
    db.revenueEntry.findMany({ where: { sourceType: "newsletter_sponsorship" }, select: { sourceId: true } }),
  ]);
  const paidIds = new Set(paid.map((p) => p.sourceId));
  return (
    <div className="space-y-6">
      <PageHeader
        title="Newsletter"
        sub="Subscribers and sponsored placements for each issue."
        action={
          <div className="flex gap-2">
            <a href="/admin/newsletter/export" className="btn btn-ghost btn-sm">Export subscribers (CSV)</a>
            <Link href="/admin/newsletter/preview" className="btn btn-ghost btn-sm">Build issue</Link>
            <Link href="/admin/newsletter/new" className="btn btn-sm">New sponsorship</Link>
          </div>
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Active subscribers" value={formatNumber(active)} />
        <Stat label="Unsubscribed" value={formatNumber(total - active)} />
        <Stat label="Top signup form" value={bySource.sort((a, b) => b._count._all - a._count._all)[0]?.source ?? "—"} />
      </div>

      {bySource.length > 0 && (
        <Section title="Active subscribers by signup form">
          <div className="flex flex-wrap gap-4 text-sm">
            {bySource.map((s) => (
              <span key={s.source}><span className="text-muted">{s.source}:</span> <b>{formatNumber(s._count._all)}</b></span>
            ))}
          </div>
        </Section>
      )}

      <Section title="Sponsored placements" sub="Sponsored blocks are inserted into the issue builder for their issue date and labelled “Sponsored”.">
        {sponsorships.length === 0 ? (
          <Empty>No newsletter sponsorships yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Issue</th><th>Sponsor</th><th>Position</th><th>Status</th><th className="num">Fee</th><th>Payment</th><th /></tr></thead>
              <tbody>
                {sponsorships.map((s) => (
                  <tr key={s.id}>
                    <td>{formatDate(s.issueDate)}</td>
                    <td><Link href={`/admin/newsletter/${s.id}`} className="font-semibold no-underline hover:text-pink">{s.sponsor}</Link><div className="text-xs text-muted">{s.headline}</div></td>
                    <td className="capitalize text-muted">{s.position}</td>
                    <td><Pill status={s.status} /></td>
                    <td className="num">{s.priceCents != null ? formatMoney(s.priceCents, s.currency) : "—"}</td>
                    <td>
                      {paidIds.has(s.id) ? (
                        <span className="text-xs text-ok">Recorded</span>
                      ) : s.priceCents ? (
                        <form action={recordSponsorshipPayment}>
                          <input type="hidden" name="id" value={s.id} />
                          <button className="btn btn-sm btn-ghost">Record payment</button>
                        </form>
                      ) : null}
                    </td>
                    <td>
                      <form className="flex gap-1">
                        <input type="hidden" name="id" value={s.id} />
                        {s.status !== "sent" && <button formAction={setSponsorshipStatus.bind(null, "sent")} className="btn btn-sm btn-ghost">Mark sent</button>}
                        {s.status === "scheduled" && <button formAction={setSponsorshipStatus.bind(null, "cancelled")} className="btn btn-sm btn-danger">Cancel</button>}
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

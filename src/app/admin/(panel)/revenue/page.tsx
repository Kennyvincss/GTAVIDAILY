import { FormShell } from "@/components/admin/FormShell";
import { Empty, Field, PageHeader, Section } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { REVENUE_STREAMS, getStream } from "@/lib/monetisation/streams";
import { addRevenue, deleteRevenue } from "../../_actions/revenue";

export default async function RevenueAdmin() {
  const [entries, totals] = await Promise.all([
    db.revenueEntry.findMany({ orderBy: { receivedAt: "desc" }, take: 200 }),
    db.revenueEntry.groupBy({ by: ["streamKey", "currency"], _sum: { amountCents: true } }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue ledger"
        sub="Money actually received, per revenue stream. Nothing here is estimated: entries are added when a payment lands (creator promotions and newsletter sponsorships can book themselves when you mark them paid)."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {REVENUE_STREAMS.map((s) => {
          const rows = totals.filter((t) => t.streamKey === s.key);
          return (
            <div key={s.key} className="card p-4">
              <p className="text-xs font-semibold text-muted">{s.label}</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-xl">
                {rows.length ? rows.map((r) => formatMoney(r._sum.amountCents ?? 0, r.currency)).join(" + ") : "—"}
              </p>
              <p className="mt-0.5 text-xs text-muted">{s.description}</p>
            </div>
          );
        })}
      </div>

      <Section title="Record a payment" sub="E.g. a monthly AdSense payout, an affiliate network payment or a paid sponsored-article invoice.">
        <FormShell action={addRevenue} submitLabel="Add entry" className="grid items-end gap-3 md:grid-cols-[1fr_0.6fr_0.5fr_0.7fr]">
          <div>
            <label className="label" htmlFor="streamKey">Stream</label>
            <select className="select" id="streamKey" name="streamKey" required>
              {REVENUE_STREAMS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <Field label="Amount" name="amount" placeholder="120.50" required />
          <div>
            <label className="label" htmlFor="currency">Currency</label>
            <select className="select" id="currency" name="currency" defaultValue="GBP">
              {["GBP", "USD", "EUR"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <Field label="Received on" name="receivedAt" type="date" />
          <Field label="Description" name="description" placeholder="AdSense payout — October" className="md:col-span-4" />
        </FormShell>
      </Section>

      <Section title="Entries">
        {entries.length === 0 ? (
          <Empty>No revenue recorded yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Date</th><th>Stream</th><th>Description</th><th className="num">Amount</th><th /></tr></thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap text-muted">{formatDate(e.receivedAt)}</td>
                    <td>{getStream(e.streamKey)?.label ?? e.streamKey}</td>
                    <td className="text-muted">{e.description}</td>
                    <td className="num">{formatMoney(e.amountCents, e.currency)}</td>
                    <td className="text-right">
                      <form action={deleteRevenue}>
                        <input type="hidden" name="id" value={e.id} />
                        <button className="text-xs text-bad">Delete</button>
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

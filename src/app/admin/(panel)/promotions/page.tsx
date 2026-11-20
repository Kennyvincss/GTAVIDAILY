import Link from "next/link";
import { FormShell } from "@/components/admin/FormShell";
import { Check, Empty, Field, PageHeader, Pill, Section } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { centsToInput, formatDate, formatMoney } from "@/lib/format";
import { REQUEST_STATUSES, completeExpiredPromotions } from "@/lib/monetisation/creators";
import { activateRequest, deletePackage, endRequest, reviewRequest, savePackage } from "../../_actions/promotions";

type Pkg = { id: string; name: string; description: string; priceCents: number; currency: string; durationDays: number; active: boolean; sortOrder: number };

function PackageForm({ p }: { p?: Pkg }) {
  return (
    <FormShell action={savePackage} submitLabel={p ? "Save" : "Add package"} resetOnSuccess={!p} className="grid items-end gap-3 md:grid-cols-[1.3fr_0.7fr_0.6fr_0.6fr_0.5fr]">
      <input type="hidden" name="id" value={p?.id ?? ""} />
      <Field label="Package name" name="name" defaultValue={p?.name} required />
      <Field label="Price" name="price" defaultValue={centsToInput(p?.priceCents)} placeholder="49.00" required />
      <div>
        <label className="label">Currency</label>
        <select className="select" name="currency" defaultValue={p?.currency ?? "GBP"}>
          {["GBP", "USD", "EUR"].map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <Field label="Days featured" name="durationDays" type="number" defaultValue={p?.durationDays ?? 7} required />
      <Field label="Order" name="sortOrder" type="number" defaultValue={p?.sortOrder ?? 0} />
      <Field label="Description shown to creators" name="description" defaultValue={p?.description} className="md:col-span-4" />
      <Check name="active" label="Available" defaultChecked={p?.active ?? true} />
    </FormShell>
  );
}

export default async function PromotionsAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await completeExpiredPromotions();
  const status = (await searchParams).status;
  const filter = (REQUEST_STATUSES as readonly string[]).includes(status ?? "") ? status! : "pending";
  const [packages, requests, counts] = await Promise.all([
    db.promotionPackage.findMany({ orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }] }),
    db.promotionRequest.findMany({ where: { status: filter }, orderBy: { createdAt: "desc" }, include: { package: true }, take: 100 }),
    db.promotionRequest.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Creator promotion"
        sub="Set pricing, review requests from creators, and start paid featured placements."
        action={<Link href="/creators/promote" className="btn btn-ghost btn-sm">View public page ↗</Link>}
      />

      <Section title="Pricing" sub="Packages creators can choose on /creators/promote. Prices are snapshotted onto each request.">
        <div className="space-y-4">
          {packages.map((p) => (
            <div key={p.id} className="rounded-xl border border-line p-3">
              <PackageForm p={p} />
              <form action={deletePackage} className="mt-2 text-right">
                <input type="hidden" name="id" value={p.id} />
                <button className="text-xs text-bad">Delete package</button>
              </form>
            </div>
          ))}
          <div className="rounded-xl border border-dashed border-line p-3">
            <p className="mb-2 text-sm font-semibold">New package</p>
            <PackageForm />
          </div>
        </div>
      </Section>

      <Section title="Requests">
        <div className="mb-4 flex flex-wrap gap-1">
          {REQUEST_STATUSES.map((s) => (
            <Link key={s} href={`/admin/promotions?status=${s}`} className={`btn btn-sm capitalize ${s === filter ? "" : "btn-ghost"}`}>
              {s === "approved" ? "awaiting payment" : s} ({count(s)})
            </Link>
          ))}
        </div>
        {requests.length === 0 ? (
          <Empty>No {filter} requests.</Empty>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => (
              <article key={r.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      {r.creatorName} <span className="text-sm font-normal text-muted">· {r.platform}</span>
                    </p>
                    <a href={r.channelUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-aqua underline">{r.channelUrl}</a>
                    <p className="text-sm text-muted">{r.email}</p>
                  </div>
                  <div className="text-right">
                    <Pill status={r.status} />
                    <p className="mt-1 font-bold">{formatMoney(r.priceCents, r.currency)}</p>
                    <p className="text-xs text-muted">{r.package?.name ?? "Package removed"} · {r.durationDays} days</p>
                    <p className="text-xs text-muted">Requested {formatDate(r.createdAt)}</p>
                  </div>
                </div>
                {r.bio && <p className="mt-2 text-sm"><span className="text-muted">Bio:</span> {r.bio}</p>}
                {r.message && <p className="mt-1 whitespace-pre-line text-sm"><span className="text-muted">Message:</span> {r.message}</p>}
                {r.startsAt && (
                  <p className="mt-2 text-sm text-muted">Featured {formatDate(r.startsAt)} – {formatDate(r.endsAt)}</p>
                )}

                {r.status === "pending" && (
                  <form className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input type="hidden" name="id" value={r.id} />
                    <input className="input" name="adminNotes" placeholder="Internal notes (optional)" defaultValue={r.adminNotes} />
                    <button formAction={reviewRequest.bind(null, "approved")} className="btn btn-sm">Approve</button>
                    <button formAction={reviewRequest.bind(null, "rejected")} className="btn btn-sm btn-danger">Reject</button>
                  </form>
                )}
                {(r.status === "approved" || r.status === "pending") && (
                  <form action={activateRequest} className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-surface-2 p-3">
                    <input type="hidden" name="id" value={r.id} />
                    <label className="text-sm">
                      Start <input type="date" name="startsAt" className="input ml-1 inline-block w-auto" />
                    </label>
                    <Check name="recordPayment" label={`Payment received — record ${formatMoney(r.priceCents, r.currency)} in revenue`} defaultChecked />
                    <button className="btn btn-sm">Start featuring</button>
                  </form>
                )}
                {r.status === "active" && (
                  <form action={endRequest} className="mt-3">
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn btn-sm btn-ghost">End promotion now</button>
                  </form>
                )}
                {r.adminNotes && r.status !== "pending" && <p className="mt-2 text-xs text-muted">Notes: {r.adminNotes}</p>}
              </article>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

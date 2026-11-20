import { notFound } from "next/navigation";
import { FormShell } from "@/components/admin/FormShell";
import { BackLink, Check, Field, PageHeader, dtLocal } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { PLACEMENTS } from "@/lib/monetisation/placements";
import { deleteCampaign, saveCampaign } from "../../../_actions/ads";

export default async function EditCampaign({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = id === "new" ? null : await db.adCampaign.findUnique({ where: { id } });
  if (id !== "new" && !c) notFound();
  return (
    <div className="max-w-2xl">
      <BackLink href="/admin/ads">Advertising</BackLink>
      <PageHeader title={c ? "Edit campaign" : "New campaign"} sub="Shown with an “Advertisement” label. Clicks go through /go/ad/… so they are counted." />
      <FormShell action={saveCampaign}>
        <input type="hidden" name="id" value={c?.id ?? ""} />
        <div>
          <label className="label" htmlFor="placementKey">Placement</label>
          <select className="select" id="placementKey" name="placementKey" defaultValue={c?.placementKey ?? "homepage_banner"}>
            {PLACEMENTS.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Advertiser" name="advertiser" defaultValue={c?.advertiser} required />
          <Field label="Weight (1–100)" name="weight" type="number" defaultValue={c?.weight ?? 1} hint="Share of rotation when several campaigns are live." />
        </div>
        <Field label="Headline" name="title" defaultValue={c?.title} required />
        <Field label="Supporting text (optional)" name="body" defaultValue={c?.body} />
        <Field label="Image URL (optional)" name="imageUrl" type="url" defaultValue={c?.imageUrl} placeholder="https://" />
        <Field label="Destination URL" name="targetUrl" type="url" defaultValue={c?.targetUrl} required placeholder="https://" hint="Include the advertiser's UTM tags if they want them." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts (UTC)" name="startsAt" type="datetime-local" defaultValue={dtLocal(c?.startsAt)} />
          <Field label="Ends (UTC, optional)" name="endsAt" type="datetime-local" defaultValue={dtLocal(c?.endsAt)} />
        </div>
        <Check name="active" label="Active" defaultChecked={c?.active ?? true} />
      </FormShell>
      {c && (
        <form action={deleteCampaign} className="mt-8 border-t border-line pt-4">
          <input type="hidden" name="id" value={c.id} />
          <button className="btn btn-sm btn-danger">Delete campaign</button>
        </form>
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import { FormShell } from "@/components/admin/FormShell";
import { BackLink, Field, PageHeader, dateOnly } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { centsToInput } from "@/lib/format";
import { deleteSponsorship, saveSponsorship } from "../../../_actions/newsletter";

export default async function EditSponsorship({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = id === "new" ? null : await db.newsletterSponsorship.findUnique({ where: { id } });
  if (id !== "new" && !s) notFound();
  return (
    <div className="max-w-2xl">
      <BackLink href="/admin/newsletter">Newsletter</BackLink>
      <PageHeader title={s ? "Edit sponsorship" : "New newsletter sponsorship"} />
      <FormShell action={saveSponsorship}>
        <input type="hidden" name="id" value={s?.id ?? ""} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sponsor" name="sponsor" defaultValue={s?.sponsor} required />
          <Field label="Issue date" name="issueDate" type="date" defaultValue={dateOnly(s?.issueDate)} required />
        </div>
        <Field label="Headline" name="headline" defaultValue={s?.headline} required />
        <div>
          <label className="label" htmlFor="body">Copy</label>
          <textarea className="textarea font-sans" id="body" name="body" defaultValue={s?.body ?? ""} maxLength={1000} required />
        </div>
        <Field label="Link" name="targetUrl" type="url" defaultValue={s?.targetUrl} required placeholder="https://" />
        <Field label="Image URL (optional)" name="imageUrl" type="url" defaultValue={s?.imageUrl} />
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="position">Position in issue</label>
            <select className="select" id="position" name="position" defaultValue={s?.position ?? "top"}>
              <option value="top">Top</option>
              <option value="middle">Middle</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
          <Field label="Agreed fee (optional)" name="price" defaultValue={centsToInput(s?.priceCents)} placeholder="150.00" />
          <div>
            <label className="label" htmlFor="currency">Currency</label>
            <select className="select" id="currency" name="currency" defaultValue={s?.currency ?? "GBP"}>
              {["GBP", "USD", "EUR"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </FormShell>
      {s && (
        <form action={deleteSponsorship} className="mt-8 border-t border-line pt-4">
          <input type="hidden" name="id" value={s.id} />
          <button className="btn btn-sm btn-danger">Delete sponsorship</button>
        </form>
      )}
    </div>
  );
}

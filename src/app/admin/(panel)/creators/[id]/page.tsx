import { notFound } from "next/navigation";
import { FormShell } from "@/components/admin/FormShell";
import { BackLink, Check, Field, PageHeader, dateOnly } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { CREATOR_PLATFORMS } from "@/lib/monetisation/creators";
import { deleteCreator, saveCreator } from "../../../_actions/promotions";

export default async function EditCreator({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = id === "new" ? null : await db.creator.findUnique({ where: { id } });
  if (id !== "new" && !c) notFound();
  return (
    <div className="max-w-2xl">
      <BackLink href="/admin/creators">Creators</BackLink>
      <PageHeader title={c ? c.name : "Add creator"} />
      <FormShell action={saveCreator}>
        <input type="hidden" name="id" value={c?.id ?? ""} />
        <Field label="Name" name="name" defaultValue={c?.name} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="platform">Platform</label>
            <select className="select" id="platform" name="platform" defaultValue={c?.platform ?? "youtube"}>
              {CREATOR_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <Field label="Channel URL" name="channelUrl" type="url" defaultValue={c?.channelUrl} required />
        </div>
        <Field label="Avatar URL" name="avatarUrl" type="url" defaultValue={c?.avatarUrl} />
        <Field label="Bio (max 280)" name="bio" defaultValue={c?.bio} />
        <div className="grid items-end gap-4 sm:grid-cols-2">
          <Check name="featured" label="Featured" defaultChecked={c?.featured} />
          <Field label="Featured until (optional)" name="featuredUntil" type="date" defaultValue={dateOnly(c?.featuredUntil)} hint="Leave blank for no end date." />
        </div>
      </FormShell>
      {c && (
        <form action={deleteCreator} className="mt-8 border-t border-line pt-4">
          <input type="hidden" name="id" value={c.id} />
          <button className="btn btn-sm btn-danger">Delete creator</button>
        </form>
      )}
    </div>
  );
}

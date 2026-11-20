import { notFound } from "next/navigation";
import { FormShell } from "@/components/admin/FormShell";
import { BackLink, Check, Field, PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { deleteProduct, saveProduct } from "../../../_actions/affiliates";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = id === "new" ? null : await db.affiliateProduct.findUnique({ where: { id } });
  if (id !== "new" && !p) notFound();
  return (
    <div className="max-w-2xl">
      <BackLink href="/admin/affiliates">Affiliates</BackLink>
      <PageHeader title={p ? "Edit product" : "Add product"} />
      <FormShell action={saveProduct}>
        <input type="hidden" name="id" value={p?.id ?? ""} />
        <Field label="Product name" name="name" defaultValue={p?.name} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Merchant" name="merchant" defaultValue={p?.merchant} required placeholder="Amazon UK" />
          <Field label="Slug" name="slug" defaultValue={p?.slug} hint="Used in /go/<slug>. Blank = from name." />
        </div>
        <Field
          label="Affiliate tracking URL"
          name="affiliateUrl"
          defaultValue={p?.affiliateUrl}
          required
          placeholder="https://www.amazon.co.uk/dp/XXXX?tag=yourtag-21"
          hint="Paste the full tracking link from your affiliate network. Optional: add {clickId} where the network accepts a sub-ID (e.g. &subid={clickId}) to match conversions to clicks."
        />
        <Field label="Short description" name="description" defaultValue={p?.description} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Price label (optional)" name="priceText" defaultValue={p?.priceText} placeholder="£59.99" hint="Keep it current, or leave blank." />
          <Field label="Category" name="category" defaultValue={p?.category ?? "Gear"} placeholder="Controllers" />
          <Field label="Order" name="sortOrder" type="number" defaultValue={p?.sortOrder ?? 0} />
        </div>
        <Field label="Image URL" name="imageUrl" type="url" defaultValue={p?.imageUrl} />
        <Check name="active" label="Active" defaultChecked={p?.active ?? true} />
      </FormShell>
      {p && (
        <form action={deleteProduct} className="mt-8 border-t border-line pt-4">
          <input type="hidden" name="id" value={p.id} />
          <button className="btn btn-sm btn-danger">Delete product</button>
        </form>
      )}
    </div>
  );
}

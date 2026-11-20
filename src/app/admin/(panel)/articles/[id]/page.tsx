import { notFound } from "next/navigation";
import { FormShell } from "@/components/admin/FormShell";
import { SponsorFields } from "@/components/admin/SponsorFields";
import { BackLink, Check, Field, PageHeader, dtLocal } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { deleteArticle, saveArticle } from "../../../_actions/content";

export default async function EditArticle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = id === "new" ? null : await db.article.findUnique({ where: { id } });
  if (id !== "new" && !article) notFound();
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-3xl">
      <BackLink href="/admin/articles">Articles</BackLink>
      <PageHeader title={article ? "Edit article" : "New article"} />
      <FormShell action={saveArticle}>
        <input type="hidden" name="id" value={article?.id ?? ""} />
        <Field label="Title" name="title" defaultValue={article?.title} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Slug" name="slug" defaultValue={article?.slug} hint="Leave blank to generate from the title." />
          <div>
            <label className="label" htmlFor="categoryId">Category</label>
            <select className="select" id="categoryId" name="categoryId" defaultValue={article?.categoryId ?? ""}>
              <option value="">None</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="excerpt">Excerpt</label>
          <input className="input" id="excerpt" name="excerpt" defaultValue={article?.excerpt ?? ""} maxLength={400} />
        </div>
        <Field label="Cover image URL" name="coverImage" type="url" defaultValue={article?.coverImage} placeholder="https://" />
        <div>
          <label className="label" htmlFor="body">Body (Markdown)</label>
          <textarea className="textarea min-h-[22rem]" id="body" name="body" defaultValue={article?.body ?? ""} />
          <p className="mt-1 text-xs text-muted">The in-article ad slot is inserted automatically after the third paragraph.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select className="select" id="status" name="status" defaultValue={article?.status ?? "draft"}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <Field label="Publish at (UTC)" name="publishedAt" type="datetime-local" defaultValue={dtLocal(article?.publishedAt)} hint="Future dates schedule the article." />
        </div>
        <Check name="featured" label="Feature on homepage" defaultChecked={article?.featured} />
        <SponsorFields item={article} kind="article" />
      </FormShell>
      {article && (
        <form action={deleteArticle} className="mt-8 border-t border-line pt-4">
          <input type="hidden" name="id" value={article.id} />
          <button className="btn btn-sm btn-danger">Delete article</button>
        </form>
      )}
    </div>
  );
}

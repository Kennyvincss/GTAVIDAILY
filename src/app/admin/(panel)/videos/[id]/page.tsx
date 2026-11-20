import { notFound } from "next/navigation";
import { FormShell } from "@/components/admin/FormShell";
import { SponsorFields } from "@/components/admin/SponsorFields";
import { BackLink, Check, Field, PageHeader, dtLocal } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { deleteVideo, saveVideo } from "../../../_actions/content";

export default async function EditVideo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = id === "new" ? null : await db.video.findUnique({ where: { id } });
  if (id !== "new" && !video) notFound();
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="max-w-3xl">
      <BackLink href="/admin/videos">Videos</BackLink>
      <PageHeader title={video ? "Edit video" : "Add video"} />
      <FormShell action={saveVideo}>
        <input type="hidden" name="id" value={video?.id ?? ""} />
        <Field label="Title" name="title" defaultValue={video?.title} required />
        <Field label="YouTube URL or video ID" name="youtube" defaultValue={video ? `https://www.youtube.com/watch?v=${video.youtubeId}` : ""} required />
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea className="textarea font-sans" id="description" name="description" defaultValue={video?.description ?? ""} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="categoryId">Category</label>
            <select className="select" id="categoryId" name="categoryId" defaultValue={video?.categoryId ?? ""}>
              <option value="">None</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select className="select" id="status" name="status" defaultValue={video?.status ?? "published"}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <Field label="Publish at (UTC)" name="publishedAt" type="datetime-local" defaultValue={dtLocal(video?.publishedAt)} />
        </div>
        <Check name="featured" label="Featured video (shown first on Videos and the homepage)" defaultChecked={video?.featured} />
        <SponsorFields item={video} kind="video" />
      </FormShell>
      {video && (
        <form action={deleteVideo} className="mt-8 border-t border-line pt-4">
          <input type="hidden" name="id" value={video.id} />
          <button className="btn btn-sm btn-danger">Delete video</button>
        </form>
      )}
    </div>
  );
}

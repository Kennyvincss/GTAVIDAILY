import Link from "next/link";
import { PageHeader, Pill, Section } from "@/components/admin/ui";
import { ALL_PACK_ARTICLES, ARTICLE_BATCHES } from "@/content/articles";
import { db } from "@/lib/db";
import { autoPublishPack } from "@/lib/content-pack";
import { importAllStarters, importStarter, publishAllStarters } from "../../_actions/starter";

export default async function StarterArticlesPage() {
  const slugs = ALL_PACK_ARTICLES.map((a) => a.slug);
  const [existing, imported] = await Promise.all([
    db.article.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true, status: true } }),
    db.contentPackImport.findMany({ where: { slug: { in: slugs } }, select: { slug: true } }),
  ]);
  const bySlug = new Map(existing.map((e) => [e.slug, e]));
  const wasImported = new Set(imported.map((i) => i.slug));
  const notYet = ALL_PACK_ARTICLES.filter((a) => !bySlug.has(a.slug) && !wasImported.has(a.slug)).length;
  const drafts = existing.filter((e) => e.status === "draft").length;
  const auto = autoPublishPack();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Researched articles"
        sub={`${ALL_PACK_ARTICLES.length} articles researched from Rockstar, Take-Two and major outlets, written in original wording with sources at the end of each. New ones are added ${auto ? "and published automatically" : "as drafts"} every time the site deploys.`}
        action={
          <div className="flex flex-wrap gap-2">
            {notYet > 0 && (
              <form action={importAllStarters}>
                <button className="btn">Add {notYet} new now</button>
              </form>
            )}
            {drafts > 0 && (
              <form action={publishAllStarters}>
                <button className="btn btn-ghost">Publish {drafts} draft{drafts === 1 ? "" : "s"}</button>
              </form>
            )}
          </div>
        }
      />

      {[...ARTICLE_BATCHES].reverse().map((batch) => (
        <Section key={batch.id} title={batch.label} sub={`Added ${batch.addedOn} · ${batch.articles.length} articles`}>
          <ul className="divide-y divide-line">
            {batch.articles.map((a) => {
              const row = bySlug.get(a.slug);
              const removed = !row && wasImported.has(a.slug);
              return (
                <li key={a.slug} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-xs uppercase tracking-wider text-muted">{a.category}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {row ? (
                      <>
                        <Pill status={row.status} />
                        {row.status === "published" && (
                          <Link href={`/news/${a.slug}`} className="btn btn-sm btn-ghost">View</Link>
                        )}
                        <Link href={`/admin/articles/${row.id}`} className="btn btn-sm btn-ghost">Edit</Link>
                      </>
                    ) : (
                      <>
                        {removed && <span className="text-xs text-muted">Deleted</span>}
                        <form action={importStarter.bind(null, a.slug)}>
                          <button className="btn btn-sm">{removed ? "Bring back" : "Add now"}</button>
                        </form>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>
      ))}
    </div>
  );
}

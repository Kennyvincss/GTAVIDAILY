import Link from "next/link";
import { PageHeader, Pill, Section } from "@/components/admin/ui";
import { STARTER_ARTICLES, STARTER_RESEARCHED_ON } from "@/content/starter-articles";
import { db } from "@/lib/db";
import { importAllStarters, importStarter, publishAllStarters } from "../../_actions/starter";

export default async function StarterArticlesPage() {
  const existing = await db.article.findMany({
    where: { slug: { in: STARTER_ARTICLES.map((a) => a.slug) } },
    select: { id: true, slug: true, status: true },
  });
  const bySlug = new Map(existing.map((e) => [e.slug, e]));
  const notImported = STARTER_ARTICLES.filter((a) => !bySlug.has(a.slug)).length;
  const drafts = existing.filter((e) => e.status === "draft").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ready-made articles"
        sub={`${STARTER_ARTICLES.length} articles researched from Rockstar's announcements and major outlets on ${STARTER_RESEARCHED_ON}, written in original wording with sources listed at the end of each. They import as drafts so you can read and edit them first.`}
        action={
          <div className="flex gap-2">
            {notImported > 0 && (
              <form action={importAllStarters}>
                <button className="btn">Import all {notImported} as drafts</button>
              </form>
            )}
            {drafts > 0 && (
              <form action={publishAllStarters}>
                <button className="btn btn-ghost">Publish {drafts} imported draft{drafts === 1 ? "" : "s"}</button>
              </form>
            )}
          </div>
        }
      />

      <Section title="Articles" sub="Some articles link to each other, so those links work once all of them are published. Time-sensitive facts (scores, sales, online plans) were correct on the research date; update them as news changes.">
        <ul className="divide-y divide-line">
          {STARTER_ARTICLES.map((a) => {
            const row = bySlug.get(a.slug);
            const importThis = importStarter.bind(null, a.slug);
            return (
              <li key={a.slug} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-xs uppercase tracking-wider text-muted">{a.category}</p>
                  <p className="mt-1 text-sm text-muted">{a.excerpt}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {row ? (
                    <>
                      <Pill status={row.status} />
                      <Link href={`/admin/articles/${row.id}`} className="btn btn-sm btn-ghost">Review &amp; edit</Link>
                    </>
                  ) : (
                    <form action={importThis}><button className="btn btn-sm">Import as draft</button></form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
}

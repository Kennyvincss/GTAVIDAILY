import Link from "next/link";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/Cards";
import { Sidebar } from "@/components/Sidebar";
import { getLatestArticles } from "@/lib/content";

export const metadata: Metadata = { title: "News" };
const PER_PAGE = 12;

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const articles = await getLatestArticles(PER_PAGE + 1, (page - 1) * PER_PAGE);
  const hasNext = articles.length > PER_PAGE;
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <h1 className="mb-6 font-[family-name:var(--font-display)] text-3xl">Latest news</h1>
        {articles.length === 0 && <p className="text-muted">No articles here yet.</p>}
        <div className="grid gap-8 sm:grid-cols-2">
          {articles.slice(0, PER_PAGE).map((a) => (
            <ArticleCard key={a.id} a={a} />
          ))}
        </div>
        <div className="mt-8 flex justify-between">
          {page > 1 ? <Link className="btn btn-ghost" href={`/news?page=${page - 1}`}>← Newer</Link> : <span />}
          {hasNext && <Link className="btn btn-ghost" href={`/news?page=${page + 1}`}>Older →</Link>}
        </div>
      </div>
      <aside className="min-w-0"><Sidebar from="/news" /></aside>
    </div>
  );
}

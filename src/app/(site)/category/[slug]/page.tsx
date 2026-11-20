import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/Cards";
import { Sidebar } from "@/components/Sidebar";
import { getLatestArticles } from "@/lib/content";
import { db } from "@/lib/db";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await db.category.findUnique({ where: { slug: (await params).slug } });
  return c ? { title: c.name } : {};
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await db.category.findUnique({ where: { slug } });
  if (!category) notFound();
  const articles = await getLatestArticles(24, 0, category.id);
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <p className="eyebrow">Category</p>
        <h1 className="mb-6 font-[family-name:var(--font-display)] text-3xl">{category.name}</h1>
        {articles.length === 0 && <p className="text-muted">No articles in this category yet.</p>}
        <div className="grid gap-8 sm:grid-cols-2">
          {articles.map((a) => (
            <ArticleCard key={a.id} a={a} />
          ))}
        </div>
      </div>
      <aside className="min-w-0"><Sidebar from={`/category/${slug}`} /></aside>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard, VideoCard } from "@/components/Cards";
import { Sidebar } from "@/components/Sidebar";
import { getLatestArticles, getVideos } from "@/lib/content";
import { db } from "@/lib/db";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await db.category.findUnique({ where: { slug: (await params).slug } });
  return c ? { title: c.name } : {};
}

/** A category collects both articles and videos tagged with it (e.g. Trailers is mostly videos). */
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await db.category.findUnique({ where: { slug } });
  if (!category) notFound();
  const [articles, videos] = await Promise.all([
    getLatestArticles(24, 0, category.id),
    getVideos(12, { categoryId: category.id }),
  ]);
  // Lead with whichever the category mostly contains.
  const videosFirst = videos.length > articles.length;

  const videoSection = videos.length > 0 && (
    <section key="videos">
      <h2 className="eyebrow mb-3">Videos</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {videos.map((v) => (
          <VideoCard key={v.id} v={v} />
        ))}
      </div>
    </section>
  );
  const articleSection = articles.length > 0 && (
    <section key="articles">
      {videos.length > 0 && <h2 className="eyebrow mb-3">Articles</h2>}
      <div className="grid gap-8 sm:grid-cols-2">
        {articles.map((a) => (
          <ArticleCard key={a.id} a={a} />
        ))}
      </div>
    </section>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-10">
        <header>
          <p className="eyebrow">Category</p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">{category.name}</h1>
        </header>
        {articles.length === 0 && videos.length === 0 ? (
          <div className="card p-8 text-center text-muted">
            Nothing in {category.name} yet — check back soon, or catch up on the{" "}
            <Link href="/news" className="text-aqua underline">latest news</Link>.
          </div>
        ) : videosFirst ? (
          [videoSection, articleSection]
        ) : (
          [articleSection, videoSection]
        )}
      </div>
      <aside className="min-w-0"><Sidebar from={`/category/${slug}`} /></aside>
    </div>
  );
}

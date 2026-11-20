import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { AdSlot } from "@/components/ads/AdSlot";
import { ArticleCard } from "@/components/Cards";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Sidebar } from "@/components/Sidebar";
import { SponsorDisclosure, SponsoredBadge } from "@/components/Sponsored";
import { articleWhere, getLatestArticles } from "@/lib/content";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { renderArticleChunks } from "@/lib/markdown";

async function load(slug: string) {
  return db.article.findFirst({ where: { slug, ...articleWhere() }, include: { category: true } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await load((await params).slug);
  if (!a) return {};
  return {
    title: a.isSponsored ? `${a.title} (Sponsored)` : a.title,
    description: a.excerpt,
    openGraph: { title: a.title, description: a.excerpt, images: a.coverImage ? [a.coverImage] : [] },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await load(slug);
  if (!a) notFound();
  const chunks = renderArticleChunks(a.body, 3);
  const related = (await getLatestArticles(4, 0, a.categoryId ?? undefined)).filter((r) => r.id !== a.id).slice(0, 3);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
      <article className="min-w-0">
        <header>
          <div className="flex flex-wrap items-center gap-2">
            {a.category && (
              <Link href={`/category/${a.category.slug}`} className="eyebrow text-pink no-underline">
                {a.category.name}
              </Link>
            )}
            {a.isSponsored && <SponsoredBadge name={a.sponsorName} />}
          </div>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl leading-tight sm:text-4xl">{a.title}</h1>
          <p className="mt-3 text-lg text-muted">{a.excerpt}</p>
          <p className="mt-3 text-sm text-muted">{formatDate(a.publishedAt)}</p>
        </header>

        {a.isSponsored && (
          <div className="mt-6">
            <SponsorDisclosure item={a} kind="article" />
          </div>
        )}

        {a.coverImage && (
          <img src={a.coverImage} alt="" className="mt-6 aspect-[16/9] w-full rounded-2xl object-cover" />
        )}

        <div className="mt-8">
          {chunks.map((html, i) => (
            <Fragment key={i}>
              <div className="prose-article" dangerouslySetInnerHTML={{ __html: html }} />
              {/* Sponsored articles don't carry third-party in-article ads. */}
              {i === 0 && chunks.length > 1 && !a.isSponsored && (
                <AdSlot placement="in_article" variant="inline" className="my-8" />
              )}
            </Fragment>
          ))}
        </div>

        <section className="card mt-10 p-6">
          <p className="font-bold">Enjoyed this? Get GTA VI news every morning.</p>
          <div className="mt-3">
            <NewsletterForm source="article" />
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl">Related</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {related.map((r) => (
                <ArticleCard key={r.id} a={r} size="md" />
              ))}
            </div>
          </section>
        )}
      </article>
      <aside className="min-w-0">
        <Sidebar from={`/news/${a.slug}`} />
      </aside>
    </div>
  );
}

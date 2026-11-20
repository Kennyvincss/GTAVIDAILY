import Link from "next/link";
import { Fragment } from "react";
import { AdSlot } from "@/components/ads/AdSlot";
import { AffiliateCard, ArticleCard, CreatorCard, VideoCard } from "@/components/Cards";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Sidebar } from "@/components/Sidebar";
import { getAffiliateProducts, getLatestArticles, getTrendingArticles, getVideos } from "@/lib/content";
import { getFeaturedCreators } from "@/lib/monetisation/creators";

export default async function HomePage() {
  const [latest, trending, videos, creators, products] = await Promise.all([
    getLatestArticles(13),
    getTrendingArticles(6),
    getVideos(4, { featuredOnly: false }),
    getFeaturedCreators(6),
    getAffiliateProducts(4),
  ]);

  if (latest.length === 0) {
    return (
      <div className="card mx-auto my-16 max-w-xl p-8 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-2xl">Nothing published yet</h1>
        <p className="mt-2 text-muted">Sign in to the admin panel to publish your first story.</p>
        <Link href="/admin" className="btn mt-4">Open admin</Link>
      </div>
    );
  }

  const [hero, ...rest] = latest;
  const secondary = rest.slice(0, 2);
  // Trending is measured from real page views; with no traffic yet we show Latest and say so.
  const hasTrending = trending.length > 0;
  const trendList = hasTrending ? trending : rest.slice(2, 8);
  const latestList = rest.slice(hasTrending ? 2 : 8);

  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <ArticleCard a={hero} size="lg" />
        <div className="grid gap-6">
          {secondary.map((a) => (
            <ArticleCard key={a.id} a={a} size="md" />
          ))}
        </div>
      </section>

      <AdSlot placement="homepage_banner" variant="banner" />

      <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-10">
          {trendList.length > 0 && (
            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl">
                {hasTrending ? (
                  <>
                    <span className="brand-gradient">Trending</span> this week
                  </>
                ) : (
                  "More stories"
                )}
              </h2>
              <ol className="space-y-5">
                {trendList.map((a, i) => (
                  <Fragment key={a.id}>
                    <li className="flex gap-4">
                      <span className="w-8 shrink-0 font-[family-name:var(--font-display)] text-3xl leading-none text-line">
                        {i + 1}
                      </span>
                      <ArticleCard a={a} size="sm" />
                    </li>
                    {i === 2 && trendList.length > 3 && (
                      <li className="list-none">
                        <AdSlot placement="trending_inline" variant="inline" />
                      </li>
                    )}
                  </Fragment>
                ))}
              </ol>
            </section>
          )}

          {videos.length > 0 && (
            <section>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-[family-name:var(--font-display)] text-xl">Videos</h2>
                <Link href="/videos" className="text-sm text-muted">All videos →</Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {videos.map((v) => (
                  <VideoCard key={v.id} v={v} />
                ))}
              </div>
            </section>
          )}

          {latestList.length > 0 && (
            <section>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-[family-name:var(--font-display)] text-xl">Latest</h2>
                <Link href="/news" className="text-sm text-muted">All news →</Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {latestList.map((a) => (
                  <ArticleCard key={a.id} a={a} />
                ))}
              </div>
            </section>
          )}

          {creators.length > 0 && (
            <section>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-[family-name:var(--font-display)] text-xl">Featured creators</h2>
                <Link href="/creators/promote" className="text-sm text-muted">Get featured →</Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {creators.map((c) => (
                  <CreatorCard key={c.id} c={c} />
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">Featured creators are paid promotions.</p>
            </section>
          )}

          {products.length > 0 && (
            <section>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-[family-name:var(--font-display)] text-xl">Gear for GTA VI</h2>
                <Link href="/gear" className="text-sm text-muted">All picks →</Link>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {products.map((p) => (
                  <AffiliateCard key={p.id} p={p} from="/" />
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">We may earn a commission from purchases made through these links.</p>
            </section>
          )}

          <section className="card bg-[linear-gradient(120deg,#ff3d8b22,#ffb54714)] p-6">
            <h2 className="font-[family-name:var(--font-display)] text-xl">Every GTA VI headline, every morning</h2>
            <p className="mb-4 mt-1 text-sm text-muted">Free daily email. Unsubscribe anytime.</p>
            <NewsletterForm source="home" />
          </section>
        </div>

        <aside className="min-w-0">
          <Sidebar from="/" />
        </aside>
      </div>
    </div>
  );
}

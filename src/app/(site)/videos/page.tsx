import type { Metadata } from "next";
import { AdSlot } from "@/components/ads/AdSlot";
import { VideoCard } from "@/components/Cards";
import { getVideos } from "@/lib/content";

export const metadata: Metadata = { title: "Videos" };

export default async function VideosPage() {
  const videos = await getVideos(60);
  const featured = videos.filter((v) => v.featured);
  const others = videos.filter((v) => !v.featured);
  return (
    <div className="space-y-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Videos</h1>
      {videos.length === 0 && <p className="text-muted">No videos yet.</p>}
      {featured.length > 0 && (
        <section>
          <h2 className="eyebrow mb-3 text-aqua">Featured</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((v) => (
              <VideoCard key={v.id} v={v} />
            ))}
          </div>
        </section>
      )}
      <AdSlot placement="homepage_banner" variant="banner" />
      {others.length > 0 && (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((v) => (
            <VideoCard key={v.id} v={v} />
          ))}
        </section>
      )}
    </div>
  );
}

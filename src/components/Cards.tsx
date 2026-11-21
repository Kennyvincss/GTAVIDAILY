import Link from "next/link";
import { formatDate } from "@/lib/format";
import { clipThumbnail, platformLabel } from "@/lib/clips";
import { ClipThumb } from "./ClipThumb";
import { SponsoredBadge } from "./Sponsored";

export type ArticleCardData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  publishedAt: Date | null;
  isSponsored: boolean;
  sponsorName: string | null;
  category: { name: string; slug: string } | null;
};

export function ArticleCard({ a, size = "md" }: { a: ArticleCardData; size?: "lg" | "md" | "sm" }) {
  return (
    <article className="group">
      <Link href={`/news/${a.slug}`} className="block no-underline">
        {size !== "sm" && (
          <div className="mb-3 aspect-[16/9] overflow-hidden rounded-xl bg-surface-2">
            {a.coverImage ? (
              <img
                src={a.coverImage}
                alt=""
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="h-full w-full bg-[linear-gradient(135deg,#ff3d8b33,#ffb54722,#2de2e622)]" />
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {a.category && <span className="eyebrow text-pink">{a.category.name}</span>}
          {a.isSponsored && <SponsoredBadge name={a.sponsorName} />}
        </div>
        <h3
          className={`mt-1.5 font-bold leading-snug group-hover:text-pink ${
            size === "lg" ? "text-2xl sm:text-3xl font-[family-name:var(--font-display)]" : size === "md" ? "text-lg" : "text-base"
          }`}
        >
          {a.title}
        </h3>
        {size !== "sm" && <p className="mt-1.5 line-clamp-2 text-sm text-muted">{a.excerpt}</p>}
        <p className="mt-1.5 text-xs text-muted">{formatDate(a.publishedAt)}</p>
      </Link>
    </article>
  );
}

export type VideoCardData = {
  id: string;
  title: string;
  platform: string;
  externalId: string;
  thumbnailUrl: string | null;
  isSponsored: boolean;
  sponsorName: string | null;
  featured: boolean;
  creator?: { name: string } | null;
};

export function VideoCard({ v }: { v: VideoCardData }) {
  return (
    <Link href={`/videos/${v.id}`} className="group block no-underline">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-2">
        <ClipThumb src={clipThumbnail(v)} platform={platformLabel(v.platform)} className="transition group-hover:scale-[1.03]" />
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-black/60 text-xl text-white">▶</span>
        </span>
        {v.platform !== "youtube" && (
          <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase text-white">
            {platformLabel(v.platform)}
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {v.featured && <span className="eyebrow text-aqua">Featured</span>}
        {v.isSponsored && <SponsoredBadge name={v.sponsorName} />}
      </div>
      <h3 className="mt-1 font-bold leading-snug group-hover:text-pink">{v.title}</h3>
      {v.creator && <p className="mt-0.5 text-xs text-muted">by {v.creator.name}</p>}
    </Link>
  );
}

export type CreatorCardData = {
  id: string;
  name: string;
  platform: string;
  channelUrl: string;
  avatarUrl: string | null;
  bio: string;
};

const PLATFORM_LABEL: Record<string, string> = {
  youtube: "YouTube",
  twitch: "Twitch",
  tiktok: "TikTok",
  kick: "Kick",
  other: "Creator",
};

export function CreatorCard({
  c,
  promoted = true,
  href,
  meta,
}: {
  c: CreatorCardData;
  promoted?: boolean;
  /** Link to an on-site page instead of the creator's channel */
  href?: string;
  meta?: string;
}) {
  const inner = (
    <>
      {c.avatarUrl ? (
        <img src={c.avatarUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface-2 text-lg font-bold text-pink">
          {c.name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate font-bold">{c.name}</span>
        <span className="block text-xs text-muted">
          {PLATFORM_LABEL[c.platform] ?? "Creator"}
          {meta ? ` · ${meta}` : ""}
        </span>
        {c.bio && <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{c.bio}</span>}
      </span>
    </>
  );
  const cls = "card flex items-center gap-3 p-3 no-underline transition hover:border-pink";
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <a href={c.channelUrl} target="_blank" rel={promoted ? "sponsored noopener" : "noopener"} className={cls}>
      {inner}
    </a>
  );
}

export type AffiliateCardData = {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  merchant: string;
  priceText: string | null;
};

export function AffiliateCard({ p, from, compact = false }: { p: AffiliateCardData; from: string; compact?: boolean }) {
  return (
    <a
      href={`/go/${p.slug}?from=${encodeURIComponent(from)}`}
      target="_blank"
      rel="sponsored nofollow noopener"
      className={`card group flex ${compact ? "items-center gap-3 p-3" : "flex-col p-4"} no-underline transition hover:border-pink`}
    >
      <div className={`${compact ? "h-14 w-14 shrink-0" : "mb-3 aspect-square w-full"} overflow-hidden rounded-lg bg-white/5`}>
        {p.imageUrl && (
          <img src={p.imageUrl} alt="" className="h-full w-full object-contain" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`font-bold leading-snug group-hover:text-pink ${compact ? "text-sm" : ""}`}>{p.name}</p>
        {!compact && p.description && <p className="mt-1 text-sm text-muted">{p.description}</p>}
        <p className="mt-1 text-xs text-muted">
          {p.priceText ? <span className="font-semibold text-sunset">{p.priceText}</span> : null}
          {p.priceText ? " · " : ""}at {p.merchant}
        </p>
      </div>
      {!compact && <span className="btn btn-sm mt-3 self-start">Check price ↗</span>}
    </a>
  );
}

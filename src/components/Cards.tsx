import Link from "next/link";
import { formatDate } from "@/lib/format";
import { clipThumbnail, platformLabel } from "@/lib/clips";
import { articleCover } from "@/lib/covers";
import { ClipThumb } from "./ClipThumb";
import { SponsoredBadge } from "./Sponsored";

export type ArticleCardData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  publishedAt: Date | null;
  updatedAt?: Date | null;
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
            <img
              src={articleCover(a)}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
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
  x: "X",
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

const GEAR_ICONS: Record<string, string> = {
  "The game": "M4 6h16v12H4z M8 10h8 M8 14h5",
  Consoles: "M7 3h4v18H7z M13 6h4v12h-4z",
  Controllers: "M6 9h12a3 3 0 0 1 3 3l-1 5a2 2 0 0 1-3.5 1L15 16H9l-1.5 2A2 2 0 0 1 4 17l-1-5a3 3 0 0 1 3-3z M8 12v2 M7 13h2 M16 12h.01 M17.5 13.5h.01",
  Headsets: "M4 15v-3a8 8 0 0 1 16 0v3 M4 15h3v5H4z M17 15h3v5h-3z",
  Storage: "M3 8h18v8H3z M7 12h.01 M11 12h6",
  Accessories: "M12 3v4 M12 17v4 M3 12h4 M17 12h4 M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z",
};

/** Placeholder art for products without a photo (Amazon doesn't allow copying its product images). */
function GearArt({ name, category, compact }: { name: string; category: string; compact: boolean }) {
  const icon = GEAR_ICONS[category] ?? GEAR_ICONS.Accessories;
  return (
    <div className="relative grid h-full w-full place-items-center bg-[radial-gradient(circle_at_70%_30%,#ffb54755,transparent_55%),linear-gradient(135deg,#3b0f3f,#140726)]">
      <svg viewBox="0 0 24 24" className={compact ? "h-7 w-7" : "h-1/3 w-1/3"} fill="none" stroke="#ff7ab0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={icon} />
      </svg>
      {!compact && (
        <span className="absolute bottom-2 left-2 right-2 truncate text-center text-[0.65rem] font-bold uppercase tracking-widest text-ink/60">{category}</span>
      )}
      <span className="sr-only">{name}</span>
    </div>
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
  category?: string;
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
        {p.imageUrl ? (
          <img src={p.imageUrl} alt="" className="h-full w-full object-contain" />
        ) : (
          <GearArt name={p.name} category={p.category ?? "Accessories"} compact={compact} />
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

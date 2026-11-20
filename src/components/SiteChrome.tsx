import Link from "next/link";
import { db } from "@/lib/db";
import { site } from "@/lib/site";
import { NewsletterForm } from "./NewsletterForm";

const NAV = [
  { href: "/news", label: "News" },
  { href: "/videos", label: "Videos" },
  { href: "/creators", label: "Creators" },
  { href: "/gear", label: "Gear" },
  { href: "/newsletter", label: "Newsletter" },
];

export function Logo() {
  return (
    <Link href="/" className="font-[family-name:var(--font-display)] text-xl tracking-tight no-underline">
      <span className="brand-gradient">GTA VI</span> <span>Daily</span>
    </Link>
  );
}

export async function SiteHeader() {
  const categories = await db.category.findMany({ orderBy: { name: "asc" }, take: 8 });
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-night/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <nav className="flex gap-1 overflow-x-auto text-sm font-semibold">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-3 py-1.5 text-muted no-underline hover:bg-surface hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
      {categories.length > 0 && (
        <div className="border-t border-line/60">
          <div className="mx-auto flex max-w-6xl gap-4 overflow-x-auto px-4 py-2 text-xs font-semibold text-muted">
            {categories.map((c) => (
              <Link key={c.id} href={`/category/${c.slug}`} className="whitespace-nowrap no-underline hover:text-pink">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-2 max-w-sm text-sm text-muted">{site.tagline}. Independent fan coverage — not affiliated with Rockstar Games or Take-Two Interactive.</p>
          <div className="mt-4 max-w-sm">
            <p className="mb-2 text-sm font-bold">Get the daily briefing</p>
            <NewsletterForm source="footer" compact />
          </div>
        </div>
        <div className="text-sm">
          <p className="eyebrow mb-2">Explore</p>
          <ul className="space-y-1.5 text-muted">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="no-underline hover:text-ink">{n.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm">
          <p className="eyebrow mb-2">Work with us</p>
          <ul className="space-y-1.5 text-muted">
            <li><Link href="/advertise" className="no-underline hover:text-ink">Advertise</Link></li>
            <li><Link href="/creators/promote" className="no-underline hover:text-ink">Promote your channel</Link></li>
            <li><Link href="/privacy" className="no-underline hover:text-ink">Privacy &amp; disclosures</Link></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-line py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {site.name}. Some links are affiliate links; we may earn a commission at no extra cost to you.
      </p>
    </footer>
  );
}

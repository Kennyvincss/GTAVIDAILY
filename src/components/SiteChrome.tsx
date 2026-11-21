import Link from "next/link";
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
    <Link href="/" className="whitespace-nowrap font-[family-name:var(--font-display)] text-xl tracking-tight no-underline">
      <span className="brand-gradient">GTA VI</span> <span>Daily</span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-night/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-1.5 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3">
        <Logo />
        <nav className="-mx-2 flex justify-between overflow-x-auto text-sm font-semibold sm:mx-0 sm:justify-end sm:gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="whitespace-nowrap rounded-full px-1.5 py-1.5 text-[13px] text-muted no-underline hover:bg-surface hover:text-ink min-[380px]:px-2 min-[380px]:text-sm sm:px-3"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
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

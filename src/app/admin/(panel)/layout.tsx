import Link from "next/link";
import { Logo } from "@/components/SiteChrome";
import { requireAdmin } from "@/lib/admin";
import { logout } from "../_actions/auth";

const NAV = [
  { href: "/admin", label: "Analytics" },
  { href: "/admin/revenue", label: "Revenue" },
  { group: "Content" },
  { href: "/admin/starter", label: "Ready-made articles" },
  { href: "/admin/inbox", label: "News inbox" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/videos", label: "Videos" },
  { href: "/admin/auto-import", label: "Auto-import (YouTube & X)" },
  { href: "/admin/categories", label: "Categories" },
  { group: "Monetisation" },
  { href: "/admin/ads", label: "Advertising" },
  { href: "/admin/promotions", label: "Creator promotion" },
  { href: "/admin/creators", label: "Creators" },
  { href: "/admin/affiliates", label: "Affiliates" },
  { href: "/admin/newsletter", label: "Newsletter" },
] as const;

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="border-b border-line bg-surface/60 p-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between lg:block">
          <Logo />
          <p className="text-xs text-muted lg:mt-1">Admin</p>
        </div>
        <nav className="mt-4 flex gap-1 overflow-x-auto text-sm lg:flex-col lg:gap-0.5">
          {NAV.map((n, i) =>
            "group" in n ? (
              <p key={i} className="eyebrow mt-4 hidden px-2 pb-1 lg:block">{n.group}</p>
            ) : (
              <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-2 py-1.5 text-muted no-underline hover:bg-surface-2 hover:text-ink">
                {n.label}
              </Link>
            ),
          )}
        </nav>
        <div className="mt-6 hidden space-y-2 text-sm lg:block">
          <Link href="/" className="block text-muted no-underline hover:text-ink">View site ↗</Link>
          <form action={logout}>
            <button className="text-muted hover:text-ink">Sign out</button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}

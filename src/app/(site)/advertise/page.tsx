import type { Metadata } from "next";
import Link from "next/link";
import { PLACEMENTS } from "@/lib/monetisation/placements";

export const metadata: Metadata = { title: "Advertise" };

export default function AdvertisePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="eyebrow text-pink">Partners</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl">Advertise with GTA VI Daily</h1>
        <p className="mt-2 text-muted">Reach players who follow Grand Theft Auto VI every day.</p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-bold">Display placements</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {PLACEMENTS.map((p) => (
              <li key={p.key}>• {p.name} — {p.description}</li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="font-bold">Sponsored content</h2>
          <p className="mt-2 text-sm text-muted">Sponsored articles and featured videos, always labelled as paid partnerships.</p>
        </div>
        <div className="card p-5">
          <h2 className="font-bold">Newsletter sponsorship</h2>
          <p className="mt-2 text-sm text-muted">A sponsored block inside the daily briefing email.</p>
        </div>
        <div className="card p-5">
          <h2 className="font-bold">Creators</h2>
          <p className="mt-2 text-sm text-muted">Featured placement for your channel.</p>
          <Link href="/creators/promote" className="btn btn-sm mt-3">See packages</Link>
        </div>
      </section>
      <p className="text-sm text-muted">
        Audience figures are shared on request from our first-party analytics. We don&apos;t publish estimated numbers.
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import { NewsletterForm } from "@/components/NewsletterForm";

export const metadata: Metadata = { title: "Newsletter" };

export default function NewsletterPage() {
  return (
    <div className="card mx-auto max-w-xl p-8">
      <p className="eyebrow text-pink">Free daily email</p>
      <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl">The GTA VI Daily briefing</h1>
      <ul className="my-5 space-y-1.5 text-sm text-muted">
        <li>• Every confirmed GTA VI headline from the last 24 hours</li>
        <li>• New trailers and videos worth your time</li>
        <li>• Creator spotlights and gear deals</li>
      </ul>
      <NewsletterForm source="newsletter_page" />
      <p className="mt-4 text-xs text-muted">
        Issues may include clearly marked sponsored placements. One-click unsubscribe in every email.
      </p>
    </div>
  );
}

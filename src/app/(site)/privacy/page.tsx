import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy & disclosures" };

export default function PrivacyPage() {
  return (
    <div className="prose-article mx-auto max-w-2xl">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Privacy &amp; disclosures</h1>
      <h2>Analytics</h2>
      <p>
        We run our own first-party analytics. When you visit, we set a random, anonymous ID cookie
        (<code>gvd_vid</code>) so we can count unique visitors, and record the page you viewed, the site that referred you,
        and any campaign (UTM) tags in the link. We don&apos;t store your IP address and don&apos;t share this data. If your browser sends
        Do Not Track or Global Privacy Control, we record nothing.
      </p>
      <h2>Advertising</h2>
      <p>
        {site.adsenseClient
          ? "We show ads served by Google AdSense, which may use cookies to personalise ads. You can manage Google ad personalisation at adssettings.google.com."
          : "We may show ads from partners and, in future, Google AdSense."}{" "}
        Directly sold ads are marked “Advertisement”; we count when they are seen and clicked.
      </p>
      <h2>Sponsored content</h2>
      <p>Articles and videos we were paid to publish are labelled “Sponsored” and include a disclosure naming the sponsor.</p>
      <h2>Affiliate links</h2>
      <p>
        Links on our Gear pages are affiliate links. If you buy through them we may earn a commission at no extra cost to you.
        We count clicks on these links.
      </p>
      <h2>Featured creators</h2>
      <p>Creators shown as “Featured” have paid for that placement.</p>
      <h2>Newsletter</h2>
      <p>We store your email address only to send the newsletter. Every email has a one-click unsubscribe link.</p>
    </div>
  );
}

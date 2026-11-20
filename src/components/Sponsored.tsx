type Sponsorable = {
  isSponsored: boolean;
  sponsorName?: string | null;
  sponsorUrl?: string | null;
  sponsorDisclosure?: string | null;
};

export function SponsoredBadge({ name, className = "" }: { name?: string | null; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-sponsor/50 bg-sponsor/10 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wider text-sponsor ${className}`}
    >
      Sponsored{name ? <span className="font-semibold normal-case tracking-normal">· {name}</span> : null}
    </span>
  );
}

/** Full disclosure box shown at the top of sponsored articles and videos. */
export function SponsorDisclosure({ item, kind }: { item: Sponsorable; kind: "article" | "video" }) {
  if (!item.isSponsored) return null;
  const sponsor = item.sponsorName || "a sponsor";
  return (
    <div role="note" className="rounded-xl border border-sponsor/40 bg-sponsor/5 p-4 text-sm">
      <SponsoredBadge />
      <p className="mt-2 text-ink/90">
        {item.sponsorDisclosure ||
          `This ${kind} is a paid partnership with ${sponsor}. GTA VI Daily was paid to publish it.`}
      </p>
      {item.sponsorUrl && (
        <a href={item.sponsorUrl} target="_blank" rel="sponsored noopener" className="mt-2 inline-block text-aqua underline">
          Visit {item.sponsorName || "sponsor"}
        </a>
      )}
    </div>
  );
}

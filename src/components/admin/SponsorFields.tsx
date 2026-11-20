import { Check, Field } from "./ui";

type S = { isSponsored: boolean; sponsorName: string | null; sponsorUrl: string | null; sponsorDisclosure: string | null } | null;

export function SponsorFields({ item, kind }: { item: S; kind: "article" | "video" }) {
  return (
    <fieldset className="rounded-xl border border-sponsor/40 bg-sponsor/5 p-4">
      <legend className="px-1 text-sm font-bold text-sponsor">Sponsorship</legend>
      <Check name="isSponsored" label={`This ${kind} is sponsored (paid placement)`} defaultChecked={item?.isSponsored} />
      <p className="mt-1 text-xs text-muted">
        Sponsored items show a “Sponsored” badge everywhere they appear, a disclosure box naming the sponsor, and links use rel=&quot;sponsored&quot;.
        {kind === "article" && " Third-party in-article ads are not shown inside sponsored articles."}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Sponsor name (required if sponsored)" name="sponsorName" defaultValue={item?.sponsorName} />
        <Field label="Sponsor link" name="sponsorUrl" type="url" defaultValue={item?.sponsorUrl} placeholder="https://" />
        <div className="sm:col-span-2">
          <label className="label" htmlFor="sponsorDisclosure">Custom disclosure (optional)</label>
          <input className="input" id="sponsorDisclosure" name="sponsorDisclosure" defaultValue={item?.sponsorDisclosure ?? ""} placeholder={`This ${kind} is a paid partnership with …`} />
        </div>
      </div>
    </fieldset>
  );
}

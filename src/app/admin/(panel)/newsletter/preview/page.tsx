import { BackLink, PageHeader, Section } from "@/components/admin/ui";
import { dayKey } from "@/lib/dates";
import { buildIssue } from "@/lib/newsletter/issue";

export default async function IssueBuilder({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const requested = (await searchParams).day;
  const day = requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : dayKey();
  const issue = await buildIssue(day);
  return (
    <div className="space-y-6">
      <BackLink href="/admin/newsletter">Newsletter</BackLink>
      <PageHeader
        title="Issue builder"
        sub="Latest stories plus the sponsorships scheduled for this date. Copy the HTML into your email provider."
        action={
          <form className="flex gap-2">
            <input type="date" name="day" defaultValue={day} className="input w-auto" />
            <button className="btn btn-sm">Load</button>
          </form>
        }
      />
      <p className="text-sm text-muted">
        {issue.articleCount} stories · {issue.sponsorships.length} sponsored placement{issue.sponsorships.length === 1 ? "" : "s"}{" "}
        ({issue.sponsorships.map((s) => `${s.sponsor} @ ${s.position}`).join(", ") || "none scheduled"}). Site links are tagged with UTM
        parameters, so clicks appear as “Newsletter” traffic in Analytics. Replace <code>{"{{unsubscribe_url}}"}</code> with your
        provider&apos;s merge tag (the CSV export includes each subscriber&apos;s unsubscribe URL).
      </p>
      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Preview">
          <iframe title="Newsletter preview" srcDoc={issue.html} sandbox="" className="h-[720px] w-full rounded-lg bg-white" />
        </Section>
        <Section title="HTML">
          <textarea readOnly className="textarea h-[720px]" defaultValue={issue.html} />
        </Section>
      </div>
    </div>
  );
}

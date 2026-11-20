import Link from "next/link";

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Section({ title, sub, children, action }: { title: string; sub?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="card p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-bold">{title}</h2>
          {sub && <p className="text-xs text-muted">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-line p-4 text-center text-sm text-muted">{children}</p>;
}

const PILL: Record<string, string> = {
  published: "bg-ok/15 text-ok",
  active: "bg-ok/15 text-ok",
  live: "bg-ok/15 text-ok",
  sent: "bg-ok/15 text-ok",
  approved: "bg-aqua/15 text-aqua",
  scheduled: "bg-aqua/15 text-aqua",
  pending: "bg-sunset/15 text-sunset",
  draft: "bg-white/10 text-muted",
  completed: "bg-white/10 text-muted",
  inactive: "bg-white/10 text-muted",
  ended: "bg-white/10 text-muted",
  rejected: "bg-bad/15 text-bad",
  cancelled: "bg-bad/15 text-bad",
};

export function Pill({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[0.7rem] font-bold capitalize ${PILL[status] ?? "bg-white/10"}`}>
      {status}
    </span>
  );
}

export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  placeholder,
  hint,
  className = "",
  step,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  className?: string;
  step?: string;
}) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>{label}</label>
      <input
        className="input"
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        step={step}
      />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Check({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-pink" />
      {label}
    </label>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="mb-4 inline-block text-sm text-muted no-underline hover:text-ink">
      ← {children}
    </Link>
  );
}

/** Value for <input type="datetime-local"> in UTC. */
export function dtLocal(d: Date | null | undefined): string {
  return d ? new Date(d).toISOString().slice(0, 16) : "";
}

export function dateOnly(d: Date | null | undefined): string {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

import { formatNumber } from "@/lib/format";

/**
 * Minimal server-rendered bar chart. Each bar has a <title> for hover values,
 * and a visually hidden table carries the same data for screen readers.
 */
export function BarChart({
  data,
  label,
  formatKey = (k) => k,
  height = 160,
  color = "var(--color-pink)",
}: {
  data: { key: string; value: number }[];
  label: string;
  formatKey?: (k: string) => string;
  height?: number;
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  const w = 100 / Math.max(1, data.length);
  const gap = data.length > 40 ? 0.15 : 0.25;
  return (
    <figure>
      {total === 0 ? (
        <div className="grid place-items-center rounded-lg border border-dashed border-line text-sm text-muted" style={{ height }}>
          No data recorded in this period yet
        </div>
      ) : (
        <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} role="img" aria-label={label}>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" x2="100" y1={height * f} y2={height * f} stroke="var(--color-line)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeDasharray="2 3" />
          ))}
          {data.map((d, i) => {
            const h = (d.value / max) * (height - 4);
            return (
              <rect key={d.key} x={i * w + w * gap} width={w * (1 - 2 * gap)} y={height - h} height={Math.max(h, d.value ? 1 : 0)} rx="0.4" fill={color}>
                <title>{`${formatKey(d.key)}: ${formatNumber(d.value)}`}</title>
              </rect>
            );
          })}
        </svg>
      )}
      <figcaption className="mt-1 flex justify-between text-[0.68rem] text-muted">
        <span>{data[0] && formatKey(data[0].key)}</span>
        <span>peak {formatNumber(max === 1 && total === 0 ? 0 : max)}</span>
        <span>{data.at(-1) && formatKey(data.at(-1)!.key)}</span>
      </figcaption>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <th>{formatKey(d.key)}</th>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Horizontal share bars for ranked lists (sources, categories). */
export function ShareList({ rows }: { rows: { label: string; value: number; href?: string }[] }) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => {
        const pct = total ? (r.value / total) * 100 : 0;
        return (
          <li key={r.label}>
            <div className="flex justify-between gap-2 text-sm">
              <span className="truncate">{r.label}</span>
              <span className="shrink-0 tabular-nums text-muted">
                {formatNumber(r.value)} · {pct.toFixed(1)}%
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-aqua" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

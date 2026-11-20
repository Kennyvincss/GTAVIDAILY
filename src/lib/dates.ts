/** UTC day key, e.g. 2026-11-20 */
export function dayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** UTC month key, e.g. 2026-11 */
export function monthKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 7);
}

/** The last `n` day keys, oldest first, ending today (UTC). */
export function lastDays(n: number, end: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - i));
    out.push(dayKey(d));
  }
  return out;
}

/** The last `n` month keys, oldest first, ending this month (UTC). */
export function lastMonths(n: number, end: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
    out.push(monthKey(d));
  }
  return out;
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}

// Small helpers for reading admin form posts.
export function str(form: FormData, key: string, max = 10_000): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export function optStr(form: FormData, key: string, max = 10_000): string | null {
  return str(form, key, max) || null;
}

export function bool(form: FormData, key: string): boolean {
  return form.get(key) === "on" || form.get(key) === "true";
}

export function int(form: FormData, key: string, fallback = 0): number {
  const n = parseInt(str(form, key), 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Parse a <input type="datetime-local"> value (treated as UTC) or a date. */
export function optDate(form: FormData, key: string): Date | null {
  const v = str(form, key);
  if (!v) return null;
  const d = new Date(v.length <= 16 ? `${v}${v.length === 10 ? "T00:00" : ""}:00Z` : v);
  return Number.isNaN(d.getTime()) ? null : d;
}


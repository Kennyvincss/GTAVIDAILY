export const VISITOR_COOKIE = "gvd_vid";
export const VISITOR_MAX_AGE = 60 * 60 * 24 * 365;

/** Accept only IDs this site issued (UUID v4 format). */
export function validVisitorId(v: string | undefined | null): v is string {
  return !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v);
}

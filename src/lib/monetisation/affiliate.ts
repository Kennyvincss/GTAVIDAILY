/**
 * Build the outbound URL for an affiliate click.
 * Merchants' tracking URLs are stored verbatim (with your tag / ref ID).
 * Use the {clickId} placeholder for networks that accept a sub-ID
 * (e.g. ...&subid={clickId}) so conversions can be reconciled with clicks.
 */
export function buildAffiliateUrl(template: string, clickId: string): string {
  return template.replaceAll("{clickId}", encodeURIComponent(clickId));
}

export const AFFILIATE_REL = "sponsored nofollow noopener";

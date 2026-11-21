/** Accent colours per category for generated covers. */
export const COVER_THEMES: Record<string, { sun: [string, string]; sky: [string, string, string]; label: string }> = {
  news: { sun: ["#ffd25c", "#ff3d8b"], sky: ["#140726", "#4a0f45", "#ff5c7a"], label: "#ff3d8b" },
  trailers: { sun: ["#fff07a", "#ff8a3d"], sky: ["#170a22", "#5a1a3a", "#ff9a4d"], label: "#ffb547" },
  characters: { sun: ["#7af7ff", "#ff3d8b"], sky: ["#0b0a26", "#2b1550", "#c23d9a"], label: "#2de2e6" },
  map: { sun: ["#e9ff7a", "#2de2a6"], sky: ["#07161f", "#0f3b46", "#3dbf9a"], label: "#5cf2b4" },
  online: { sun: ["#b98cff", "#2de2e6"], sky: ["#0a0820", "#26115a", "#5a4dff"], label: "#a98cff" },
  guides: { sun: ["#fff27a", "#ff5c7a"], sky: ["#1a0a1f", "#55163d", "#ffb547"], label: "#ffd25c" },
};

export const DEFAULT_THEME = COVER_THEMES.news;

/**
 * The image for an article: its own cover, or the generated one. On the site
 * the generated cover is art only (the headline is already printed beside it);
 * `share: true` returns the version with the headline, for social previews.
 */
export function articleCover(
  a: { slug: string; coverImage: string | null; updatedAt?: Date | null },
  opts: { share?: boolean } = {},
): string {
  if (a.coverImage) return a.coverImage;
  const q = new URLSearchParams();
  if (!opts.share) q.set("style", "art");
  if (a.updatedAt) q.set("v", new Date(a.updatedAt).getTime().toString(36));
  const qs = q.toString();
  return `/covers/${a.slug}${qs ? `?${qs}` : ""}`;
}

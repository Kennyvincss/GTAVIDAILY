/**
 * Validates the researched articles shipped with the site (npm run content:check):
 * unique slugs, known categories, a sources section, and internal /news/ links
 * that point at real articles. Exits non-zero on any problem.
 */
import { ALL_PACK_ARTICLES } from "../src/content/articles";

const CATEGORIES = new Set(["news", "trailers", "characters", "map", "online", "guides"]);
const slugs = new Set<string>();
const problems: string[] = [];

for (const a of ALL_PACK_ARTICLES) {
  if (slugs.has(a.slug)) problems.push(`duplicate slug: ${a.slug}`);
  slugs.add(a.slug);
}
for (const a of ALL_PACK_ARTICLES) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(a.slug)) problems.push(`bad slug format: ${a.slug}`);
  if (!CATEGORIES.has(a.category)) problems.push(`${a.slug}: unknown category "${a.category}"`);
  if (!a.title.trim() || a.title.length > 200) problems.push(`${a.slug}: title missing or too long`);
  if (!a.excerpt.trim() || a.excerpt.length > 400) problems.push(`${a.slug}: excerpt missing or too long`);
  if (!/\*Sources?:/.test(a.body)) problems.push(`${a.slug}: no "*Sources:" section`);
  for (const m of a.body.matchAll(/\]\((\/news\/[^)\s#?]+)/g)) {
    if (!slugs.has(m[1].slice("/news/".length))) problems.push(`${a.slug}: link to missing article ${m[1]}`);
  }
}

console.log(`${ALL_PACK_ARTICLES.length} articles checked, ${problems.length} problem(s).`);
for (const p of problems) console.log(" -", p);
process.exit(problems.length ? 1 : 0);

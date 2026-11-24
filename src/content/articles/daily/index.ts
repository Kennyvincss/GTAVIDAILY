import type { StarterArticle } from "../../starter-articles";

/**
 * Daily articles. Each day's file exports two or more researched articles and
 * is registered here, oldest first: add an import line below the
 * DAILY_IMPORTS marker (ARTICLES as D_<date with underscores>) and a
 * matching { addedOn, articles } entry below the DAILY_BATCHES marker.
 */
// DAILY_IMPORTS
import { ARTICLES as D_2026_11_21 } from "./2026-11-21";
import { ARTICLES as D_2026_11_22 } from "./2026-11-22";
import { ARTICLES as D_2026_11_23 } from "./2026-11-23";
import { ARTICLES as D_2026_11_24 } from "./2026-11-24";

export const DAILY_BATCHES: { addedOn: string; articles: StarterArticle[] }[] = [
  // DAILY_BATCHES
  { addedOn: "2026-11-21", articles: D_2026_11_21 },
  { addedOn: "2026-11-22", articles: D_2026_11_22 },
  { addedOn: "2026-11-23", articles: D_2026_11_23 },
  { addedOn: "2026-11-24", articles: D_2026_11_24 },
];

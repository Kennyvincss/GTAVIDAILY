import type { StarterArticle } from "../../starter-articles";

/**
 * Daily articles. Each day's file exports two or more researched articles and
 * is registered here, newest last:
 *   import { ARTICLES as D_2026_11_22 } from "./2026-11-22";
 *   ...and add { addedOn: "2026-11-22", articles: D_2026_11_22 } to DAILY_BATCHES.
 */
// DAILY_IMPORTS
import { ARTICLES as D_2026_11_21 } from "./2026-11-21";

export const DAILY_BATCHES: { addedOn: string; articles: StarterArticle[] }[] = [
  // DAILY_BATCHES
  { addedOn: "2026-11-21", articles: D_2026_11_21 },
];

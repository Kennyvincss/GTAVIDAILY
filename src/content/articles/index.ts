import { STARTER_ARTICLES, type StarterArticle } from "../starter-articles";
import { LAUNCH_WEEK_ARTICLES } from "./2026-11-21-launch-week";
import { DAILY_BATCHES } from "./daily";

export type ArticleBatch = { id: string; label: string; addedOn: string; articles: StarterArticle[] };

/** Every researched article shipped with the site, oldest batch first. */
export const ARTICLE_BATCHES: ArticleBatch[] = [
  { id: "launch", label: "Launch coverage", addedOn: "2026-11-21", articles: STARTER_ARTICLES },
  { id: "launch-week", label: "Launch week", addedOn: "2026-11-21", articles: LAUNCH_WEEK_ARTICLES },
  ...DAILY_BATCHES.map((b) => ({ id: `daily-${b.addedOn}`, label: `Daily · ${b.addedOn}`, addedOn: b.addedOn, articles: b.articles })),
];

export const ALL_PACK_ARTICLES = ARTICLE_BATCHES.flatMap((b, batchIndex) =>
  b.articles.map((a, index) => ({ ...a, batchId: b.id, batchIndex, index })),
);

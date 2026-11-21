/**
 * Runs on every deploy (see "vercel-build" in package.json): adds any newly
 * shipped researched articles to the database, published unless
 * CONTENT_AUTOPUBLISH=false. Safe to run repeatedly.
 */
import { PrismaClient } from "@prisma/client";
import { autoPublishPack, importPackArticles } from "../src/lib/content-pack";

const db = new PrismaClient();

importPackArticles(db, { publish: autoPublishPack() })
  .then((r) => console.log(`Articles: ${r.added} added, ${r.recorded} already present, ${r.skipped} previously imported.`))
  .catch((e) => {
    // Never fail a deploy over content.
    console.error("Article import skipped:", e instanceof Error ? e.message : e);
  })
  .finally(() => db.$disconnect());

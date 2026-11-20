/**
 * Seeds structure only: categories, ad placements and one starter article so
 * the site renders. It deliberately creates NO analytics, revenue or traffic
 * data — every number on the dashboard comes from real visitors.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const CATEGORIES = [
  ["News", "news"],
  ["Trailers", "trailers"],
  ["Guides", "guides"],
  ["Map & Locations", "map"],
  ["Characters", "characters"],
  ["Online", "online"],
];

const PLACEMENTS = [
  ["homepage_banner", "Homepage banner", "Full-width leaderboard below the homepage hero.", "horizontal"],
  ["trending_inline", "Between trending content", "Native slot inside the homepage Trending list.", "fluid"],
  ["sidebar", "Sidebar", "Sticky slot in the right-hand sidebar on articles and listings.", "vertical"],
  ["in_article", "In-article", "Placed inside article bodies after the third paragraph.", "fluid"],
];

async function main() {
  for (const [name, slug] of CATEGORIES) {
    await db.category.upsert({ where: { slug }, update: {}, create: { name, slug } });
  }
  for (const [key, name, description, adsenseFormat] of PLACEMENTS) {
    await db.adPlacement.upsert({ where: { key }, update: {}, create: { key, name, description, adsenseFormat } });
  }
  if ((await db.article.count()) === 0) {
    const news = await db.category.findUnique({ where: { slug: "news" } });
    await db.article.create({
      data: {
        title: "Welcome to GTA VI Daily",
        slug: "welcome-to-gta-vi-daily",
        excerpt: "Your daily home for Grand Theft Auto VI news, trailers, guides and creators.",
        body: [
          "GTA VI Daily covers everything confirmed about Grand Theft Auto VI, every day.",
          "Expect news write-ups, trailer breakdowns, guides once the game is out, and a spotlight on the creators covering it.",
          "This is a starter article created by the seed script. Edit or delete it from the admin panel.",
          "## Stay in the loop",
          "Subscribe to the daily briefing to get every headline in your inbox.",
        ].join("\n\n"),
        status: "published",
        publishedAt: new Date(),
        categoryId: news?.id,
      },
    });
  }
  console.log("Seeded categories, ad placements and starter content.");
}

main().finally(() => db.$disconnect());

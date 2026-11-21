"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { STARTER_ARTICLES, type StarterArticle } from "@/content/starter-articles";

async function importOne(a: StarterArticle): Promise<boolean> {
  if (await db.article.findUnique({ where: { slug: a.slug } })) return false;
  const category = await db.category.findUnique({ where: { slug: a.category } });
  await db.article.create({
    data: {
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      body: a.body,
      categoryId: category?.id ?? null,
      status: "draft",
    },
  });
  return true;
}

/** Import one ready-made article as a draft (never overwrites an existing article). */
export async function importStarter(slug: string) {
  await requireAdmin();
  const a = STARTER_ARTICLES.find((x) => x.slug === slug);
  if (a) await importOne(a);
  revalidatePath("/admin/starter");
}

export async function importAllStarters() {
  await requireAdmin();
  for (const a of STARTER_ARTICLES) await importOne(a);
  revalidatePath("/admin/starter");
}

/**
 * Publish every imported ready-made article that is still a draft. Times are
 * staggered a minute apart in list order, so the first article (the launch
 * story) becomes the newest and leads the homepage.
 */
export async function publishAllStarters() {
  await requireAdmin();
  const now = Date.now();
  for (const [i, a] of STARTER_ARTICLES.entries()) {
    await db.article.updateMany({
      where: { slug: a.slug, status: "draft" },
      data: { status: "published", publishedAt: new Date(now - i * 60_000) },
    });
  }
  revalidatePath("/", "layout");
}

import { Empty, PageHeader, Section } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { createCategory, deleteCategory } from "../../_actions/content";

export default async function CategoriesAdmin() {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true, videos: true } } },
  });
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Categories" />
      <Section title="Add category">
        <form action={createCategory} className="flex flex-col gap-2 sm:flex-row">
          <input className="input" name="name" placeholder="Name, e.g. Trailers" required />
          <input className="input" name="slug" placeholder="slug (optional)" />
          <button className="btn">Add</button>
        </form>
      </Section>
      {categories.length === 0 ? (
        <Empty>No categories yet.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Name</th><th>Slug</th><th className="num">Articles</th><th className="num">Videos</th><th /></tr></thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td className="font-mono text-xs text-muted">{c.slug}</td>
                  <td className="num">{c._count.articles}</td>
                  <td className="num">{c._count.videos}</td>
                  <td className="text-right">
                    <form action={deleteCategory}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="btn btn-sm btn-danger">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

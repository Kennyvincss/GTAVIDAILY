"use client";

import { importStarterGear } from "@/app/admin/_actions/gear";
import { FormShell } from "./FormShell";

type Item = { slug: string; name: string; category: string; description: string; added: boolean };

export function StarterGearForm({ items, stores }: { items: Item[]; stores: [string, string][] }) {
  const groups = new Map<string, Item[]>();
  for (const i of items) groups.set(i.category, [...(groups.get(i.category) ?? []), i]);
  return (
    <FormShell action={importStarterGear} submitLabel="Add selected products to Gear" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="store">Your Amazon store</label>
          <select className="select" id="store" name="store" defaultValue="amazon.com">
            {stores.map(([d, label]) => (
              <option key={d} value={d}>{label} ({d})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="tag">Amazon Associates tag</label>
          <input className="input" id="tag" name="tag" placeholder="e.g. gtavidaily-21" />
          <p className="mt-1 text-xs text-muted">
            Find it in Amazon Associates Central, top right. No account yet? Leave it blank and add it later below.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[...groups.entries()].map(([cat, list]) => (
          <fieldset key={cat} className="rounded-lg border border-line p-3">
            <legend className="px-1 text-xs font-bold uppercase tracking-wider text-muted">{cat}</legend>
            {list.map((i) => (
              <label key={i.slug} className={`flex gap-2 py-1 text-sm ${i.added ? "opacity-50" : ""}`}>
                <input type="checkbox" name="pick" value={i.slug} defaultChecked={!i.added} disabled={i.added} className="mt-0.5 h-4 w-4 accent-pink" />
                <span>
                  <span className="font-semibold">{i.name}</span>
                  {i.added && <span className="ml-1 text-xs text-ok">already added</span>}
                  <span className="block text-xs text-muted">{i.description}</span>
                </span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>
    </FormShell>
  );
}

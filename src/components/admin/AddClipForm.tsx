"use client";

import { useState } from "react";
import { addClip } from "@/app/admin/_actions/clips";
import { FormShell } from "./FormShell";

/** Paste a clip link → clip goes to Videos, creator goes to Creators. */
export function AddClipForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [more, setMore] = useState(false);
  return (
    <FormShell action={addClip} submitLabel="Add clip" resetOnSuccess className="space-y-3">
      <div>
        <label className="label" htmlFor="link">Clip link</label>
        <input
          className="input"
          id="link"
          name="link"
          required
          placeholder="Paste a YouTube, YouTube Shorts, TikTok or Twitch clip link"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="categoryId">Category</label>
          <select className="select" id="categoryId" name="categoryId" defaultValue="">
            <option value="">No category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="publish" defaultChecked className="h-4 w-4 accent-pink" /> Publish now
        </label>
      </div>
      <button type="button" onClick={() => setMore((m) => !m)} className="text-xs text-muted underline">
        {more ? "Hide" : "Optional:"} custom title / creator
      </button>
      <div className={more ? "grid gap-3 sm:grid-cols-3" : "hidden"}>
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input className="input" id="title" name="title" placeholder="Use the clip's own title" />
        </div>
        <div>
          <label className="label" htmlFor="creatorName">Creator name</label>
          <input className="input" id="creatorName" name="creatorName" placeholder="Detected automatically" />
        </div>
        <div>
          <label className="label" htmlFor="creatorUrl">Creator channel link</label>
          <input className="input" id="creatorUrl" name="creatorUrl" placeholder="Detected automatically" />
        </div>
      </div>
    </FormShell>
  );
}

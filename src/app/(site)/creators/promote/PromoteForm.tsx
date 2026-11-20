"use client";

import { useActionState, useState } from "react";
import { requestPromotion, type PromotionState } from "@/app/actions/promotion";

type Pkg = { id: string; name: string; description: string; durationDays: number; price: string };

export function PromoteForm({ packages }: { packages: Pkg[] }) {
  const [state, action, pending] = useActionState<PromotionState, FormData>(requestPromotion, null);
  const [selected, setSelected] = useState(packages[0]?.id ?? "");
  if (state?.ok) return <div className="card p-6 text-ok">{state.message}</div>;

  return (
    <form action={action} className="space-y-6">
      <fieldset>
        <legend className="mb-3 font-bold">1. Choose a package</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {packages.map((p) => (
            <label
              key={p.id}
              className={`card cursor-pointer p-4 transition ${selected === p.id ? "border-pink ring-1 ring-pink" : "hover:border-muted"}`}
            >
              <input
                type="radio"
                name="packageId"
                value={p.id}
                checked={selected === p.id}
                onChange={() => setSelected(p.id)}
                className="sr-only"
              />
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-bold">{p.name}</span>
                <span className="font-[family-name:var(--font-display)] text-lg text-sunset">{p.price}</span>
              </span>
              <span className="mt-1 block text-xs text-muted">{p.durationDays} days featured</span>
              {p.description && <span className="mt-2 block text-sm text-muted">{p.description}</span>}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 font-bold">2. Your channel</legend>
        <div>
          <label className="label" htmlFor="creatorName">Creator / channel name</label>
          <input className="input" id="creatorName" name="creatorName" required minLength={2} maxLength={80} />
        </div>
        <div>
          <label className="label" htmlFor="email">Contact email</label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
        <div>
          <label className="label" htmlFor="platform">Platform</label>
          <select className="select" id="platform" name="platform" defaultValue="youtube">
            <option value="youtube">YouTube</option>
            <option value="twitch">Twitch</option>
            <option value="tiktok">TikTok</option>
            <option value="kick">Kick</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="channelUrl">Channel URL</label>
          <input className="input" id="channelUrl" name="channelUrl" type="url" required placeholder="https://" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="avatarUrl">Avatar image URL (optional)</label>
          <input className="input" id="avatarUrl" name="avatarUrl" type="url" placeholder="https://" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="bio">Short bio shown on your card (max 280 characters)</label>
          <input className="input" id="bio" name="bio" maxLength={280} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="message">Anything else we should know? (optional)</label>
          <textarea className="textarea font-sans" id="message" name="message" maxLength={2000} />
        </div>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      </fieldset>

      {state && !state.ok && <p className="text-sm text-bad">{state.message}</p>}
      <button className="btn" disabled={pending || !selected}>
        {pending ? "Sending…" : "Request promotion"}
      </button>
      <p className="text-xs text-muted">
        No payment is taken now. We review every request and only feature channels that fit our audience.
      </p>
    </form>
  );
}

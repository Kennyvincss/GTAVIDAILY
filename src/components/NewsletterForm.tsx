"use client";

import { useActionState } from "react";
import { subscribe, type SubscribeState } from "@/app/actions/newsletter";

export function NewsletterForm({ source = "site", compact = false }: { source?: string; compact?: boolean }) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, null);
  if (state?.ok) return <p className="rounded-lg bg-ok/10 p-3 text-sm text-ok">{state.message}</p>;
  return (
    <form action={action} className={compact ? "space-y-2" : "flex flex-col gap-2 sm:flex-row"}>
      <input type="hidden" name="source" value={source} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="sr-only" htmlFor={`nl-${source}`}>
        Email address
      </label>
      <input
        id={`nl-${source}`}
        type="email"
        name="email"
        required
        placeholder="you@example.com"
        className="input flex-1"
      />
      <button className={`btn ${compact ? "w-full" : ""}`} disabled={pending}>
        {pending ? "Subscribing…" : "Subscribe"}
      </button>
      {state && !state.ok && <p className="text-sm text-bad">{state.message}</p>}
    </form>
  );
}

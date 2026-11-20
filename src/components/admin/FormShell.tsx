"use client";

import { useActionState } from "react";

type State = { error?: string } | null;

/** Wraps an admin form bound to a server action that returns { error }. */
export function FormShell({
  action,
  children,
  submitLabel = "Save",
  className = "space-y-4",
}: {
  action: (prev: State, form: FormData) => Promise<State>;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(action, null);
  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && <p className="rounded-lg bg-bad/10 p-2 text-sm text-bad">{state.error}</p>}
      <button className="btn" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

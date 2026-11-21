"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";

type State = { error?: string; notice?: string } | null;

/** Wraps an admin form bound to a server action that returns { error } (or redirects on success). */
export function FormShell({
  action,
  children,
  submitLabel = "Save",
  className = "space-y-4",
  resetOnSuccess = false,
}: {
  action: (prev: State, form: FormData) => Promise<State>;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
  /** Clear the form after a successful save (for "add another" forms). */
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state && !state.error) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form
      ref={ref}
      className={className}
      // Submit manually so React doesn't reset the form: a validation error must not wipe the draft.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      {children}
      {state?.error && <p className="rounded-lg bg-bad/10 p-2 text-sm text-bad">{state.error}</p>}
      {state?.notice && !state.error && <p className="rounded-lg bg-ok/10 p-2 text-sm text-ok">{state.notice}</p>}
      <button className="btn" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

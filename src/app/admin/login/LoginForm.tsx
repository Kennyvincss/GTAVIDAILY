"use client";

import { useActionState } from "react";
import { login } from "../_actions/auth";

export function LoginForm() {
  const [error, action, pending] = useActionState<string | null, FormData>(login, null);
  return (
    <form action={action} className="space-y-3">
      <label className="label" htmlFor="password">Admin password</label>
      <input className="input" id="password" name="password" type="password" required autoFocus />
      {error && <p className="text-sm text-bad">{error}</p>}
      <button className="btn w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}

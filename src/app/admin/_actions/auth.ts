"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminConfigProblem, checkPassword, createSessionToken } from "@/lib/auth";

export async function login(_prev: string | null, form: FormData): Promise<string | null> {
  const password = form.get("password");
  const problem = adminConfigProblem();
  if (problem) return `Admin is not configured: ${problem} Update it in your hosting environment variables and redeploy.`;
  if (typeof password !== "string" || !(await checkPassword(password))) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return "Incorrect password.";
  }
  const { token, maxAge } = await createSessionToken();
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge,
    path: "/",
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

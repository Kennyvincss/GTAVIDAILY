"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, checkPassword, createSessionToken } from "@/lib/auth";

export async function login(_prev: string | null, form: FormData): Promise<string | null> {
  const password = form.get("password");
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    return "Admin is not configured. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET.";
  }
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

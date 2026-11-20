import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { unsubscribe } from "@/app/actions/newsletter";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string; done?: string }> }) {
  const { token, done } = await searchParams;

  async function confirm() {
    "use server";
    if (token) await unsubscribe(token);
    redirect(`/newsletter/unsubscribe?done=1`);
  }

  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      {done ? (
        <>
          <h1 className="text-xl font-bold">You&apos;re unsubscribed</h1>
          <p className="mt-2 text-muted">You won&apos;t receive any more emails from us.</p>
        </>
      ) : token ? (
        <form action={confirm}>
          <h1 className="text-xl font-bold">Unsubscribe from GTA VI Daily?</h1>
          <button className="btn mt-4">Yes, unsubscribe me</button>
        </form>
      ) : (
        <p className="text-muted">This unsubscribe link is invalid.</p>
      )}
    </div>
  );
}

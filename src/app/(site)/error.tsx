"use client";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card mx-auto my-16 max-w-md p-6 text-center">
      <h1 className="text-lg font-bold">This page couldn&apos;t load</h1>
      <p className="mt-2 text-sm text-muted">Please try again in a moment.</p>
      <button className="btn mt-4" onClick={reset}>Try again</button>
    </div>
  );
}

"use client";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="card max-w-md p-6">
        <h1 className="text-lg font-bold">Something went wrong in the admin panel</h1>
        <p className="mt-2 text-sm text-muted">
          Open <a href="/api/health" className="text-aqua underline">/api/health</a> to check the database and settings, or
          look at the function logs in your hosting dashboard{error.digest ? ` (error digest ${error.digest})` : ""}.
        </p>
        <button className="btn mt-4" onClick={reset}>Try again</button>
      </div>
    </div>
  );
}

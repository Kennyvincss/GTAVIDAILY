import { Suspense } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Tracker } from "@/components/Tracker";

// Ads rotate and trending is computed from live traffic, so render per request.
export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pt-6">{children}</main>
      <SiteFooter />
      <Suspense>
        <Tracker />
      </Suspense>
    </>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * First-party page view tracking. Sends one beacon per route change.
 * Only the first page of a visit reports the referrer (traffic source);
 * later client-side navigations are recorded as internal.
 * Honours Do Not Track and Global Privacy Control.
 */
export function Tracker() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;
    const entry = first.current;
    first.current = false;
    const payload = JSON.stringify({
      url: window.location.pathname + window.location.search,
      referrer: entry ? document.referrer : "",
      entry,
    });
    fetch("/api/track", { method: "POST", body: payload, keepalive: true, credentials: "same-origin" }).catch(
      () => {},
    );
  }, [pathname]);

  return null;
}

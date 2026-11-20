import { site } from "@/lib/site";

/** ads.txt for Google AdSense, generated from NEXT_PUBLIC_ADSENSE_CLIENT. */
export function GET() {
  const pub = site.adsenseClient?.replace(/^ca-/, "");
  const body = pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : "# AdSense not configured\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

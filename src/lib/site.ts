export const site = {
  name: "GTA VI Daily",
  tagline: "Daily news, trailers and guides for Grand Theft Auto VI",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || null,
};

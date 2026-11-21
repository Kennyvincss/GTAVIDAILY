/**
 * Ready-made gear picks for GTA VI players (PS5 / Xbox Series X|S only:
 * no PC version has been announced). Links go to an Amazon search for the
 * exact product, tagged with the site owner's Associates ID, so they always
 * land on a current listing. No prices or Amazon images, per Associates rules.
 */

export type StarterGear = {
  slug: string;
  name: string;
  category: string;
  /** Amazon search query */
  query: string;
  description: string;
};

export const STARTER_GEAR: StarterGear[] = [
  // The game
  { slug: "gta-vi-ps5", name: "Grand Theft Auto VI (PS5)", category: "The game", query: "Grand Theft Auto VI PS5", description: "The game itself, on PlayStation 5." },
  { slug: "gta-vi-xbox", name: "Grand Theft Auto VI (Xbox Series X|S)", category: "The game", query: "Grand Theft Auto VI Xbox Series X", description: "The game itself, on Xbox Series X|S." },
  // Consoles
  { slug: "playstation-5-console", name: "PlayStation 5 console", category: "Consoles", query: "PlayStation 5 console", description: "Sony's current console, one of the two platforms GTA VI runs on." },
  { slug: "playstation-5-pro", name: "PlayStation 5 Pro", category: "Consoles", query: "PlayStation 5 Pro console", description: "The more powerful PS5, with an upgraded GPU and PSSR upscaling for sharper images." },
  { slug: "xbox-series-x", name: "Xbox Series X", category: "Consoles", query: "Xbox Series X console", description: "Microsoft's most powerful console, built for 4K gaming." },
  { slug: "xbox-series-s", name: "Xbox Series S", category: "Consoles", query: "Xbox Series S console", description: "The smaller, cheaper Xbox. It plays GTA VI at lower resolutions." },
  // Controllers
  { slug: "dualsense-wireless-controller", name: "DualSense Wireless Controller", category: "Controllers", query: "DualSense Wireless Controller PS5", description: "The standard PS5 controller, with haptic feedback and adaptive triggers. A spare is handy." },
  { slug: "dualsense-edge", name: "DualSense Edge", category: "Controllers", query: "DualSense Edge wireless controller", description: "Sony's pro controller, with back buttons, swappable stick modules and custom profiles." },
  { slug: "xbox-wireless-controller", name: "Xbox Wireless Controller", category: "Controllers", query: "Xbox Wireless Controller", description: "The standard Xbox Series X|S controller." },
  { slug: "xbox-elite-series-2", name: "Xbox Elite Wireless Controller Series 2", category: "Controllers", query: "Xbox Elite Wireless Controller Series 2", description: "Microsoft's pro controller, with paddles, adjustable-tension sticks and a rechargeable battery." },
  // Audio
  { slug: "playstation-pulse-elite", name: "PlayStation Pulse Elite headset", category: "Headsets", query: "PlayStation Pulse Elite wireless headset", description: "Sony's wireless headset for PS5, with planar magnetic drivers and a retractable mic." },
  { slug: "xbox-wireless-headset", name: "Xbox Wireless Headset", category: "Headsets", query: "Xbox Wireless Headset", description: "Microsoft's wireless headset, which connects straight to Xbox without a dongle." },
  { slug: "steelseries-arctis-nova-7", name: "SteelSeries Arctis Nova 7 Wireless", category: "Headsets", query: "SteelSeries Arctis Nova 7 Wireless", description: "A popular multi-platform wireless headset that works with PS5 and Xbox versions." },
  // Storage
  { slug: "ps5-m2-ssd-heatsink", name: "M.2 SSD with heatsink for PS5", category: "Storage", query: "Samsung 990 PRO heatsink PS5 SSD", description: "Extra space for a huge open world. PS5-compatible M.2 drives need a heatsink." },
  { slug: "xbox-storage-expansion-card", name: "Seagate Storage Expansion Card for Xbox Series X|S", category: "Storage", query: "Seagate Storage Expansion Card Xbox Series X|S", description: "Plugs into the Xbox expansion slot and runs games at full internal-drive speed." },
  // Accessories
  { slug: "playstation-portal", name: "PlayStation Portal remote player", category: "Accessories", query: "PlayStation Portal remote player", description: "A handheld screen that streams your PS5 games over Wi-Fi, so you can play GTA VI around the house." },
  { slug: "dualsense-charging-station", name: "DualSense Charging Station", category: "Accessories", query: "DualSense Charging Station", description: "Charges two PS5 controllers at once without tying up the console's USB ports." },
];

/** Amazon stores, by domain. */
export const AMAZON_STORES: Record<string, string> = {
  "amazon.com": "Amazon US",
  "amazon.co.uk": "Amazon UK",
  "amazon.ca": "Amazon Canada",
  "amazon.com.au": "Amazon Australia",
  "amazon.de": "Amazon Germany",
  "amazon.fr": "Amazon France",
  "amazon.es": "Amazon Spain",
  "amazon.it": "Amazon Italy",
  "amazon.in": "Amazon India",
  "amazon.ae": "Amazon UAE",
};

export function amazonSearchUrl(domain: string, query: string, tag: string | null): string {
  const u = new URL(`https://www.${domain}/s`);
  u.searchParams.set("k", query);
  if (tag) u.searchParams.set("tag", tag);
  return u.toString();
}

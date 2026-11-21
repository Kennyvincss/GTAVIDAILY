import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { COVER_THEMES, DEFAULT_THEME } from "@/lib/covers";

export const runtime = "nodejs";

const W = 1200;
const H = 675;
const HORIZON = 455;

let fonts: Promise<{ display: Buffer; bold: Buffer }> | null = null;
function loadFonts() {
  const dir = path.join(process.cwd(), "src/assets/fonts");
  fonts ??= Promise.all([readFile(path.join(dir, "ArchivoBlack-400.woff")), readFile(path.join(dir, "Inter-700.woff"))]).then(
    ([display, bold]) => ({ display, bold }),
  );
  return fonts;
}

/** Small deterministic PRNG so each article gets its own (stable) variation. */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** A palm silhouette: tapered, curving trunk and drooping leaf-shaped fronds. */
function palm(x: number, base: number, height: number, lean: number, color: string, r: () => number) {
  const topX = x + lean;
  const topY = base - height;
  const midX = x + lean * 0.15;
  const midY = base - height * 0.55;
  const trunk = `<path d="M ${x - 14} ${base} Q ${midX - 9} ${midY} ${topX - 5} ${topY} L ${topX + 5} ${topY} Q ${midX + 9} ${midY} ${x + 14} ${base} Z" fill="${color}"/>`;
  const fronds = [-170, -142, -112, -84, -58, -30, -4, 152, 196]
    .map((deg) => {
      const a = ((deg + (r() - 0.5) * 14) * Math.PI) / 180;
      const len = 135 + r() * 70;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const droop = len * (0.3 + r() * 0.2);
      const ex = topX + dx * len;
      const ey = topY + dy * len + droop;
      const ux = topX + dx * len * 0.5;
      const uy = topY + dy * len * 0.5 - len * 0.16;
      const lx = topX + dx * len * 0.58;
      const ly = topY + dy * len * 0.58 + len * 0.02;
      return `<path d="M ${topX} ${topY} Q ${ux} ${uy} ${ex} ${ey} Q ${lx} ${ly} ${topX} ${topY + 6} Z" fill="${color}"/>`;
    })
    .join("");
  const coconuts = `<circle cx="${topX - 6}" cy="${topY + 10}" r="7" fill="${color}"/><circle cx="${topX + 7}" cy="${topY + 12}" r="6" fill="${color}"/>`;
  return trunk + fronds + coconuts;
}

function sceneSvg(seed: string, theme: typeof DEFAULT_THEME) {
  const r = rng(seed);
  const sunX = 760 + r() * 260;
  const sunR = 150 + r() * 40;
  const sunY = HORIZON - sunR * (0.35 + r() * 0.3);
  // Sun bands (classic synthwave stripes), drawn in the sky colour near the horizon
  const bands = Array.from({ length: 6 }, (_, i) => {
    const y = sunY + sunR * (0.05 + i * 0.16);
    const h = 4 + i * 3;
    return `<rect x="${sunX - sunR - 2}" y="${y}" width="${sunR * 2 + 4}" height="${h}" fill="${theme.sky[2]}"/>`;
  }).join("");
  // Skyline along the horizon
  let skyline = "";
  for (let x = 380 + r() * 60; x < W; x += 18 + r() * 34) {
    const w = 16 + r() * 34;
    const h = 18 + r() * (x > 650 && x < 1000 ? 120 : 60);
    skyline += `<rect x="${x}" y="${HORIZON - h}" width="${w}" height="${h + 2}" fill="#160a24"/>`;
    if (r() > 0.75) skyline += `<rect x="${x + w / 2 - 1.5}" y="${HORIZON - h - 22}" width="3" height="22" fill="#160a24"/>`;
  }
  // Sun reflection on the water
  const reflection = Array.from({ length: 9 }, (_, i) => {
    const y = HORIZON + 14 + i * 22;
    const w = (sunR * 1.5 - i * 12) * (0.7 + r() * 0.5);
    return `<rect x="${sunX - w / 2}" y="${y}" width="${w}" height="${4 + (i % 3)}" rx="3" fill="${theme.sun[1]}" opacity="${0.55 - i * 0.05}"/>`;
  }).join("");
  // Perspective lines on the water
  const grid = Array.from({ length: 13 }, (_, i) => {
    const x = (i / 12) * W;
    return `<line x1="${sunX + (x - sunX) * 0.08}" y1="${HORIZON}" x2="${sunX + (x - sunX) * 2.4}" y2="${H}" stroke="${theme.label}" stroke-opacity="0.13" stroke-width="2"/>`;
  }).join("");
  const palms =
    (r() > 0.4 ? palm(250 + r() * 60, H + 10, 290 + r() * 40, 35, "#0d0718", r) : "") +
    palm(70 + r() * 40, H + 10, 440 + r() * 60, 70 + r() * 30, "#06030b", r) +
    palm(1140 - r() * 30, H + 10, 350 + r() * 60, -(55 + r() * 30), "#06030b", r);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${theme.sky[0]}"/><stop offset="0.55" stop-color="${theme.sky[1]}"/><stop offset="1" stop-color="${theme.sky[2]}"/>
    </linearGradient>
    <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${theme.sun[0]}"/><stop offset="1" stop-color="${theme.sun[1]}"/>
    </linearGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1b0b33"/><stop offset="1" stop-color="#05030b"/>
    </linearGradient>
    <clipPath id="above"><rect x="0" y="0" width="${W}" height="${HORIZON}"/></clipPath>
    <radialGradient id="glow" cx="${sunX / W}" cy="${sunY / H}" r="0.45">
      <stop offset="0" stop-color="${theme.sun[1]}" stop-opacity="0.45"/><stop offset="1" stop-color="${theme.sun[1]}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <g clip-path="url(#above)"><circle cx="${sunX}" cy="${sunY}" r="${sunR}" fill="url(#sun)"/>${bands}</g>
  ${skyline}
  <rect x="0" y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="url(#sea)"/>
  ${grid}${reflection}
  <rect x="0" y="${HORIZON - 1}" width="${W}" height="2" fill="${theme.label}" opacity="0.5"/>
  ${palms}
</svg>`;
}

/**
 * Generated cover art for an article: an original Vice-City-at-dusk scene in
 * the category's colours, with the category and headline. Used whenever an
 * article has no cover image of its own (and for social sharing previews).
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // style=art: scene, logo and category only (used on the site, where the headline is shown as text)
  const artOnly = new URL(req.url).searchParams.get("style") === "art";
  const article = await db.article.findUnique({
    where: { slug },
    select: { title: true, category: { select: { name: true, slug: true } } },
  });
  const title = article?.title ?? "GTA VI Daily";
  const catSlug = article?.category?.slug ?? "news";
  const theme = COVER_THEMES[catSlug] ?? DEFAULT_THEME;
  const { display, bold } = await loadFonts();
  const size = title.length > 70 ? 54 : title.length > 48 ? 62 : 72;
  const scene = `data:image/svg+xml;base64,${Buffer.from(sceneSvg(slug, theme)).toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", position: "relative", fontFamily: "Inter" }}>
        <img src={scene} width={W} height={H} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: artOnly ? 200 : 380,
            display: "flex",
            backgroundImage: "linear-gradient(180deg, rgba(8,5,16,0) 0%, rgba(8,5,16,0.82) 55%, rgba(8,5,16,0.95) 100%)",
          }}
        />
        <div style={{ position: "absolute", top: 40, left: 56, display: "flex", fontFamily: "Archivo Black", fontSize: 30 }}>
          <span style={{ color: "#ff3d8b" }}>GTA VI</span>
          <span style={{ color: "#ffffff", marginLeft: 12 }}>Daily</span>
        </div>
        <div style={{ position: "absolute", left: 56, right: 56, bottom: 52, display: "flex", flexDirection: "column" }}>
          {article?.category && (
            <div style={{ display: "flex" }}>
              <span
                style={{
                  fontSize: 22,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: "#0b0716",
                  background: theme.label,
                  padding: "6px 14px",
                  borderRadius: 999,
                }}
              >
                {article.category.name}
              </span>
            </div>
          )}
          {!artOnly && (
          <div
            style={{
              marginTop: 18,
              fontFamily: "Archivo Black",
              fontSize: size,
              lineHeight: 1.08,
              color: "#ffffff",
              textShadow: "0 4px 24px rgba(0,0,0,0.5)",
              display: "flex",
            }}
          >
            {title}
          </div>
          )}
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: "Archivo Black", data: display, weight: 400, style: "normal" },
        { name: "Inter", data: bold, weight: 700, style: "normal" },
      ],
      headers: {
        // URLs carry ?v=<updatedAt>, so a cover can be cached for a long time.
        "Cache-Control": "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400",
      },
    },
  );
}

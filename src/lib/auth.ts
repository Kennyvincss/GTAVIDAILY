// Admin session tokens, signed with HMAC-SHA256 via Web Crypto so the same
// code runs in middleware (edge) and in server actions (node).

export const ADMIN_COOKIE = "gvd_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

/** Returns a human-readable problem with the admin configuration, or null when it is usable. */
export function adminConfigProblem(): string | null {
  if (!process.env.ADMIN_PASSWORD) return "ADMIN_PASSWORD is not set.";
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) return "ADMIN_SESSION_SECRET is not set.";
  if (s.length < 16) return `ADMIN_SESSION_SECRET is too short (${s.length} characters; use at least 16).`;
  return null;
}

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("ADMIN_SESSION_SECRET must be set (16+ characters).");
  }
  return s;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(): Promise<{ token: string; maxAge: number }> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `admin.${exp}`;
  return { token: `${payload}.${await hmac(payload)}`, maxAge: SESSION_TTL_SECONDS };
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "admin") return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp < Date.now() / 1000) return false;
  try {
    return timingSafeEqual(parts[2], await hmac(`${parts[0]}.${parts[1]}`));
  } catch {
    return false;
  }
}

export async function checkPassword(input: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Compare HMACs so length differences don't leak through timing.
  return timingSafeEqual(await hmac(`pw:${input}`), await hmac(`pw:${expected}`));
}

/**
 * Lightweight JWT utilities for edge functions.
 * The Supabase `verify_jwt = true` setting cryptographically verifies the token
 * BEFORE our code runs, so decoding without re-verification is safe here.
 */

/**
 * Extracts the user ID (sub claim) from a Bearer token header.
 * Returns null if the header is absent or the token is malformed.
 */
export function getUserIdFromBearer(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const payloadB64 = token.split(".")[1];
    if (!payloadB64) return null;
    // atob handles standard base64; JWT uses URL-safe base64 so pad/replace first
    const padded = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded);
    const payload = JSON.parse(json);
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

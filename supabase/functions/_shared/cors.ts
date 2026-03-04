/**
 * CORS utility — replaces the old `"Access-Control-Allow-Origin": "*"` pattern.
 *
 * Set the ALLOWED_ORIGIN environment variable in your Supabase project to your
 * production domain, e.g. "https://yourapp.com" or a comma-separated list:
 *   "https://yourapp.com,https://www.yourapp.com"
 *
 * During local development the Lovable/Vite dev server origin is also allowed.
 */

const ALLOWED_ORIGINS: string[] = (() => {
  const raw = Deno.env.get("ALLOWED_ORIGIN") || "";
  const origins = raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  // Always allow localhost variants for local development
  const devOrigins = [
    "http://localhost:8080",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:8080",
  ];

  return [...new Set([...origins, ...devOrigins])];
})();

const ALLOW_HEADERS =
  "authorization, x-client-info, apikey, content-type, " +
  "x-supabase-client-platform, x-supabase-client-platform-version, " +
  "x-supabase-client-runtime, x-supabase-client-runtime-version";

/**
 * Returns CORS headers for a given request.
 * The `Access-Control-Allow-Origin` value is set to the request's `Origin`
 * only if that origin is in the allowlist; otherwise the first allowed origin
 * is returned (the browser will reject it, which is the intended behaviour).
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const requestOrigin = req.headers.get("Origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : ALLOWED_ORIGINS[0] ?? "";

  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };
}

/**
 * Shorthand: handle an OPTIONS preflight and return null when done,
 * or return the CORS headers to spread into your response headers.
 */
export function handleCors(
  req: Request
): { headers: Record<string, string>; preflight: Response | null } {
  const headers = getCorsHeaders(req);
  const preflight =
    req.method === "OPTIONS"
      ? new Response(null, { headers })
      : null;
  return { headers, preflight };
}

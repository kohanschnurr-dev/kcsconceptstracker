import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";

const QB_CLIENT_ID = Deno.env.get("QUICKBOOKS_CLIENT_ID");
const QB_CLIENT_SECRET = Deno.env.get("QUICKBOOKS_CLIENT_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// QuickBooks OAuth endpoints
const QB_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QB_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

// Refresh the access token using the refresh token
async function refreshAccessToken(userId: string, refreshTokenValue: string, realmId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const tokenResponse = await fetch(QB_TOKEN_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshTokenValue,
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error("Token refresh error:", tokens.error);
      return { success: false, error: tokens.error_description || tokens.error };
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const serviceSupabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { error: updateError } = await serviceSupabase
      .from("quickbooks_tokens")
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt.toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating tokens:", updateError);
      return { success: false, error: "Failed to save refreshed tokens" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error refreshing token:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Get the app URL for redirects and postMessage origin restriction
const APP_URL = Deno.env.get("APP_URL") || "http://localhost:8080";

serve(async (req) => {
  const { headers: corsHeaders, preflight } = handleCors(req);
  if (preflight) return preflight;

  try {
    const url = new URL(req.url);

    // Get action from query param (for OAuth callback) or from body
    let action = url.searchParams.get("action");
    let body: Record<string, unknown> = {};

    if (req.method === "POST") {
      try {
        const text = await req.text();
        if (text) {
          body = JSON.parse(text);
          if (!action && body.action) {
            action = body.action as string;
          }
        }
      } catch (e) {
        // Body parsing failed — not a JSON request
      }
    }

    // Handle callback separately - it doesn't have auth header (browser redirect)
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const realmId = url.searchParams.get("realmId");
      const state = url.searchParams.get("state");

      if (!code || !realmId || !state) {
        const error = url.searchParams.get("error");
        const errorDescription = url.searchParams.get("error_description");
        if (error) {
          console.error("QuickBooks auth error:", error);
          return new Response(
            `<html><body><h1>Connection Failed</h1><p>${errorDescription || error}</p><script>setTimeout(() => window.close(), 3000);</script></body></html>`,
            { headers: { "Content-Type": "text/html" } }
          );
        }
        return new Response(
          `<html><body><h1>Error</h1><p>Missing required parameters</p></body></html>`,
          { headers: { "Content-Type": "text/html" } }
        );
      }

      const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

      const { data: stateData, error: stateError } = await supabaseAdmin
        .from("quickbooks_oauth_states")
        .select("user_id, expires_at")
        .eq("state", state)
        .single();

      if (stateError || !stateData) {
        console.error("State lookup error:", stateError?.message);
        return new Response(
          `<html><body><h1>Error</h1><p>Invalid or expired state. Please try connecting again.</p></body></html>`,
          { headers: { "Content-Type": "text/html" } }
        );
      }

      if (new Date(stateData.expires_at) < new Date()) {
        await supabaseAdmin.from("quickbooks_oauth_states").delete().eq("state", state);
        return new Response(
          `<html><body><h1>Error</h1><p>Authorization expired. Please try connecting again.</p></body></html>`,
          { headers: { "Content-Type": "text/html" } }
        );
      }

      const userId = stateData.user_id;
      const redirectUri = `${SUPABASE_URL}/functions/v1/quickbooks-auth?action=callback`;

      const tokenResponse = await fetch(QB_TOKEN_URL, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${btoa(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        console.error("Token exchange error:", tokens.error);
        return new Response(
          `<html><body><h1>Error</h1><p>${tokens.error_description || tokens.error}</p></body></html>`,
          { headers: { "Content-Type": "text/html" } }
        );
      }

      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      const { error: upsertError } = await supabaseAdmin
        .from("quickbooks_tokens")
        .upsert({
          user_id: userId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          realm_id: realmId,
          expires_at: expiresAt.toISOString(),
        }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error("Error storing tokens:", upsertError);
        return new Response(
          `<html><body><h1>Error</h1><p>Failed to save connection. Please try again.</p></body></html>`,
          { headers: { "Content-Type": "text/html" } }
        );
      }

      await supabaseAdmin.from("quickbooks_oauth_states").delete().eq("state", state);

      // Use APP_URL as the postMessage target origin — never '*'
      const safeAppUrl = APP_URL.startsWith("http") ? APP_URL : `https://${APP_URL}`;

      return new Response(
        `<!DOCTYPE html>
        <html>
          <head><title>Connected!</title></head>
          <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0f9ff;">
            <div style="text-align: center; padding: 2rem;">
              <div style="font-size: 48px; margin-bottom: 1rem;">&#x2705;</div>
              <h1 style="color: #0f766e; margin: 0;">Connected to QuickBooks!</h1>
              <p style="color: #6b7280;">You can close this window and return to the app.</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'quickbooks-connected' }, '${safeAppUrl}');
                  setTimeout(() => window.close(), 2000);
                }
              </script>
            </div>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // All other actions require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    if (action === "authorize") {
      const state = crypto.randomUUID();
      const redirectUri = `${SUPABASE_URL}/functions/v1/quickbooks-auth?action=callback`;

      const { error: stateError } = await supabase
        .from("quickbooks_oauth_states")
        .insert({
          user_id: userId,
          state: state,
        });

      if (stateError) {
        console.error("Error storing state:", stateError);
        return new Response(JSON.stringify({ error: "Failed to initialize authorization" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const authUrl = new URL(QB_AUTH_URL);
      authUrl.searchParams.set("client_id", QB_CLIENT_ID!);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "com.intuit.quickbooks.accounting");
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("state", state);

      return new Response(JSON.stringify({ authUrl: authUrl.toString(), state }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "status") {
      const { data: tokenData, error: tokenError } = await supabase
        .from("quickbooks_tokens")
        .select("expires_at, realm_id, refresh_token")
        .eq("user_id", userId)
        .single();

      if (tokenError || !tokenData) {
        return new Response(JSON.stringify({ connected: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const isExpired = new Date(tokenData.expires_at) < new Date();

      if (isExpired && tokenData.refresh_token) {
        const refreshResult = await refreshAccessToken(userId, tokenData.refresh_token, tokenData.realm_id);

        if (refreshResult.success) {
          return new Response(JSON.stringify({
            connected: true,
            realmId: tokenData.realm_id,
            refreshed: true,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          console.error("Token refresh failed:", refreshResult.error);
          return new Response(JSON.stringify({
            connected: false,
            needsReconnect: true,
            error: refreshResult.error,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(JSON.stringify({
        connected: !isExpired,
        realmId: tokenData.realm_id,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disconnect") {
      await supabase
        .from("quickbooks_tokens")
        .delete()
        .eq("user_id", userId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "An error occurred";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

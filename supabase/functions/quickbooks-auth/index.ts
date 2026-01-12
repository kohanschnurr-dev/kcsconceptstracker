import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QB_CLIENT_ID = Deno.env.get("QUICKBOOKS_CLIENT_ID");
const QB_CLIENT_SECRET = Deno.env.get("QUICKBOOKS_CLIENT_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

// QuickBooks OAuth endpoints
const QB_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QB_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Get action from query param (for OAuth callback) or from body
    let action = url.searchParams.get("action");
    let body: Record<string, unknown> = {};
    
    // Always try to parse body for POST requests
    if (req.method === "POST") {
      try {
        const text = await req.text();
        console.log("Request body text:", text);
        if (text) {
          body = JSON.parse(text);
          console.log("Parsed body:", JSON.stringify(body));
          if (!action && body.action) {
            action = body.action as string;
          }
        }
      } catch (e) {
        console.log("Failed to parse body:", e);
      }
    }
    
    console.log("Action:", action, "Method:", req.method);
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "authorize") {
      // Generate the OAuth authorization URL
      // Use the full edge function URL for redirect
      const redirectUri = `${SUPABASE_URL}/functions/v1/quickbooks-auth?action=callback`;
      const state = crypto.randomUUID();
      
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

    if (action === "callback") {
      // Handle OAuth callback
      const code = url.searchParams.get("code");
      const realmId = url.searchParams.get("realmId");

      if (!code || !realmId) {
        return new Response(JSON.stringify({ error: "Missing code or realmId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const redirectUri = `${SUPABASE_URL}/functions/v1/quickbooks-auth?action=callback`;

      // Exchange code for tokens
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
        return new Response(JSON.stringify({ error: tokens.error_description || tokens.error }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      // Store tokens in database
      const { error: upsertError } = await supabase
        .from("quickbooks_tokens")
        .upsert({
          user_id: user.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          realm_id: realmId,
          expires_at: expiresAt.toISOString(),
        });

      if (upsertError) {
        console.error("Error storing tokens:", upsertError);
        return new Response(JSON.stringify({ error: "Failed to store tokens" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "status") {
      // Check if user is connected to QuickBooks
      const { data: tokenData, error: tokenError } = await supabase
        .from("quickbooks_tokens")
        .select("expires_at, realm_id")
        .eq("user_id", user.id)
        .single();

      if (tokenError || !tokenData) {
        return new Response(JSON.stringify({ connected: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const isExpired = new Date(tokenData.expires_at) < new Date();
      
      return new Response(JSON.stringify({ 
        connected: !isExpired,
        realmId: tokenData.realm_id,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disconnect") {
      // Remove tokens from database
      await supabase
        .from("quickbooks_tokens")
        .delete()
        .eq("user_id", user.id);

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

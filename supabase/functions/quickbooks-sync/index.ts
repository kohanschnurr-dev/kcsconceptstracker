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
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const QB_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const QB_API_BASE = "https://quickbooks.api.intuit.com/v3/company";

async function refreshToken(supabase: any, userId: string, refreshTokenValue: string, realmId: string) {
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
    throw new Error(tokens.error_description || tokens.error);
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  // Use service role to update tokens
  const serviceSupabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  
  await serviceSupabase
    .from("quickbooks_tokens")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt.toISOString(),
    })
    .eq("user_id", userId);

  return tokens.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Get user's QuickBooks tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from("quickbooks_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: "QuickBooks not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accessToken = tokenData.access_token;
    
    // Check if token is expired and refresh if needed
    if (new Date(tokenData.expires_at) < new Date()) {
      accessToken = await refreshToken(
        supabase, 
        user.id, 
        tokenData.refresh_token, 
        tokenData.realm_id
      );
    }

    // Parse request body for date range
    const body = await req.json().catch(() => ({}));
    const startDate = body.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = body.endDate || new Date().toISOString().split('T')[0];

    // Query QuickBooks for purchases/expenses
    const query = `SELECT * FROM Purchase WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}'`;
    const encodedQuery = encodeURIComponent(query);

    const qbResponse = await fetch(
      `${QB_API_BASE}/${tokenData.realm_id}/query?query=${encodedQuery}`,
      {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    );

    if (!qbResponse.ok) {
      const errorText = await qbResponse.text();
      console.error("QuickBooks API error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to fetch expenses from QuickBooks" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const qbData = await qbResponse.json();
    const purchases = qbData.QueryResponse?.Purchase || [];

    // Also fetch Bills
    const billQuery = `SELECT * FROM Bill WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}'`;
    const encodedBillQuery = encodeURIComponent(billQuery);

    const billResponse = await fetch(
      `${QB_API_BASE}/${tokenData.realm_id}/query?query=${encodedBillQuery}`,
      {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    );

    let bills: any[] = [];
    if (billResponse.ok) {
      const billData = await billResponse.json();
      bills = billData.QueryResponse?.Bill || [];
    }

    // Transform and upsert expenses
    const expenses: any[] = [];

    for (const purchase of purchases) {
      const expense = {
        user_id: user.id,
        qb_id: `purchase_${purchase.Id}`,
        vendor_name: purchase.EntityRef?.name || "Unknown Vendor",
        amount: purchase.TotalAmt || 0,
        date: purchase.TxnDate,
        description: purchase.PrivateNote || purchase.Line?.[0]?.Description || "",
        payment_method: mapPaymentMethod(purchase.PaymentType),
        is_imported: false,
      };
      expenses.push(expense);
    }

    for (const bill of bills) {
      const expense = {
        user_id: user.id,
        qb_id: `bill_${bill.Id}`,
        vendor_name: bill.VendorRef?.name || "Unknown Vendor",
        amount: bill.TotalAmt || 0,
        date: bill.TxnDate,
        description: bill.PrivateNote || bill.Line?.[0]?.Description || "",
        payment_method: "transfer", // Bills are typically paid via transfer
        is_imported: false,
      };
      expenses.push(expense);
    }

    // Upsert expenses (using service role to bypass RLS for batch operations)
    const serviceSupabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    for (const expense of expenses) {
      await serviceSupabase
        .from("quickbooks_expenses")
        .upsert(expense, { onConflict: "user_id,qb_id" });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      synced: expenses.length,
      message: `Synced ${expenses.length} expenses from QuickBooks`
    }), {
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

function mapPaymentMethod(qbPaymentType: string): string {
  const mapping: Record<string, string> = {
    "Cash": "cash",
    "Check": "check",
    "CreditCard": "card",
    "ECheck": "transfer",
  };
  return mapping[qbPaymentType] || "transfer";
}

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

async function queryQuickBooks(realmId: string, accessToken: string, query: string) {
  const encodedQuery = encodeURIComponent(query);
  const response = await fetch(
    `${QB_API_BASE}/${realmId}/query?query=${encodedQuery}`,
    {
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    console.error(`QuickBooks API error for query "${query}":`, await response.text());
    return [];
  }
  
  const data = await response.json();
  return data.QueryResponse || {};
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("Missing or invalid auth header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Use getClaims to validate the JWT token (works with new signing-keys system)
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.log("Token validation failed:", claimsError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Get user's QuickBooks tokens (read from decrypted view)
    const serviceSupabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { data: tokenData, error: tokenError } = await serviceSupabase
      .from("quickbooks_tokens_decrypted")
      .select("*")
      .eq("user_id", userId)
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
        userId, 
        tokenData.refresh_token, 
        tokenData.realm_id
      );
    }

    // Parse request body for date range - default to last 30 days
    const body = await req.json().catch(() => ({}));
    const startDate = body.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = body.endDate || new Date().toISOString().split('T')[0];

    console.log(`Syncing expenses from ${startDate} to ${endDate}`);

    const expenses: any[] = [];
    const realmId = tokenData.realm_id;

    // 1. Fetch Purchases (direct purchases, credit card charges, etc.)
    const purchaseQuery = `SELECT * FROM Purchase WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' MAXRESULTS 1000`;
    const purchaseResponse = await queryQuickBooks(realmId, accessToken, purchaseQuery);
    const purchases = purchaseResponse.Purchase || [];
    console.log(`Found ${purchases.length} purchases`);

    for (const purchase of purchases) {
      expenses.push({
        user_id: userId,
        qb_id: `purchase_${purchase.Id}`,
        vendor_name: purchase.EntityRef?.name || extractVendorFromDescription(purchase.PrivateNote || purchase.Line?.[0]?.Description) || "Unknown Vendor",
        amount: purchase.TotalAmt || 0,
        date: purchase.TxnDate,
        description: purchase.PrivateNote || purchase.Line?.[0]?.Description || "",
        payment_method: mapPaymentMethod(purchase.PaymentType),
        account_name: purchase.AccountRef?.name || purchase.Credit?.AccountRef?.name || "Unknown Account",
        is_imported: false,
      });
    }

    // 2. Fetch Bills
    const billQuery = `SELECT * FROM Bill WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' MAXRESULTS 1000`;
    const billResponse = await queryQuickBooks(realmId, accessToken, billQuery);
    const bills = billResponse.Bill || [];
    console.log(`Found ${bills.length} bills`);

    for (const bill of bills) {
      expenses.push({
        user_id: userId,
        qb_id: `bill_${bill.Id}`,
        vendor_name: bill.VendorRef?.name || "Unknown Vendor",
        amount: bill.TotalAmt || 0,
        date: bill.TxnDate,
        description: bill.PrivateNote || bill.Line?.[0]?.Description || "",
        payment_method: "transfer",
        account_name: bill.APAccountRef?.name || "Accounts Payable",
        is_imported: false,
      });
    }

    // 3. Fetch Expenses (Expense reports)
    const expenseQuery = `SELECT * FROM Purchase WHERE PaymentType = 'Cash' AND TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' MAXRESULTS 1000`;
    // This is already covered by purchases above

    // 4. Fetch Deposits (money received - for tracking income)
    const depositQuery = `SELECT * FROM Deposit WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' MAXRESULTS 1000`;
    const depositResponse = await queryQuickBooks(realmId, accessToken, depositQuery);
    const deposits = depositResponse.Deposit || [];
    console.log(`Found ${deposits.length} deposits`);

    // 5. Fetch Transfers
    const transferQuery = `SELECT * FROM Transfer WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' MAXRESULTS 1000`;
    const transferResponse = await queryQuickBooks(realmId, accessToken, transferQuery);
    const transfers = transferResponse.Transfer || [];
    console.log(`Found ${transfers.length} transfers`);

    for (const transfer of transfers) {
      expenses.push({
        user_id: userId,
        qb_id: `transfer_${transfer.Id}`,
        vendor_name: transfer.ToAccountRef?.name || transfer.FromAccountRef?.name || "Transfer",
        amount: transfer.Amount || 0,
        date: transfer.TxnDate,
        description: transfer.PrivateNote || `Transfer: ${transfer.FromAccountRef?.name || ''} → ${transfer.ToAccountRef?.name || ''}`,
        payment_method: "transfer",
        account_name: transfer.FromAccountRef?.name || "Unknown Account",
        is_imported: false,
      });
    }

    // 6. Fetch JournalEntries that might represent expenses
    const journalQuery = `SELECT * FROM JournalEntry WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' MAXRESULTS 1000`;
    const journalResponse = await queryQuickBooks(realmId, accessToken, journalQuery);
    const journals = journalResponse.JournalEntry || [];
    console.log(`Found ${journals.length} journal entries`);

    // 7. Fetch Checks
    const checkQuery = `SELECT * FROM Purchase WHERE PaymentType = 'Check' AND TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' MAXRESULTS 1000`;
    // Already covered by purchases

    // 8. Fetch Credit Card charges specifically
    const ccQuery = `SELECT * FROM Purchase WHERE PaymentType = 'CreditCard' AND TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' MAXRESULTS 1000`;
    // Already covered by purchases

    // 9. Fetch VendorCredits
    const vendorCreditQuery = `SELECT * FROM VendorCredit WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' MAXRESULTS 1000`;
    const vendorCreditResponse = await queryQuickBooks(realmId, accessToken, vendorCreditQuery);
    const vendorCredits = vendorCreditResponse.VendorCredit || [];
    console.log(`Found ${vendorCredits.length} vendor credits`);

    console.log(`Total expenses to sync: ${expenses.length}`);

    // Upsert expenses (using service role to bypass RLS for batch operations)
    // IMPORTANT: Preserve project_id, category_id, and is_imported for already-assigned expenses
    // Reuse serviceSupabase declared above
    
    let successCount = 0;
    let skippedCount = 0;
    
    for (const expense of expenses) {
      // First, check if this expense already exists and has been assigned
      const { data: existing } = await serviceSupabase
        .from("quickbooks_expenses")
        .select("id, project_id, category_id, is_imported")
        .eq("user_id", expense.user_id)
        .eq("qb_id", expense.qb_id)
        .maybeSingle();
      
      if (existing && (existing.project_id || existing.is_imported)) {
        // Expense was already assigned - only update non-assignment fields
        const { error } = await serviceSupabase
          .from("quickbooks_expenses")
          .update({
            vendor_name: expense.vendor_name,
            amount: expense.amount,
            date: expense.date,
            description: expense.description,
            payment_method: expense.payment_method,
            account_name: expense.account_name,
            // Preserve: project_id, category_id, is_imported
          })
          .eq("id", existing.id);
        
        if (!error) {
          skippedCount++;
        } else {
          console.error("Error updating existing expense:", error);
        }
      } else if (!existing) {
        // NEW: Check if splits exist for this transaction before inserting
        const { data: existingSplits } = await serviceSupabase
          .from("quickbooks_expenses")
          .select("id")
          .eq("user_id", expense.user_id)
          .like("qb_id", `${expense.qb_id}_split_%`)
          .limit(1);
        
        if (existingSplits && existingSplits.length > 0) {
          // Splits exist - skip inserting parent record to prevent duplicates
          skippedCount++;
          console.log(`Skipping ${expense.qb_id} - splits already exist`);
        } else {
          // New expense - full upsert
          const { error } = await serviceSupabase
            .from("quickbooks_expenses")
            .upsert(expense, { onConflict: "user_id,qb_id" });
          
          if (!error) {
            successCount++;
          } else {
            console.error("Error upserting expense:", error);
          }
        }
      } else {
        // Existing but not yet assigned - update it
        const { error } = await serviceSupabase
          .from("quickbooks_expenses")
          .upsert(expense, { onConflict: "user_id,qb_id" });
        
        if (!error) {
          successCount++;
        } else {
          console.error("Error upserting expense:", error);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      synced: successCount,
      preserved: skippedCount,
      total: expenses.length,
      message: `Synced ${successCount} new expenses, preserved ${skippedCount} already-assigned expenses`
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

function extractVendorFromDescription(description: string | undefined): string | null {
  if (!description) return null;
  
  // Try to extract vendor name from common patterns
  // e.g., "Zelle Ralph Checri" -> "Zelle Ralph Checri"
  // e.g., "THE HOME DEPOT #0564" -> "Home Depot"
  
  const knownVendors = ["Home Depot", "Lowes", "Menards", "Amazon", "Walmart", "Costco"];
  for (const vendor of knownVendors) {
    if (description.toLowerCase().includes(vendor.toLowerCase())) {
      return vendor;
    }
  }
  
  // Return first few words as vendor name
  const words = description.split(/\s+/).slice(0, 3).join(" ");
  return words.length > 3 ? words : null;
}
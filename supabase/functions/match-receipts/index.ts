import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Vendor name normalization for fuzzy matching
function normalizeVendorName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // Remove special characters
    .replace(/\s+/g, " ")
    .trim()
    // Common vendor name variations
    .replace(/the home depot/g, "home depot")
    .replace(/homedepot/g, "home depot")
    .replace(/hd supply/g, "home depot")
    .replace(/lowes/g, "lowes")
    .replace(/lowe's/g, "lowes")
    .replace(/amazon\.com/g, "amazon")
    .replace(/amzn/g, "amazon")
    .replace(/wal-?mart/g, "walmart")
    .replace(/floor & decor/g, "floor decor")
    .replace(/floor and decor/g, "floor decor")
    .replace(/menard/g, "menards");
}

// Calculate similarity between two vendor names (0-1 score)
function vendorSimilarity(vendor1: string, vendor2: string): number {
  const norm1 = normalizeVendorName(vendor1);
  const norm2 = normalizeVendorName(vendor2);
  
  if (norm1 === norm2) return 1.0;
  
  // Check if one contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.9;
  
  // Simple word overlap score
  const words1 = new Set(norm1.split(" ").filter(w => w.length > 2));
  const words2 = new Set(norm2.split(" ").filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;
  
  return intersection / union;
}

// Check if date is within range (default 5 day window for bank processing)
function isDateInRange(receiptDate: string, transactionDate: string, daysBefore = 2, daysAfter = 5): boolean {
  const receipt = new Date(receiptDate);
  const transaction = new Date(transactionDate);
  
  const diffDays = (transaction.getTime() - receipt.getTime()) / (1000 * 60 * 60 * 24);
  
  // Transaction should be on or after receipt date (within range for processing)
  return diffDays >= -daysBefore && diffDays <= daysAfter;
}

interface Match {
  receipt_id: string;
  qb_expense_id: string;
  qb_id: string;
  confidence: number;
  vendor_match: number;
  amount_match: boolean;
  date_in_range: boolean;
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

    const serviceSupabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch pending receipts
    const { data: pendingReceipts, error: receiptsError } = await supabase
      .from("pending_receipts")
      .select("*")
      .eq("status", "pending");

    if (receiptsError) {
      console.error("Error fetching pending receipts:", receiptsError);
      throw new Error("Failed to fetch pending receipts");
    }

    if (!pendingReceipts || pendingReceipts.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        matches: [],
        message: "No pending receipts to match" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${pendingReceipts.length} pending receipts to match`);

    // Fetch unimported QuickBooks expenses
    const { data: qbExpenses, error: qbError } = await supabase
      .from("quickbooks_expenses")
      .select("*")
      .eq("is_imported", false)
      .is("project_id", null);

    if (qbError) {
      console.error("Error fetching QB expenses:", qbError);
      throw new Error("Failed to fetch QuickBooks expenses");
    }

    if (!qbExpenses || qbExpenses.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        matches: [],
        message: "No unmatched QuickBooks transactions available" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Checking against ${qbExpenses.length} QB expenses`);

    const matches: Match[] = [];

    // Try to match each pending receipt
    for (const receipt of pendingReceipts) {
      let bestMatch: Match | null = null;
      let bestConfidence = 0;

      for (const qbExpense of qbExpenses) {
        // Exact amount match is required
        const receiptAmount = parseFloat(receipt.total_amount);
        const qbAmount = parseFloat(qbExpense.amount);
        
        if (Math.abs(receiptAmount - qbAmount) > 0.01) {
          continue; // Amount must match exactly
        }

        // Check date range
        const dateMatch = isDateInRange(receipt.purchase_date, qbExpense.date);
        if (!dateMatch) {
          continue; // Date must be within range
        }

        // Calculate vendor similarity
        const vendorScore = vendorSimilarity(receipt.vendor_name, qbExpense.vendor_name);
        
        // Minimum vendor similarity threshold
        if (vendorScore < 0.3) {
          continue;
        }

        // Calculate overall confidence
        // Amount match = 50%, Date in range = 20%, Vendor similarity = 30%
        const confidence = 0.5 + 0.2 + (vendorScore * 0.3);

        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestMatch = {
            receipt_id: receipt.id,
            qb_expense_id: qbExpense.id,
            qb_id: qbExpense.qb_id,
            confidence: Math.round(confidence * 100),
            vendor_match: Math.round(vendorScore * 100),
            amount_match: true,
            date_in_range: true,
          };
        }
      }

      if (bestMatch && bestConfidence >= 0.7) {
        matches.push(bestMatch);

        // Update the receipt status to matched
        await serviceSupabase
          .from("pending_receipts")
          .update({
            status: "matched",
            matched_qb_id: bestMatch.qb_id,
            matched_at: new Date().toISOString(),
            match_confidence: bestMatch.confidence,
          })
          .eq("id", receipt.id);

        console.log(`Matched receipt ${receipt.id} to QB expense ${bestMatch.qb_id} with ${bestMatch.confidence}% confidence`);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      matches,
      message: `Found ${matches.length} matches out of ${pendingReceipts.length} pending receipts`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error matching receipts:", error);
    const message = error instanceof Error ? error.message : "Failed to match receipts";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

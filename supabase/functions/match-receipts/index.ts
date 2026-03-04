import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { RateLimiter } from "../_shared/rateLimiter.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Vendor name normalization for fuzzy matching
function normalizeVendorName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
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

function vendorSimilarity(vendor1: string, vendor2: string): number {
  const norm1 = normalizeVendorName(vendor1);
  const norm2 = normalizeVendorName(vendor2);

  if (norm1 === norm2) return 1.0;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.9;

  const words1 = new Set(norm1.split(" ").filter(w => w.length > 2));
  const words2 = new Set(norm2.split(" ").filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;

  return intersection / union;
}

function isDateInRange(receiptDate: string, transactionDate: string, daysBefore = 2, daysAfter = 5): boolean {
  const receipt = new Date(receiptDate);
  const transaction = new Date(transactionDate);

  const diffDays = (transaction.getTime() - receipt.getTime()) / (1000 * 60 * 60 * 24);

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
  const { headers: corsHeaders, preflight } = handleCors(req);
  if (preflight) return preflight;

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

    const { limited } = await new RateLimiter(serviceSupabase).check(user.id, "match-receipts", 20);
    if (limited) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Up to 20 match operations per hour." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const matches: Match[] = [];

    for (const receipt of pendingReceipts) {
      let bestMatch: Match | null = null;
      let bestConfidence = 0;

      for (const qbExpense of qbExpenses) {
        const receiptAmount = parseFloat(receipt.total_amount);
        const qbAmount = parseFloat(qbExpense.amount);

        if (Math.abs(receiptAmount - qbAmount) > 0.01) {
          continue;
        }

        const dateMatch = isDateInRange(receipt.purchase_date, qbExpense.date);
        if (!dateMatch) {
          continue;
        }

        const vendorScore = vendorSimilarity(receipt.vendor_name, qbExpense.vendor_name);
        const confidence = 0.6 + 0.3 + (vendorScore * 0.1);

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

      if (bestMatch && bestConfidence >= 0.85) {
        matches.push(bestMatch);

        await serviceSupabase
          .from("pending_receipts")
          .update({
            status: "matched",
            matched_qb_id: bestMatch.qb_id,
            matched_at: new Date().toISOString(),
            match_confidence: bestMatch.confidence,
          })
          .eq("id", receipt.id);
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

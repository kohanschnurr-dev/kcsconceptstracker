import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
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

    // Pool A: pending bank charges. Pool B: already-imported charges with no receipt yet.
    const [{ data: pendingQb, error: qbError }, { data: importedQb, error: impError }] = await Promise.all([
      supabase.from("quickbooks_expenses").select("*").eq("is_imported", false).is("project_id", null).eq("is_hidden", false),
      supabase.from("quickbooks_expenses").select("*").eq("is_imported", true).is("receipt_url", null).eq("is_hidden", false),
    ]);
    if (qbError || impError) {
      console.error("Error fetching QB expenses:", qbError || impError);
      throw new Error("Failed to fetch QuickBooks expenses");
    }

    // Charges already claimed by other matched receipts are off limits
    const { data: alreadyMatched } = await supabase
      .from("pending_receipts").select("matched_qb_id, matched_qb_ids").eq("status", "matched");
    const claimed = new Set<string>();
    for (const r of alreadyMatched || []) {
      if (r.matched_qb_id) claimed.add(r.matched_qb_id);
      for (const id of r.matched_qb_ids || []) claimed.add(id);
    }

    const pendingPool = (pendingQb || []).map((q: any) => ({ ...q, _existing: false }));
    // Imported charges split by category share a base qb_id ("<base>_split_<cat>"); treat each group as one bank charge
    const { data: withReceipt } = await supabase
      .from("quickbooks_expenses").select("qb_id").eq("is_imported", true).not("receipt_url", "is", null);
    const basesWithReceipt = new Set((withReceipt || []).map((q: any) => String(q.qb_id).split("_split_")[0]));
    const groups = new Map<string, any[]>();
    for (const q of importedQb || []) {
      const base = String(q.qb_id).split("_split_")[0];
      if (basesWithReceipt.has(base)) continue;
      if (!groups.has(base)) groups.set(base, []);
      groups.get(base)!.push(q);
    }
    const importedPool = [...groups.values()].map(rows => {
      const first = rows[0];
      const total = first.original_amount != null
        ? parseFloat(first.original_amount)
        : rows.reduce((s: number, r: any) => s + parseFloat(r.amount), 0);
      return { ...first, original_amount: total, _existing: true, _rowQbIds: rows.map((r: any) => r.qb_id) };
    });
    const idsOf = (q: any): string[] => q._rowQbIds || [q.qb_id];

    const matches: any[] = [];
    const cents = (v: any) => Math.round(parseFloat(v) * 100);
    const dayDiff = (a: string, b: string) => Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86400000;

    const saveMatch = async (receiptId: string, type: string, qbIds: string[], confidence: number) => {
      qbIds.forEach(id => claimed.add(id));
      matches.push({ receipt_id: receiptId, match_type: type, qb_ids: qbIds, confidence });
      await serviceSupabase.from("pending_receipts").update({
        status: "matched",
        matched_qb_id: qbIds[0],
        matched_qb_ids: qbIds,
        match_type: type,
        matched_at: new Date().toISOString(),
        match_confidence: confidence,
      }).eq("id", receiptId).eq("user_id", user.id);
    };

    for (const receipt of pendingReceipts) {
      const target = cents(receipt.total_amount);
      const inWindow = (q: any) => !idsOf(q).some(id => claimed.has(id)) && isDateInRange(receipt.purchase_date, q.date);

      // Pass 1: pending charge, exact amount (unchanged rules)
      let best: any = null; let bestScore = -1;
      for (const q of pendingPool) {
        if (!inWindow(q) || Math.abs(cents(q.amount) - target) > 1) continue;
        const v = vendorSimilarity(receipt.vendor_name, q.vendor_name);
        if (v > bestScore) { bestScore = v; best = q; }
      }
      if (best) { await saveMatch(receipt.id, "new", [best.qb_id], Math.round((0.9 + bestScore * 0.1) * 100)); continue; }

      // Pass 2: already-imported charge, exact amount, similar vendor, no receipt
      best = null; bestScore = -1;
      for (const q of importedPool) {
        if (!inWindow(q)) continue;
        const amt = cents(q.original_amount ?? q.amount);
        if (Math.abs(amt - target) > 1) continue;
        const v = vendorSimilarity(receipt.vendor_name, q.vendor_name);
        if (v < 0.5) continue;
        if (v > bestScore) { bestScore = v; best = q; }
      }
      if (best) { await saveMatch(receipt.id, "existing", idsOf(best), Math.round((0.9 + bestScore * 0.1) * 100)); continue; }

      // Pass 3: 2-5 charges from the same vendor summing to the receipt total
      const cands = [...pendingPool, ...importedPool]
        .filter(q => idsOf(q).length === 1 && inWindow(q) && vendorSimilarity(receipt.vendor_name, q.vendor_name) >= 0.5)
        .filter(q => cents(q.original_amount ?? q.amount) > 0 && cents(q.original_amount ?? q.amount) < target)
        .slice(0, 25);
      let bestCombo: any[] | null = null; let bestDist = Infinity;
      const pick: any[] = [];
      const search = (start: number, sum: number) => {
        if (pick.length >= 2 && Math.abs(sum - target) <= 1) {
          const dist = pick.reduce((s, q) => s + dayDiff(receipt.purchase_date, q.date), 0) / pick.length;
          if (dist < bestDist) { bestDist = dist; bestCombo = [...pick]; }
          return;
        }
        if (pick.length >= 5 || sum > target + 1) return;
        for (let i = start; i < cands.length; i++) {
          // Skip duplicate copies of the same bank charge (same amount + same date)
          if (pick.some(q => q.date === cands[i].date && cents(q.original_amount ?? q.amount) === cents(cands[i].original_amount ?? cands[i].amount))) continue;
          pick.push(cands[i]);
          search(i + 1, sum + cents(cands[i].original_amount ?? cands[i].amount));
          pick.pop();
        }
      };
      search(0, 0);
      if (bestCombo) {
        await saveMatch(receipt.id, "split", (bestCombo as any[]).map(q => q.qb_id), 90);
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

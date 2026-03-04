import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { getUserIdFromBearer } from "../_shared/auth.ts";
import { RateLimiter } from "../_shared/rateLimiter.ts";

const MAX_RECEIPT_TEXT_BYTES = 50_000; // 50 KB limit

serve(async (req) => {
  const { headers: corsHeaders, preflight } = handleCors(req);
  if (preflight) return preflight;

  try {
    const userId = getUserIdFromBearer(req.headers.get("Authorization"));
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { limited } = await new RateLimiter(
      createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
    ).check(userId, "parse-receipt-text", 30);
    if (limited) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Up to 30 receipts per hour." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { receiptText } = await req.json();

    if (!receiptText) {
      return new Response(
        JSON.stringify({ error: "Receipt text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof receiptText !== "string" || receiptText.length > MAX_RECEIPT_TEXT_BYTES) {
      return new Response(
        JSON.stringify({ error: "Receipt text is too large (max 50 KB)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const currentYear = new Date().getFullYear();

    const systemPrompt = `You are a construction-industry bookkeeper AI for a DFW real estate investor. Extract expense information from pasted receipt text with high accuracy.

═══════════════════════════════════════════════════════════════
EXTRACTION RULES
═══════════════════════════════════════════════════════════════

1. VENDOR: Extract the store or contractor name exactly as shown.
2. DATE: Convert any date format to YYYY-MM-DD. If the year is missing or outside ${currentYear - 1}–${currentYear}, use ${currentYear}.
3. AMOUNT: Use the FINAL TOTAL the customer paid (after tax, discounts). Look for "TOTAL", "AMOUNT DUE", "GRAND TOTAL".
4. TAX: Extract tax amount if listed separately.
5. DESCRIPTION: Summarize the main items purchased in a short phrase.
6. PAYMENT METHOD: Infer from text — look for "VISA", "MASTERCARD", "DEBIT", "CASH", "CHECK", etc. Default to "card".

═══════════════════════════════════════════════════════════════
CATEGORY MAPPING (use exact lowercase values)
═══════════════════════════════════════════════════════════════

Construction categories:
appliances, bathroom, brick_siding_stucco, cabinets, carpentry, cleaning,
final_punch, closing_costs, countertops, demolition, doors, drain_line_repair,
driveway_concrete, drywall, dumpsters_trash, electrical, fencing, flooring,
food, foundation_repair, framing, garage, hardware, hoa, hvac, insulation,
insurance_project, kitchen, landscaping, light_fixtures, main_bathroom, misc,
natural_gas, painting, permits, inspections, pest_control, plumbing, pool,
railing, roofing, staging, taxes, tile, utilities, variable, water_heater,
rehab_filler, wholesale_fee, windows

VENDOR → CATEGORY HINTS:
• Home Depot, Lowe's, Menards, Ace → look at items to pick category (plumbing, electrical, hardware, etc.)
• Floor & Decor → flooring or tile
• Ferguson, Hajoca → plumbing
• Sherwin-Williams, PPG, Benjamin Moore → painting
• ABC Supply → roofing
• Carrier, Trane, Lennox supplier → hvac
• If items are mixed across trades, pick the dominant one or use "misc"

═══════════════════════════════════════════════════════════════
EXPENSE TYPE
═══════════════════════════════════════════════════════════════

• Retail stores (Home Depot, Lowe's, Amazon, etc.) → "product"
• Contractor invoices, labor charges → "labor"
• If unclear, default to "product"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse this receipt text and extract all details:\n\n${receiptText}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_expense",
              description: "Extract expense data from receipt text",
              parameters: {
                type: "object",
                properties: {
                  vendor: { type: "string", description: "Store or vendor name" },
                  date: { type: "string", description: "Date in YYYY-MM-DD format" },
                  amount: { type: "number", description: "Final total amount paid (after tax)" },
                  description: { type: "string", description: "Brief description of items purchased" },
                  paymentMethod: {
                    type: "string",
                    enum: ["card", "cash", "check", "transfer"],
                    description: "Payment method used"
                  },
                  includesTax: { type: "boolean", description: "Whether tax is included in the total" },
                  taxAmount: { type: "number", description: "Tax amount if listed separately" },
                  suggested_category: {
                    type: "string",
                    enum: [
                      "appliances", "bathroom", "brick_siding_stucco", "cabinets", "carpentry",
                      "cleaning", "final_punch", "closing_costs", "countertops", "demolition",
                      "doors", "drain_line_repair", "driveway_concrete", "drywall", "dumpsters_trash",
                      "electrical", "fencing", "flooring", "food", "foundation_repair", "framing",
                      "garage", "hardware", "hoa", "hvac", "insulation", "insurance_project",
                      "kitchen", "landscaping", "light_fixtures", "main_bathroom", "misc",
                      "natural_gas", "painting", "permits", "inspections", "pest_control",
                      "plumbing", "pool", "railing", "roofing", "staging", "taxes", "tile",
                      "utilities", "variable", "water_heater", "rehab_filler", "wholesale_fee", "windows"
                    ],
                    description: "Best matching construction budget category"
                  },
                  expenseType: {
                    type: "string",
                    enum: ["product", "labor"],
                    description: "Whether this is a product purchase or labor charge"
                  }
                },
                required: ["vendor", "date", "amount", "description", "suggested_category", "expenseType"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_expense" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to parse receipt");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "extract_expense") {
      throw new Error("Failed to extract expense data");
    }

    const expenseData = JSON.parse(toolCall.function.arguments);

    // Date year correction
    if (expenseData.date) {
      const parsedYear = parseInt(expenseData.date.split('-')[0], 10);
      if (parsedYear < currentYear - 1 || parsedYear > currentYear) {
        const [_, month, day] = expenseData.date.split('-');
        expenseData.date = `${currentYear}-${month}-${day}`;
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: expenseData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error parsing receipt:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

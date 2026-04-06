import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_CATEGORIES = [
  "appliances","bathroom","brick_siding_stucco","cabinets","carpentry","cleaning",
  "final_punch","closing_costs","countertops","demolition","doors","drain_line_repair",
  "driveway_concrete","drywall","dumpsters_trash","electrical","fencing","flooring",
  "food","foundation_repair","framing","garage","hardware","hoa","hvac","insulation",
  "insurance_project","kitchen","landscaping","light_fixtures","main_bathroom","misc",
  "natural_gas","painting","permits","inspections","pest_control","plumbing","pool",
  "railing","roofing","staging","taxes","tile","utilities","variable","water_heater",
  "rehab_filler","wholesale_fee","windows",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawText } = await req.json();
    if (!rawText || typeof rawText !== "string") {
      return new Response(JSON.stringify({ error: "rawText is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a construction budget analyst. You receive raw budget data (CSV, TSV, or spreadsheet paste) from external sources like contractor bids, bank exports, or Excel files.

Your job is to clean, normalize, and map each line item to one of these exact category values:
${VALID_CATEGORIES.join(", ")}

Rules:
1. STRIP rows that are headers, subtotals, grand totals, summary lines, formula outputs, blank rows, or financial metrics (ROI, ARV, LTC, etc.)
2. NORMALIZE item names to short, clean labels (e.g. "Drywall Hang & Finish Labor" → "Drywall", "Rough-in Plumbing + Fixtures" → "Plumbing")
3. MERGE duplicates: if multiple rows map to the same category, SUM their amounts into one entry
4. MAP each item to the single best-fit category from the list above. Use "rehab_filler" (Contingency) only as a last resort for truly unmatchable items
5. CONFIDENCE: assign 0.0-1.0 confidence for each mapping. Use 0.9+ for obvious matches, 0.5-0.8 for reasonable guesses, below 0.5 for weak matches
6. Extract the dollar amount from each row — ignore quantities, unit prices, and $/sqft columns; use the total cost column
7. Skip any row with $0 or negligible amounts`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Clean and categorize this budget data:\n\n${rawText.slice(0, 8000)}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_cleaned_budget",
              description: "Return the cleaned and categorized budget line items",
              parameters: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Cleaned/normalized item name" },
                        amount: { type: "number", description: "Total dollar amount" },
                        category: { type: "string", enum: VALID_CATEGORIES, description: "Best-fit category" },
                        confidence: { type: "number", description: "Confidence 0.0-1.0" },
                      },
                      required: ["name", "amount", "category", "confidence"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["items"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_cleaned_budget" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    // Validate categories and filter
    const validItems = (parsed.items || [])
      .filter((item: any) => item.amount > 0 && VALID_CATEGORIES.includes(item.category))
      .map((item: any) => ({
        name: String(item.name).slice(0, 100),
        amount: Math.round(item.amount * 100) / 100,
        category: item.category,
        confidence: Math.min(1, Math.max(0, item.confidence || 0.5)),
      }));

    return new Response(JSON.stringify({ items: validItems }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("clean-budget-import error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

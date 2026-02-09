import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { receiptText } = await req.json();
    
    if (!receiptText) {
      return new Response(
        JSON.stringify({ error: "Receipt text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a receipt parser. Extract expense information from receipt text.
Return structured data with:
- vendor: Store/vendor name
- date: Date in YYYY-MM-DD format (use current year if not specified)
- amount: Total amount as a number (the final total paid)
- description: Brief description of items purchased
- paymentMethod: One of "card", "cash", "check", "transfer" (infer from receipt, default to "card")
- includesTax: Boolean indicating if tax was included in the total
- taxAmount: Tax amount as a number if available

Be precise with the amount - use the final total the customer paid.
For dates, convert any format to YYYY-MM-DD.
For descriptions, summarize the main items purchased.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse this receipt:\n\n${receiptText}` }
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
                  amount: { type: "number", description: "Total amount paid" },
                  description: { type: "string", description: "Brief description of items" },
                  paymentMethod: { 
                    type: "string", 
                    enum: ["card", "cash", "check", "transfer"],
                    description: "Payment method used" 
                  },
                  includesTax: { type: "boolean", description: "Whether tax is included" },
                  taxAmount: { type: "number", description: "Tax amount if available" }
                },
                required: ["vendor", "date", "amount", "description"],
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

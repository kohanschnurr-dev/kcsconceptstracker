import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface ReceiptData {
  vendor_name: string;
  total_amount: number;
  tax_amount: number;
  subtotal: number;
  purchase_date: string;
  line_items: {
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    suggested_category: string;
  }[];
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

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
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

    const { image_url, image_base64 } = await req.json();

    if (!image_url && !image_base64) {
      return new Response(JSON.stringify({ error: "Either image_url or image_base64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Parsing receipt with AI Vision...");

    // Build the image content for the AI
    const imageContent = image_base64 
      ? { type: "image_url", image_url: { url: image_base64 } }
      : { type: "image_url", image_url: { url: image_url } };

    // Use Lovable AI Vision to parse the receipt
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `You are a precise receipt parsing expert. Extract EVERY line item with ACCURATE quantities.

═══════════════════════════════════════════════════════
AMAZON RECEIPTS - SPECIAL HANDLING (READ CAREFULLY!)
═══════════════════════════════════════════════════════

Amazon has a UNIQUE format. The price shown is the LINE TOTAL, not unit price!

EXAMPLE 1:
  "Southwire 14/2 NM-B Wire 50ft"
  "  Qty: 3                    $89.97"
  
  → item_name: "Southwire 14/2 NM-B Wire 50ft"
  → quantity: 3
  → total_price: 89.97  (this is what's shown!)
  → unit_price: 29.99   (calculated: 89.97 ÷ 3)

EXAMPLE 2:
  "LED Light Bulb 4-pack  Qty: 2  $19.98"
  
  → quantity: 2
  → total_price: 19.98
  → unit_price: 9.99

KEY RULES FOR AMAZON:
1. Look for "Qty: X" - this is your quantity
2. The dollar amount near Qty is the LINE TOTAL
3. Calculate: unit_price = total_price ÷ quantity
4. Don't skip items - every product line needs extraction
5. Ignore "Sold by:" and "Gift options:" lines

═══════════════════════════════════════════════════════
GENERAL RULES (ALL RECEIPTS)
═══════════════════════════════════════════════════════

VENDOR NAME: Extract STORE name (Amazon, Home Depot, Lowe's) NOT buyer name

QUANTITY PATTERNS:
- "2 x $14.99" → qty=2, unit_price=14.99, total=29.98
- "Qty: 3  $45.00" → qty=3, total=45.00, unit=15.00
- No quantity shown → qty=1

MATH VALIDATION:
- Each item: total_price = quantity × unit_price
- All items: sum(total_price) ≈ subtotal
- Final: subtotal + tax ≈ total_amount

CATEGORIES:
plumbing, electrical, hvac, flooring, painting, cabinets, countertops, tile, lighting, hardware, appliances, windows, doors, roofing, framing, insulation, drywall, bathroom, carpentry, fencing, landscaping, misc`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Parse this receipt. Extract EVERY item with CORRECT quantities.

AMAZON RECEIPT CHECKLIST:
□ Found "Qty:" for each item? (Amazon always shows this)
□ Price next to Qty is the LINE TOTAL, not unit price
□ Calculated unit_price = line_total / quantity
□ Sum of all line totals matches subtotal?
□ Subtotal + tax matches order total?

IF MISMATCH: Re-scan the receipt for missed items or quantities!

Return JSON only (no markdown):
{
  "vendor_name": "Store Name",
  "total_amount": 671.60,
  "tax_amount": 51.17,
  "subtotal": 620.43,
  "purchase_date": "YYYY-MM-DD",
  "line_items": [
    {
      "item_name": "Item description",
      "quantity": 2,
      "unit_price": 14.99,
      "total_price": 29.98,
      "suggested_category": "hardware"
    }
  ]
}

VALIDATION:
- Did you check quantity for each item? Many are > 1!
- Does sum(total_price) = subtotal?
- Does subtotal + tax = total_amount?`
              },
              imageContent
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI processing failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("AI response received, parsing JSON...");

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    let receiptData: ReceiptData;
    try {
      receiptData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      throw new Error("Failed to parse receipt data from AI response");
    }

    // Validate and clean the data
    const cleanedData: ReceiptData = {
      vendor_name: receiptData.vendor_name || "Unknown Vendor",
      total_amount: parseFloat(String(receiptData.total_amount)) || 0,
      tax_amount: parseFloat(String(receiptData.tax_amount)) || 0,
      subtotal: parseFloat(String(receiptData.subtotal)) || 0,
      purchase_date: receiptData.purchase_date || new Date().toISOString().split('T')[0],
      line_items: Array.isArray(receiptData.line_items) 
        ? receiptData.line_items.map(item => ({
            item_name: item.item_name || "Unknown Item",
            quantity: parseFloat(String(item.quantity)) || 1,
            unit_price: parseFloat(String(item.unit_price)) || 0,
            total_price: parseFloat(String(item.total_price)) || 0,
            suggested_category: item.suggested_category || "misc",
          }))
        : [],
    };

    // If subtotal is 0 but we have a total and tax, calculate it
    if (cleanedData.subtotal === 0 && cleanedData.total_amount > 0) {
      cleanedData.subtotal = cleanedData.total_amount - cleanedData.tax_amount;
    }

    // Validation logging for debugging quantity parsing issues
    const lineItemsTotal = cleanedData.line_items.reduce((sum, item) => sum + item.total_price, 0);
    const expectedSubtotal = cleanedData.subtotal;
    const difference = Math.abs(lineItemsTotal - expectedSubtotal);

    if (difference > 0.10) {
      console.warn(`VALIDATION WARNING: Line items total ($${lineItemsTotal.toFixed(2)}) differs from subtotal ($${expectedSubtotal.toFixed(2)}) by $${difference.toFixed(2)}`);
    }

    console.log(`Parsed receipt: ${cleanedData.vendor_name}, $${cleanedData.total_amount}, ${cleanedData.line_items.length} items (line items sum: $${lineItemsTotal.toFixed(2)})`);

    return new Response(JSON.stringify({ 
      success: true, 
      data: cleanedData 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error parsing receipt:", error);
    const message = error instanceof Error ? error.message : "Failed to parse receipt";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

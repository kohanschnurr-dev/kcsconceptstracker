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
  discount_amount: number;
  purchase_date: string;
  line_items: {
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    discount: number;
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
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a precise receipt parsing expert. Extract EVERY line item with ACCURATE quantities and prices.

═══════════════════════════════════════════════════════
CRITICAL: DISCOUNT HANDLING (HOME DEPOT, LOWE'S, ETC.)
═══════════════════════════════════════════════════════

Many receipts have DISCOUNT columns. ALWAYS use the AFTER-DISCOUNT price!

HOME DEPOT RECEIPT COLUMNS:
| Item | Qty | Unit Price | Discount | Net Unit Price | Pre Tax Amount |
|------|-----|------------|----------|----------------|----------------|
| Board| 1   | $6.78      | $5.29    | $1.49          | $1.49          |

EXTRACTION RULES:
- unit_price = "Net Unit Price" or "Pre Tax Amount / Qty" (NOT the original "Unit Price")
- total_price = "Pre Tax Amount" column (the final price AFTER discount)
- discount = value from "Discount" column (per item, 0 if no discount)

If receipt shows:
  Subtotal: $102.98
  Discount: -$15.62 (or shown per-item)
  Tax: $8.50
  Total: $111.48

Then:
- subtotal = 102.98 (the discounted subtotal, NOT the pre-discount total)
- discount_amount = 15.62 (total of all discounts)
- tax_amount = 8.50
- total_amount = 111.48
- Sum of all line item total_price values MUST equal subtotal

═══════════════════════════════════════════════════════
AMAZON RECEIPT QUANTITY HANDLING
═══════════════════════════════════════════════════════

For EACH item on Amazon receipts:

STEP 1: Find the item name line
STEP 2: Look at the NEXT line for "X x $Y.YY" pattern
STEP 3: If found:
   - X = quantity (the number BEFORE "x")
   - $Y.YY = unit_price (the price AFTER "x")
   - Calculate: total_price = X × Y.YY
STEP 4: If NO "X x" pattern, set quantity = 1

EXAMPLE:
  "Bathroom Accessories Set"
  "2 x $30.00"
  → quantity: 2, unit_price: 30.00, total_price: 60.00

═══════════════════════════════════════════════════════
VALIDATION BEFORE RETURNING
═══════════════════════════════════════════════════════

1. For each item: total_price = quantity × unit_price
2. Sum of all total_price values should ≈ subtotal
3. subtotal + tax_amount should ≈ total_amount
4. If discounts exist, use NET prices not original prices!

CATEGORIES:
plumbing, electrical, hvac, flooring, painting, cabinets, countertops, tile, light_fixtures, hardware, appliances, windows, doors, roofing, framing, insulation, drywall, bathroom, carpentry, fencing, landscaping, misc`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Parse this receipt. Extract EVERY item with CORRECT quantities and NET prices (after any discounts).

DISCOUNT DETECTION CHECKLIST:
□ Does receipt have Discount column? Use Net Unit Price, NOT Unit Price!
□ Is there a total discount shown? Extract to discount_amount
□ Are line item prices the NET prices (after discount)?
□ Does sum of line item total_price = subtotal?
□ Does subtotal + tax = total_amount?

Return JSON only (no markdown):
{
  "vendor_name": "Store Name",
  "total_amount": 111.48,
  "tax_amount": 8.50,
  "subtotal": 102.98,
  "discount_amount": 15.62,
  "purchase_date": "YYYY-MM-DD",
  "line_items": [
    {
      "item_name": "Item description",
      "quantity": 1,
      "unit_price": 1.49,
      "total_price": 1.49,
      "discount": 5.29,
      "suggested_category": "hardware"
    }
  ]
}

CRITICAL VALIDATION:
- unit_price and total_price must be NET (after discount)
- discount field = per-item discount amount (0 if none)
- discount_amount = total of all discounts on receipt
- sum(total_price) MUST equal subtotal`
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
      discount_amount: parseFloat(String(receiptData.discount_amount)) || 0,
      purchase_date: receiptData.purchase_date || new Date().toISOString().split('T')[0],
      line_items: Array.isArray(receiptData.line_items) 
        ? receiptData.line_items.map(item => ({
            item_name: item.item_name || "Unknown Item",
            quantity: parseFloat(String(item.quantity)) || 1,
            unit_price: parseFloat(String(item.unit_price)) || 0,
            total_price: parseFloat(String(item.total_price)) || 0,
            discount: parseFloat(String(item.discount)) || 0,
            suggested_category: item.suggested_category || "misc",
          }))
        : [],
    };

    // Post-processing: Validate quantity calculations
    const validatedLineItems = cleanedData.line_items.map(item => {
      // If total_price equals unit_price but quantity > 1 was expected
      // This catches cases where AI mistakenly set qty=1
      const expectedTotal = item.quantity * item.unit_price;
      const tolerance = 0.01;
      
      // If the math doesn't add up, assume unit_price IS the total
      // and calculate the real unit price
      if (Math.abs(expectedTotal - item.total_price) > tolerance) {
        // total_price is correct, recalculate unit_price
        const correctedUnitPrice = item.quantity > 0 
          ? Math.round((item.total_price / item.quantity) * 100) / 100
          : item.total_price;
        
        return {
          ...item,
          unit_price: correctedUnitPrice,
        };
      }
      
      return item;
    });

    cleanedData.line_items = validatedLineItems;

    // If subtotal is 0 but we have a total and tax, calculate it
    if (cleanedData.subtotal === 0 && cleanedData.total_amount > 0) {
      cleanedData.subtotal = cleanedData.total_amount - cleanedData.tax_amount;
    }

    // Validation: Check if line items sum matches subtotal
    const lineItemsTotal = cleanedData.line_items.reduce((sum, item) => sum + item.total_price, 0);
    const expectedSubtotal = cleanedData.subtotal;
    const difference = Math.abs(lineItemsTotal - expectedSubtotal);

    // If difference matches discount_amount, the AI may have used pre-discount prices
    if (cleanedData.discount_amount > 0 && difference > 1 && Math.abs(difference - cleanedData.discount_amount) < 2) {
      console.warn(`AI may have used pre-discount prices. Line items: $${lineItemsTotal.toFixed(2)}, Subtotal: $${expectedSubtotal.toFixed(2)}, Discount: $${cleanedData.discount_amount.toFixed(2)}`);
      console.warn("Attempting to correct by scaling line items to match subtotal...");
      
      // Scale down line items proportionally to match the discounted subtotal
      const scaleFactor = expectedSubtotal / lineItemsTotal;
      cleanedData.line_items = cleanedData.line_items.map(item => ({
        ...item,
        unit_price: Math.round(item.unit_price * scaleFactor * 100) / 100,
        total_price: Math.round(item.total_price * scaleFactor * 100) / 100,
      }));
      
      const correctedTotal = cleanedData.line_items.reduce((sum, item) => sum + item.total_price, 0);
      console.log(`Corrected line items total: $${correctedTotal.toFixed(2)}`);
    } else if (difference > 0.10) {
      console.warn(`VALIDATION WARNING: Line items total ($${lineItemsTotal.toFixed(2)}) differs from subtotal ($${expectedSubtotal.toFixed(2)}) by $${difference.toFixed(2)}`);
    }

    console.log(`Parsed receipt: ${cleanedData.vendor_name}, $${cleanedData.total_amount}, ${cleanedData.line_items.length} items, discount: $${cleanedData.discount_amount.toFixed(2)}`);

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

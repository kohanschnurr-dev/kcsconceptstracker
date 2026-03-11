import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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

    const imageContent = image_base64
      ? { type: "image_url", image_url: { url: image_base64 } }
      : { type: "image_url", image_url: { url: image_url } };

    // Single-pass receipt parsing with a clear, focused prompt
    const requestBody = JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Parse this receipt image. Extract every purchased item with its FINAL PRICE (the price the customer actually paid AFTER all discounts, coupons, markdowns, and promotions have been applied).

CRITICAL RULES:
1. First find the SUBTOTAL on the receipt. This is your target — the sum of all item prices MUST equal the subtotal.
2. For each item, use the FINAL/NET price. If an item shows a price and then a discount below it (like "Pro Xtra Preferred Pricing -$2.24" or "MKDN -$5.00"), subtract the discount. Report only the net price.
3. Do NOT include discount lines, coupon lines, or "Pro Xtra" lines as separate items.
4. Do NOT include tax, subtotal, or total as line items.
5. "MAX REFUND VALUE" lines are NOT prices — ignore them.
6. For multi-quantity items (e.g. "3@4.48  13.44"), use quantity=3, unit_price=4.48, total_price=13.44. If there's a discount after it, subtract from total_price and recalculate unit_price.

VALIDATION: After extracting all items, verify that sum(total_price) ≈ subtotal (within $1). If not, you likely missed a discount — go back and fix it.

Return ONLY valid JSON (no markdown):
{
  "vendor_name": "STORE NAME",
  "total_amount": 152.16,
  "tax_amount": 11.60,
  "subtotal": 140.56,
  "purchase_date": "2026-02-28",
  "line_items": [
    {
      "item_name": "ITEM DESCRIPTION",
      "quantity": 1,
      "unit_price": 10.99,
      "total_price": 10.99,
      "suggested_category": "hardware"
    }
  ]
}

Categories: plumbing, electrical, hvac, flooring, painting, cabinets, countertops, tile, light_fixtures, hardware, appliances, windows, doors, roofing, framing, insulation, drywall, bathroom, carpentry, fencing, landscaping, garage, cleaning, misc`
            },
            imageContent
          ]
        }
      ],
    });

    let aiResponse: Response | null = null;
    let lastError: string | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: requestBody,
        });

        if (aiResponse.ok) break;

        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ success: false, error: "AI credits exhausted. Please add credits." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        lastError = await aiResponse.text();
        console.warn(`AI attempt ${attempt + 1} failed: ${aiResponse.status} ${lastError}`);
        aiResponse = null;
      } catch (fetchErr) {
        lastError = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        console.warn(`AI attempt ${attempt + 1} network error: ${lastError}`);
        aiResponse = null;
      }

      if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
    }

    if (!aiResponse || !aiResponse.ok) {
      console.error("All AI attempts failed:", lastError);
      return new Response(JSON.stringify({ success: false, error: "AI processing failed after 3 attempts" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ success: false, error: "No response from AI" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("AI response received, parsing JSON...");

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    let receiptData: any;
    try {
      receiptData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      return new Response(JSON.stringify({ success: false, error: "Failed to parse receipt data from AI response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate and clean the data
    const currentYear = new Date().getFullYear();
    let purchaseDate = receiptData.purchase_date || new Date().toISOString().split('T')[0];
    if (purchaseDate) {
      const parsedYear = parseInt(purchaseDate.split('-')[0], 10);
      if (parsedYear < currentYear - 1 || parsedYear > currentYear) {
        const parts = purchaseDate.split('-');
        purchaseDate = `${currentYear}-${parts[1]}-${parts[2]}`;
        console.log(`Corrected receipt year from ${parsedYear} to ${currentYear}`);
      }
    }

    const totalAmount = parseFloat(String(receiptData.total_amount)) || 0;
    const taxAmount = parseFloat(String(receiptData.tax_amount)) || 0;
    let subtotal = parseFloat(String(receiptData.subtotal)) || 0;
    if (subtotal === 0 && totalAmount > 0) {
      subtotal = totalAmount - taxAmount;
    }

    const lineItems = Array.isArray(receiptData.line_items)
      ? receiptData.line_items
          .filter((item: any) => {
            // Filter out discount/coupon lines the AI may have included
            const name = (item.item_name || "").toLowerCase();
            const isDiscount = /pro xtra|preferred pricing|coupon|discount|savings|mkdn|markdown|amt off/i.test(name);
            const isNegative = (parseFloat(String(item.total_price)) || 0) < 0;
            return !isDiscount && !isNegative;
          })
          .map((item: any) => ({
            item_name: item.item_name || "Unknown Item",
            quantity: parseFloat(String(item.quantity)) || 1,
            unit_price: parseFloat(String(item.unit_price)) || 0,
            total_price: parseFloat(String(item.total_price)) || 0,
            suggested_category: item.suggested_category || "misc",
          }))
      : [];

    // Validate unit_price × quantity ≈ total_price
    const cleanedLineItems = lineItems.map((item: any) => {
      const expectedTotal = item.quantity * item.unit_price;
      if (Math.abs(expectedTotal - item.total_price) > 0.02) {
        return {
          ...item,
          unit_price: item.quantity > 0
            ? Math.round((item.total_price / item.quantity) * 100) / 100
            : item.total_price,
        };
      }
      return item;
    });

    const lineItemsTotal = cleanedLineItems.reduce((sum: number, item: any) => sum + item.total_price, 0);

    console.log("=== Receipt Parse Summary ===");
    console.log(`Vendor: ${receiptData.vendor_name || "Unknown"}`);
    console.log(`Items: ${cleanedLineItems.length}, Total: $${lineItemsTotal.toFixed(2)}`);
    console.log(`Subtotal: $${subtotal.toFixed(2)}, Tax: $${taxAmount.toFixed(2)}, Grand Total: $${totalAmount.toFixed(2)}`);
    const diff = Math.abs(subtotal - lineItemsTotal);
    console.log(`Difference from subtotal: $${diff.toFixed(2)} (${subtotal > 0 ? ((diff/subtotal)*100).toFixed(1) : 0}%)`);
    console.log("============================");

    return new Response(JSON.stringify({
      success: true,
      data: {
        vendor_name: receiptData.vendor_name || "Unknown Vendor",
        total_amount: totalAmount,
        tax_amount: taxAmount,
        subtotal: subtotal,
        purchase_date: purchaseDate,
        line_items: cleanedLineItems,
      }
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

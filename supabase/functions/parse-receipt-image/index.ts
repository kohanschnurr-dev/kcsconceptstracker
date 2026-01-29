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
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a receipt parsing expert. Extract detailed information from receipts.

CRITICAL FOR VENDOR/STORE NAME:
- The vendor_name MUST be the actual RETAIL STORE where the purchase was made (e.g., "Home Depot", "Lowe's", "Menards", "Ace Hardware", "Amazon", "Walmart", etc.)
- Look for the store name/logo at the TOP of the receipt - this is usually the largest text or logo
- Common store indicators: store address, store number, phone number right below the store name
- DO NOT use the customer's name, company name, or any other entity that is NOT the store
- If you see "THE HOME DEPOT" or similar branding, use that as the vendor name
- Ignore any buyer/customer information that might appear on the receipt
            
For construction/renovation context, categorize items into these categories:
- plumbing, electrical, hvac, flooring, paint, cabinets, countertops, tile, lighting, hardware, appliances, windows, doors, roofing, framing, insulation, drywall, bathroom, trim, fencing, landscaping, misc

Be precise with numbers. Parse all line items you can identify.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Parse this receipt and extract:
1. Store/Vendor name - THIS IS THE RETAIL STORE NAME (like "Home Depot", "Lowe's", etc.) - look at the top/header of the receipt for the store branding/logo. Do NOT use the buyer's name or company.
2. Total amount (final price paid)
3. Tax amount (if shown)
4. Subtotal (before tax)
5. Purchase date
6. All individual line items with: item name, quantity, unit price, total price, and suggested category for construction/renovation

Return ONLY valid JSON in this exact format:
{
  "vendor_name": "Store Name",
  "total_amount": 123.45,
  "tax_amount": 10.20,
  "subtotal": 113.25,
  "purchase_date": "2025-01-15",
  "line_items": [
    {
      "item_name": "Item description",
      "quantity": 1,
      "unit_price": 50.00,
      "total_price": 50.00,
      "suggested_category": "electrical"
    }
  ]
}

If you cannot determine a value, use null. For dates, use YYYY-MM-DD format. If the date is unclear, use today's date.`
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

    console.log(`Parsed receipt: ${cleanedData.vendor_name}, $${cleanedData.total_amount}, ${cleanedData.line_items.length} items`);

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

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
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

    console.log("Parsing receipt with AI Vision (Gemini Pro)...");

    // Build the image content for the AI
    const imageContent = image_base64 
      ? { type: "image_url", image_url: { url: image_base64 } }
      : { type: "image_url", image_url: { url: image_url } };

    // Use Lovable AI Vision to parse the receipt with enhanced prompts
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
            content: `You are a receipt OCR specialist. Your job is to extract EVERY line item with EXACT prices.

═══════════════════════════════════════════════════════════════
HOME DEPOT / LOWE'S RECEIPT COLUMN LAYOUT
═══════════════════════════════════════════════════════════════

Home Depot receipts have 5-6 columns. USE THE RIGHTMOST PRICE COLUMN (before tax):

DESCRIPTION              QTY   UNIT    SAVE    NET EA    TOTAL
──────────────────────────────────────────────────────────────
2" PVC Coupling           2   $3.98           $1.99     $3.98
Electrical Tape 3pk       1   $5.47                     $5.47
──────────────────────────────────────────────────────────────

EXTRACTION RULES:
• quantity = QTY column (the small number, usually 1-10)
• total_price = RIGHTMOST dollar amount on the line (TOTAL or AMOUNT column)
• unit_price = total_price / quantity
• If SAVE column has a value, the item was discounted - total_price is already NET

COMMON MISTAKES TO AVOID:
✗ Do NOT use unit price column when a TOTAL column exists
✗ Do NOT confuse SKU numbers (like "042111" or "1-Gang") with prices
✗ Do NOT read pack sizes ("3pk", "10-ct") as quantities - those are part of the item name
✗ Hardware store items are almost NEVER under $0.50 - if you see $0.86, double-check!

═══════════════════════════════════════════════════════════════
AMAZON RECEIPT LAYOUT  
═══════════════════════════════════════════════════════════════

Look for "Qty: X" or "X x $Y.YY" patterns below item names.

═══════════════════════════════════════════════════════════════
VALIDATION CHECKLIST (VERIFY BEFORE RETURNING)
═══════════════════════════════════════════════════════════════

1. Sum of all line item total_price ≈ subtotal (within 5%)
2. Each item total_price >= $0.50 (flag if lower - likely wrong column)
3. total_price = quantity × unit_price (must be exact)
4. subtotal + tax ≈ total_amount

If validation fails, RE-READ the receipt and check column alignment.

═══════════════════════════════════════════════════════════════
CATEGORIES (use lowercase)
═══════════════════════════════════════════════════════════════
plumbing, electrical, hvac, flooring, painting, cabinets, countertops, 
tile, light_fixtures, hardware, appliances, windows, doors, roofing, 
framing, insulation, drywall, bathroom, carpentry, fencing, landscaping, 
garage, cleaning, misc`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract ALL items from this receipt. 

COLUMN DETECTION:
1. First, identify how many columns the receipt has
2. Find the RIGHTMOST price column (the line total)
3. Use THAT column for total_price, then calculate unit_price = total/qty

SANITY CHECK YOUR RESULTS:
• Hardware store items are rarely under $1.00
• If most items show < $2.00, you may be reading the wrong column
• Sum of total_price values should match the receipt subtotal

Return ONLY valid JSON (no markdown, no explanation):
{
  "vendor_name": "HOME DEPOT",
  "total_amount": 288.22,
  "tax_amount": 21.75,
  "subtotal": 266.47,
  "discount_amount": 0,
  "purchase_date": "2026-02-03",
  "line_items": [
    {
      "item_name": "2 in. PVC Coupling",
      "quantity": 2,
      "unit_price": 1.99,
      "total_price": 3.98,
      "discount": 0,
      "suggested_category": "plumbing"
    }
  ]
}`
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
    // Fix incorrect years - receipts shouldn't be from the future or too far in the past
    const currentYear = new Date().getFullYear();
    let purchaseDate = receiptData.purchase_date || new Date().toISOString().split('T')[0];
    
    // If date was parsed, validate the year
    if (purchaseDate) {
      const parsedYear = parseInt(purchaseDate.split('-')[0], 10);
      // If year is more than 1 year in the past or in the future, correct it to current year
      if (parsedYear < currentYear - 1 || parsedYear > currentYear) {
        const [_, month, day] = purchaseDate.split('-');
        purchaseDate = `${currentYear}-${month}-${day}`;
        console.log(`Corrected receipt year from ${parsedYear} to ${currentYear}: ${purchaseDate}`);
      }
    }
    
    const cleanedData: ReceiptData = {
      vendor_name: receiptData.vendor_name || "Unknown Vendor",
      total_amount: parseFloat(String(receiptData.total_amount)) || 0,
      tax_amount: parseFloat(String(receiptData.tax_amount)) || 0,
      subtotal: parseFloat(String(receiptData.subtotal)) || 0,
      discount_amount: parseFloat(String(receiptData.discount_amount)) || 0,
      purchase_date: purchaseDate,
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

    // Calculate totals for validation
    const lineItemsTotal = cleanedData.line_items.reduce((sum, item) => sum + item.total_price, 0);
    const expectedSubtotal = cleanedData.subtotal;
    const difference = expectedSubtotal - lineItemsTotal;
    const percentDiff = expectedSubtotal > 0 ? (difference / expectedSubtotal) * 100 : 0;

    // Flag items with suspiciously low prices (likely wrong column)
    const suspiciousItems = cleanedData.line_items.filter(item => 
      item.total_price > 0 && item.total_price < 0.50
    );

    if (suspiciousItems.length > 0) {
      const suspiciousRatio = suspiciousItems.length / cleanedData.line_items.length;
      if (suspiciousRatio > 0.3) {
        console.warn(`WARNING: ${suspiciousItems.length}/${cleanedData.line_items.length} items have total < $0.50. AI may be reading wrong column.`);
        console.warn("Suspicious items:", suspiciousItems.map(i => `${i.item_name}: $${i.total_price}`).join(', '));
      }
    }

    // Improved scaling logic
    if (lineItemsTotal > 0 && percentDiff > 50) {
      // If items sum to less than half the subtotal, something is very wrong
      console.error(`CRITICAL: Line items ($${lineItemsTotal.toFixed(2)}) are ${percentDiff.toFixed(0)}% less than subtotal ($${expectedSubtotal.toFixed(2)})`);
      console.error("Possible causes: wrong column read, missing items, or OCR failure");
      // Don't scale - the data is too unreliable, but still return what we have
    } else if (difference > 1 && percentDiff > 5 && percentDiff < 50) {
      // Proportional scaling for moderate discrepancies (likely discount column issue)
      console.warn(`Scaling items to match subtotal (${percentDiff.toFixed(1)}% difference)`);
      const scaleFactor = expectedSubtotal / lineItemsTotal;
      cleanedData.line_items = cleanedData.line_items.map(item => ({
        ...item,
        unit_price: Math.round(item.unit_price * scaleFactor * 100) / 100,
        total_price: Math.round(item.total_price * scaleFactor * 100) / 100,
      }));
    } else if (difference > 0.10) {
      console.warn(`Minor discrepancy: Line items total ($${lineItemsTotal.toFixed(2)}) differs from subtotal ($${expectedSubtotal.toFixed(2)}) by $${difference.toFixed(2)}`);
    }

    // Recalculate after potential scaling
    const finalLineItemsTotal = cleanedData.line_items.reduce((sum, item) => sum + item.total_price, 0);
    const finalDifference = expectedSubtotal - finalLineItemsTotal;

    // Detailed debug logging
    console.log("=== Receipt Parse Summary ===");
    console.log(`Vendor: ${cleanedData.vendor_name}`);
    console.log(`Date: ${cleanedData.purchase_date}`);
    console.log(`Items: ${cleanedData.line_items.length}`);
    console.log(`Line Items Total: $${finalLineItemsTotal.toFixed(2)}`);
    console.log(`Subtotal: $${cleanedData.subtotal.toFixed(2)}`);
    console.log(`Tax: $${cleanedData.tax_amount.toFixed(2)}`);
    console.log(`Total: $${cleanedData.total_amount.toFixed(2)}`);
    console.log(`Discount: $${cleanedData.discount_amount.toFixed(2)}`);
    console.log(`Final Difference: $${finalDifference.toFixed(2)}`);
    if (suspiciousItems.length > 0) {
      console.log(`Suspicious low-price items: ${suspiciousItems.length}`);
    }
    console.log("============================");

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

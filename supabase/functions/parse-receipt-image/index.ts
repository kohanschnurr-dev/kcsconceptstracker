import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { RateLimiter } from "../_shared/rateLimiter.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { limited } = await new RateLimiter(serviceSupabase).check(user.id, "parse-receipt-image", 20);
    if (limited) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Up to 20 receipt images per hour." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { image_url, image_base64 } = await req.json();

    if (!image_url && !image_base64) {
      return new Response(JSON.stringify({ error: "Either image_url or image_base64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the image content for the AI
    const imageContent = image_base64
      ? { type: "image_url", image_url: { url: image_base64 } }
      : { type: "image_url", image_url: { url: image_url } };

    const requestBody = JSON.stringify({
      model: "google/gemini-2.5-flash",
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
DISCOUNT / SAVINGS LINES (Pro Xtra, Instant Savings, Coupons)
═══════════════════════════════════════════════════════════════

- These lines appear BELOW the item they apply to (e.g., "PRO XTRA SAVINGS -$13.50")
- Do NOT create separate line items for discounts
- Instead, SUBTRACT the discount from the item ABOVE it:
  - Reduce that item's total_price by the discount amount
  - Recalculate unit_price = total_price / quantity
  - Set that item's "discount" field to the absolute discount value
- Example: Wire $89.97 followed by "PRO SAVINGS -$13.50" becomes:
  { "item_name": "ROMEX 12/2 NM Wire 250ft", "total_price": 76.47, "discount": 13.50, "unit_price": 76.47 }
- Sum all discounts into "discount_amount" at the top level too

═══════════════════════════════════════════════════════════════
CATEGORIES (use lowercase)
═══════════════════════════════════════════════════════════════
plumbing, electrical, hvac, flooring, painting, cabinets, countertops,
tile, light_fixtures, hardware, appliances, windows, doors, roofing,
framing, insulation, drywall, bathroom, carpentry, fencing, landscaping,
garage, cleaning, misc

═══════════════════════════════════════════════════════════════
EXPENSE TYPE DETECTION
═══════════════════════════════════════════════════════════════
Determine if this receipt is for PRODUCTS or LABOR:
- "product": Receipts from retail stores (Home Depot, Lowe's, Amazon, etc.) or for materials/supplies
- "labor": Receipts/invoices from contractors, subcontractors, service providers, or for work performed

Return this as "expense_type" in your JSON response.`
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
  "suggested_category": "plumbing",
  "expense_type": "product",
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
    });

    // Retry logic: up to 2 retries with 1s delay
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

        lastError = await aiResponse.text();
        console.warn(`AI attempt ${attempt + 1} failed: ${aiResponse.status}`);
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
      throw new Error(`AI processing failed after 3 attempts`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

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
      console.error("Failed to parse AI response as JSON");
      throw new Error("Failed to parse receipt data from AI response");
    }

    // Validate and clean the data
    const currentYear = new Date().getFullYear();
    let purchaseDate = receiptData.purchase_date || new Date().toISOString().split('T')[0];

    if (purchaseDate) {
      const parsedYear = parseInt(purchaseDate.split('-')[0], 10);
      if (parsedYear < currentYear - 1 || parsedYear > currentYear) {
        const [_, month, day] = purchaseDate.split('-');
        purchaseDate = `${currentYear}-${month}-${day}`;
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

    // Post-processing: Merge negative/discount lines into the item they follow
    const mergedItems: typeof cleanedData.line_items = [];
    let accumulatedDiscount = 0;

    for (let i = 0; i < cleanedData.line_items.length; i++) {
      const item = cleanedData.line_items[i];
      if (item.total_price < 0 || item.unit_price < 0) {
        const discountAmt = Math.abs(item.total_price);
        accumulatedDiscount += discountAmt;
        if (mergedItems.length > 0) {
          const prev = mergedItems[mergedItems.length - 1];
          prev.discount = Math.round((prev.discount + discountAmt) * 100) / 100;
          prev.total_price = Math.round((prev.total_price - discountAmt) * 100) / 100;
          prev.unit_price = prev.quantity > 0
            ? Math.round((prev.total_price / prev.quantity) * 100) / 100
            : prev.total_price;
        }
      } else {
        mergedItems.push({ ...item });
      }
    }

    cleanedData.line_items = mergedItems;
    cleanedData.discount_amount += Math.round(accumulatedDiscount * 100) / 100;

    // Post-processing: Validate quantity calculations
    const validatedLineItems = cleanedData.line_items.map(item => {
      const expectedTotal = item.quantity * item.unit_price;
      const tolerance = 0.01;

      if (Math.abs(expectedTotal - item.total_price) > tolerance) {
        const correctedUnitPrice = item.quantity > 0
          ? Math.round((item.total_price / item.quantity) * 100) / 100
          : item.total_price;

        return { ...item, unit_price: correctedUnitPrice };
      }

      return item;
    });

    cleanedData.line_items = validatedLineItems;

    if (cleanedData.subtotal === 0 && cleanedData.total_amount > 0) {
      cleanedData.subtotal = cleanedData.total_amount - cleanedData.tax_amount;
    }

    const lineItemsTotal = cleanedData.line_items.reduce((sum, item) => sum + item.total_price, 0);
    const expectedSubtotal = cleanedData.subtotal;
    const difference = expectedSubtotal - lineItemsTotal;
    const percentDiff = expectedSubtotal > 0 ? (difference / expectedSubtotal) * 100 : 0;

    const suspiciousItems = cleanedData.line_items.filter(item =>
      item.total_price > 0 && item.total_price < 0.50
    );

    if (lineItemsTotal > 0 && percentDiff > 50) {
      console.error(`CRITICAL: Line items sum is ${percentDiff.toFixed(0)}% less than subtotal`);
    } else if (difference > 1 && percentDiff > 5 && percentDiff < 50) {
      const scaleFactor = expectedSubtotal / lineItemsTotal;
      cleanedData.line_items = cleanedData.line_items.map(item => ({
        ...item,
        unit_price: Math.round(item.unit_price * scaleFactor * 100) / 100,
        total_price: Math.round(item.total_price * scaleFactor * 100) / 100,
      }));
    }

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

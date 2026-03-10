import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface LineItemData {
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount: number;
  original_price: number;
  suggested_category: string;
}

interface ReceiptData {
  vendor_name: string;
  total_amount: number;
  tax_amount: number;
  subtotal: number;
  discount_amount: number;
  purchase_date: string;
  parsing_confidence: 'high' | 'medium' | 'low';
  warnings: string[];
  line_items: LineItemData[];
}

const DISCOUNT_PATTERNS = [
  /pro\s*xtra/i,
  /preferred\s*pricing/i,
  /pro\s*savings/i,
  /instant\s*savings/i,
  /pro\s*paint/i,
  /mkdn|markdown/i,
  /amt\s*off/i,
  /coupon/i,
  /discount/i,
  /savings/i,
  /manager\s*markdown/i,
];

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

    console.log("Parsing receipt with AI Vision (Gemini Flash)...");

    // Build the image content for the AI
    const imageContent = image_base64 
      ? { type: "image_url", image_url: { url: image_base64 } }
      : { type: "image_url", image_url: { url: image_url } };

    // === PASS 1: Raw OCR text extraction ===
    const ocrRequestBody = JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract ALL text from this receipt image exactly as printed, preserving the original line-by-line layout. Include every line: items, prices, discounts, subtotals, tax, total, and any notes. Do NOT summarize or reformat. Return ONLY the raw text, no explanation."
            },
            imageContent
          ]
        }
      ],
    });

    let rawOcrText = "";
    try {
      const ocrResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: ocrRequestBody,
      });
      if (ocrResponse.ok) {
        const ocrData = await ocrResponse.json();
        rawOcrText = ocrData.choices?.[0]?.message?.content || "";
        console.log(`OCR pre-extraction: ${rawOcrText.length} chars extracted`);
      }
    } catch (ocrErr) {
      console.warn("OCR pre-extraction failed, proceeding with image-only parse:", ocrErr);
    }

    // === PASS 2: Structured receipt parsing with image + OCR text ===
    const ocrContext = rawOcrText
      ? `\n\nHere is the raw OCR text extracted from the receipt for cross-reference:\n---\n${rawOcrText}\n---\nUse this text to verify your line items and prices against the image.`
      : "";

    const requestBody = JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are a receipt OCR specialist. Extract EVERY line item with EXACT NET (after-discount) prices.

═══════════════════════════════════════════════════════════════
HOME DEPOT / LOWE'S RECEIPT FORMAT
═══════════════════════════════════════════════════════════════

Home Depot receipts show items with the RIGHTMOST dollar amount as the line total.
Format is typically: SKU DESCRIPTION <A>    PRICE

For multi-quantity items the format is:
  QTY@UNIT_PRICE                     TOTAL_PRICE
Example:
  3@4.48                             13.44
  → quantity=3, total_price=13.44, unit_price=4.48

EXTRACTION RULES:
• total_price = RIGHTMOST dollar amount on the product line
• If a QTY@PRICE pattern exists, quantity = that number, unit_price = that price
• Otherwise quantity = 1 and unit_price = total_price
• "MAX REFUND VALUE" lines are informational ONLY — NEVER use as prices

═══════════════════════════════════════════════════════════════
CRITICAL: HOME DEPOT PRO XTRA PREFERRED PRICING DISCOUNTS
═══════════════════════════════════════════════════════════════

Home Depot Pro accounts have discounts that appear in MULTIPLE formats.
You MUST detect ALL of them and subtract from the item ABOVE:

FORMAT 1 — Inline discount on same line:
  Pro Xtra Preferred Pricing    -1.35
  → Subtract $1.35 from the item directly above

FORMAT 2 — Section header then discount:
  -------Pro Xtra Preferred Pricing------
  (next line with a negative amount)        -0.99
  → Subtract $0.99 from the nearest product item above

FORMAT 3 — "Pro Paint" section discount (lump sum for paint items):
  ---------------Pro Paint----------------
  77.96 Pro Paint                -15.59
  → Subtract $15.59 from the paint item above (the one totaling 77.96)
  MUST RETURN ALL ITEMS FOR A FULL REFUND — this is informational, NOT an item

FORMAT 4 — Markdowns and clearance:
  RSN: 4    AMT OFF   MKDN      -10.00
  → Subtract $10.00 from the item directly above

FORMAT 5 — Coupon / instant savings:
  COUPON                        -5.00
  Instant Savings               -3.00
  → Subtract from the item directly above

FOR EACH DISCOUNTED ITEM:
1. Start with the original total_price from the product line
2. Subtract ALL discount lines that follow it (before the next product)
3. Set total_price = original - all discounts
4. Set original_price = the original amount before discounts
5. Set discount = sum of all discount amounts applied
6. Recalculate unit_price = total_price / quantity

EXAMPLE (real Home Depot receipt):
  045242348152 1/2"MCTBCTR <A>     15.97      ← product line
  MAX REFUND VALUE $13.73                      ← IGNORE this line
  Pro Xtra Preferred Pricing    -2.24          ← discount

  Result: { "item_name": "1/2\" MINI COPPER TUBING CUTTER",
            "total_price": 13.73, "original_price": 15.97,
            "discount": 2.24, "quantity": 1, "unit_price": 13.73 }

EXAMPLE with multi-quantity + discount:
  039645110164 60# CONCRETE <A>
  3@4.48                          13.44        ← 3 units at $4.48 each
  MAX REFUND VALUE $12.09/3
  Pro Xtra Preferred Pricing    -1.35          ← discount

  Result: { "item_name": "60LB QUIKRETE CONCRETE MIX",
            "total_price": 12.09, "original_price": 13.44,
            "discount": 1.35, "quantity": 3, "unit_price": 4.03 }

═══════════════════════════════════════════════════════════════
AMAZON RECEIPT LAYOUT
═══════════════════════════════════════════════════════════════

Look for "Qty: X" or "X x $Y.YY" patterns below item names.

═══════════════════════════════════════════════════════════════
FINAL VALIDATION (YOU MUST DO THIS)
═══════════════════════════════════════════════════════════════

1. Sum of all line item total_price MUST be within 2% of the receipt SUBTOTAL
   - If it is NOT, you likely missed discount lines — go back and re-read
2. Each item total_price >= $0.50 (hardware items are rarely cheaper)
3. total_price = quantity × unit_price (must be exact after rounding)
4. subtotal + tax ≈ total_amount
5. discount_amount = sum of all item discount fields

If validation #1 fails, the most common cause is missing Pro Xtra discounts.
Re-scan the receipt for any "Preferred Pricing", "Pro Paint", "MKDN", or negative amounts.

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
- "product": Retail stores (Home Depot, Lowe's, Amazon) or materials/supplies
- "labor": Contractors, subcontractors, service providers, or work performed`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract ALL items from this receipt with NET (after-discount) prices.${ocrContext}

STEP-BY-STEP:
1. Read the SUBTOTAL and TOTAL from the receipt first — these are your anchors
2. Read each product line (has a price on the right side)
3. For EACH product, check if discount lines follow it (Pro Xtra, MKDN, etc.)
4. If yes: subtract the discount to get NET total_price, record original_price and discount
5. After extracting all items, verify: sum of total_price ≈ subtotal
6. If sum is too high, you MISSED discounts — re-read the receipt

Return ONLY valid JSON (no markdown, no explanation):
{
  "vendor_name": "HOME DEPOT",
  "total_amount": 91.92,
  "tax_amount": 7.01,
  "subtotal": 84.91,
  "discount_amount": 12.51,
  "purchase_date": "2026-01-12",
  "suggested_category": "hardware",
  "expense_type": "product",
  "line_items": [
    {
      "item_name": "5GAL HOMER BUCKET",
      "quantity": 1,
      "unit_price": 3.98,
      "total_price": 3.98,
      "original_price": 3.98,
      "discount": 0,
      "suggested_category": "hardware"
    },
    {
      "item_name": "60LB QUIKRETE CONCRETE MIX",
      "quantity": 3,
      "unit_price": 4.03,
      "total_price": 12.09,
      "original_price": 13.44,
      "discount": 1.35,
      "suggested_category": "hardware"
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

        // Don't retry on 402 (payment) or 429 (rate limit) - surface immediately
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
      throw new Error(`AI processing failed after 3 attempts`);
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
      parsing_confidence: 'high',
      warnings: [],
      line_items: Array.isArray(receiptData.line_items)
        ? receiptData.line_items.map(item => ({
            item_name: item.item_name || "Unknown Item",
            quantity: parseFloat(String(item.quantity)) || 1,
            unit_price: parseFloat(String(item.unit_price)) || 0,
            total_price: parseFloat(String(item.total_price)) || 0,
            original_price: parseFloat(String((item as any).original_price)) || parseFloat(String(item.total_price)) || 0,
            discount: parseFloat(String(item.discount)) || 0,
            suggested_category: item.suggested_category || "misc",
          }))
        : [],
    };

    // Helper: check if item name looks like a discount line
    const isDiscountName = (name: string): boolean => {
      return DISCOUNT_PATTERNS.some(pattern => pattern.test(name));
    };

    // Post-processing: Two-pass discount merge
    // Pass 1: Merge items with negative prices into preceding item
    // Pass 2: Merge items whose name matches discount patterns (even if AI gave positive price)
    const mergedItems: typeof cleanedData.line_items = [];
    let accumulatedDiscount = 0;

    for (let i = 0; i < cleanedData.line_items.length; i++) {
      const item = cleanedData.line_items[i];
      const isNegativePrice = item.total_price < 0 || item.unit_price < 0;
      const isDiscountByName = isDiscountName(item.item_name) && !isNegativePrice;

      if (isNegativePrice) {
        // Standard negative-price discount line
        const discountAmt = Math.abs(item.total_price);
        accumulatedDiscount += discountAmt;
        if (mergedItems.length > 0) {
          const prev = mergedItems[mergedItems.length - 1];
          if (prev.original_price === prev.total_price) {
            prev.original_price = prev.total_price;
          }
          prev.discount = Math.round((prev.discount + discountAmt) * 100) / 100;
          prev.total_price = Math.round((prev.total_price - discountAmt) * 100) / 100;
          prev.unit_price = prev.quantity > 0
            ? Math.round((prev.total_price / prev.quantity) * 100) / 100
            : prev.total_price;
        }
      } else if (isDiscountByName) {
        // AI returned a discount as a separate item with a positive price — negate and merge
        const discountAmt = Math.abs(item.total_price);
        accumulatedDiscount += discountAmt;
        if (mergedItems.length > 0) {
          const prev = mergedItems[mergedItems.length - 1];
          if (prev.original_price === prev.total_price) {
            prev.original_price = prev.total_price;
          }
          prev.discount = Math.round((prev.discount + discountAmt) * 100) / 100;
          prev.total_price = Math.round((prev.total_price - discountAmt) * 100) / 100;
          prev.unit_price = prev.quantity > 0
            ? Math.round((prev.total_price / prev.quantity) * 100) / 100
            : prev.total_price;
        }
        console.log(`Merged discount-named item "${item.item_name}" ($${discountAmt.toFixed(2)}) into preceding product`);
      } else {
        // Regular product item — set original_price if AI didn't provide it
        const pushed = { ...item };
        if (pushed.discount > 0 && pushed.original_price === pushed.total_price) {
          pushed.original_price = Math.round((pushed.total_price + pushed.discount) * 100) / 100;
        }
        mergedItems.push(pushed);
      }
    }

    cleanedData.line_items = mergedItems;
    cleanedData.discount_amount = Math.round(
      (cleanedData.discount_amount + accumulatedDiscount) * 100
    ) / 100;

    if (accumulatedDiscount > 0) {
      console.log(`Post-processing merged discount lines totaling -$${accumulatedDiscount.toFixed(2)}`);
    }

    // Ensure original_price is set on items that have discounts from the AI
    cleanedData.line_items = cleanedData.line_items.map(item => {
      if (item.discount > 0 && item.original_price <= item.total_price) {
        return {
          ...item,
          original_price: Math.round((item.total_price + item.discount) * 100) / 100,
        };
      }
      // If no discount, original_price = total_price
      if (item.discount === 0 && item.original_price === 0) {
        return { ...item, original_price: item.total_price };
      }
      return item;
    });

    // Post-processing: Validate quantity calculations
    cleanedData.line_items = cleanedData.line_items.map(item => {
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

    // If subtotal is 0 but we have a total and tax, calculate it
    if (cleanedData.subtotal === 0 && cleanedData.total_amount > 0) {
      cleanedData.subtotal = cleanedData.total_amount - cleanedData.tax_amount;
    }

    // Calculate totals for validation — NO server-side scaling (frontend handles it)
    const lineItemsTotal = cleanedData.line_items.reduce((sum, item) => sum + item.total_price, 0);
    const expectedSubtotal = cleanedData.subtotal;
    const difference = Math.abs(expectedSubtotal - lineItemsTotal);
    const percentDiff = expectedSubtotal > 0 ? (difference / expectedSubtotal) * 100 : 0;

    // Flag items with suspiciously low prices
    const suspiciousItems = cleanedData.line_items.filter(item =>
      item.total_price > 0 && item.total_price < 0.50
    );

    // Determine parsing confidence and warnings
    const warnings: string[] = [];

    if (suspiciousItems.length > 0) {
      const suspiciousRatio = suspiciousItems.length / cleanedData.line_items.length;
      if (suspiciousRatio > 0.3) {
        warnings.push(`${suspiciousItems.length} items have prices under $0.50 — possible wrong column read`);
      }
    }

    if (percentDiff > 10) {
      warnings.push(`Line items total ($${lineItemsTotal.toFixed(2)}) differs from subtotal ($${expectedSubtotal.toFixed(2)}) by ${percentDiff.toFixed(1)}% — likely missed discounts`);
    } else if (percentDiff > 2) {
      warnings.push(`Minor discrepancy: items total $${lineItemsTotal.toFixed(2)} vs subtotal $${expectedSubtotal.toFixed(2)}`);
    }

    if (lineItemsTotal > expectedSubtotal && expectedSubtotal > 0) {
      warnings.push(`Items total ($${lineItemsTotal.toFixed(2)}) exceeds subtotal ($${expectedSubtotal.toFixed(2)}) — discounts may not be fully applied`);
    }

    // Set confidence level
    if (percentDiff <= 2) {
      cleanedData.parsing_confidence = 'high';
    } else if (percentDiff <= 10) {
      cleanedData.parsing_confidence = 'medium';
    } else {
      cleanedData.parsing_confidence = 'low';
    }

    cleanedData.warnings = warnings;

    // Detailed debug logging
    console.log("=== Receipt Parse Summary ===");
    console.log(`Vendor: ${cleanedData.vendor_name}`);
    console.log(`Date: ${cleanedData.purchase_date}`);
    console.log(`Items: ${cleanedData.line_items.length}`);
    console.log(`Line Items Total: $${lineItemsTotal.toFixed(2)}`);
    console.log(`Subtotal: $${cleanedData.subtotal.toFixed(2)}`);
    console.log(`Tax: $${cleanedData.tax_amount.toFixed(2)}`);
    console.log(`Total: $${cleanedData.total_amount.toFixed(2)}`);
    console.log(`Discount: $${cleanedData.discount_amount.toFixed(2)}`);
    console.log(`Difference: $${difference.toFixed(2)} (${percentDiff.toFixed(1)}%)`);
    console.log(`Confidence: ${cleanedData.parsing_confidence}`);
    if (warnings.length > 0) console.log(`Warnings: ${warnings.join('; ')}`);
    console.log("============================");

    // === PASS 3: Subtotal-anchored re-prompt if confidence is low ===
    if (cleanedData.parsing_confidence === 'low' && expectedSubtotal > 0 && lineItemsTotal > expectedSubtotal * 1.05) {
      console.log("Low confidence detected — attempting re-parse with subtotal hint...");

      const retryBody = JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `I previously parsed this receipt and got line items totaling $${lineItemsTotal.toFixed(2)}, but the receipt SUBTOTAL is $${expectedSubtotal.toFixed(2)}.

The most likely cause is MISSED DISCOUNTS. Home Depot "Pro Xtra Preferred Pricing" lines appear as:
  -------Pro Xtra Preferred Pricing------
  (negative dollar amount)        -X.XX

Also look for "RSN: X  AMT OFF  MKDN  -X.XX" and "Pro Paint" section discounts.

Please re-read this receipt carefully. For EVERY item, check if a discount line follows it.
Return the SAME JSON format with NET prices (original price minus all discounts).

${rawOcrText ? `OCR text for reference:\n---\n${rawOcrText}\n---\n` : ""}
Return ONLY valid JSON with the same schema as before.`
              },
              imageContent
            ]
          }
        ],
      });

      try {
        const retryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: retryBody,
        });

        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          const retryContent = retryData.choices?.[0]?.message?.content;
          if (retryContent) {
            let retryJsonStr = retryContent;
            const retryJsonMatch = retryContent.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (retryJsonMatch) retryJsonStr = retryJsonMatch[1].trim();

            try {
              const retryParsed = JSON.parse(retryJsonStr);
              const retryItems: LineItemData[] = (retryParsed.line_items || []).map((item: any) => ({
                item_name: item.item_name || "Unknown Item",
                quantity: parseFloat(String(item.quantity)) || 1,
                unit_price: parseFloat(String(item.unit_price)) || 0,
                total_price: parseFloat(String(item.total_price)) || 0,
                original_price: parseFloat(String(item.original_price || item.total_price)) || 0,
                discount: parseFloat(String(item.discount)) || 0,
                suggested_category: item.suggested_category || "misc",
              }));

              const retryTotal = retryItems.reduce((s, i) => s + i.total_price, 0);
              const retryDiff = Math.abs(expectedSubtotal - retryTotal);
              const retryPct = expectedSubtotal > 0 ? (retryDiff / expectedSubtotal) * 100 : 0;

              console.log(`Re-parse result: $${retryTotal.toFixed(2)} total, ${retryPct.toFixed(1)}% off subtotal (was ${percentDiff.toFixed(1)}%)`);

              // Accept re-parse if it's meaningfully closer to the subtotal
              if (retryPct < percentDiff * 0.7) {
                console.log("Re-parse improved results — using retry data");
                cleanedData.line_items = retryItems;
                cleanedData.discount_amount = parseFloat(String(retryParsed.discount_amount)) || 0;

                // Recalculate confidence
                if (retryPct <= 2) {
                  cleanedData.parsing_confidence = 'high';
                  cleanedData.warnings = [];
                } else if (retryPct <= 10) {
                  cleanedData.parsing_confidence = 'medium';
                  cleanedData.warnings = [`Re-parsed: items total $${retryTotal.toFixed(2)} vs subtotal $${expectedSubtotal.toFixed(2)}`];
                } else {
                  cleanedData.parsing_confidence = 'low';
                  cleanedData.warnings = [`Even after re-parse: items total $${retryTotal.toFixed(2)} vs subtotal $${expectedSubtotal.toFixed(2)}`];
                }
              } else {
                console.log("Re-parse did not improve results — keeping original");
              }
            } catch (retryParseErr) {
              console.warn("Re-parse JSON parse failed:", retryParseErr);
            }
          }
        }
      } catch (retryErr) {
        console.warn("Re-parse attempt failed:", retryErr);
      }
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

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_MODEL = "google/gemini-2.5-flash";

// Patterns that indicate a line is a discount, not a product
const DISCOUNT_PATTERNS = [
  /pro\s*xtra/i, /preferred\s*pricing/i, /pro\s*savings/i, /instant\s*savings/i,
  /pro\s*paint/i, /mkdn|markdown/i, /amt\s*off/i, /coupon/i, /discount/i,
  /savings/i, /manager\s*markdown/i,
];

function isDiscountLine(name: string): boolean {
  return DISCOUNT_PATTERNS.some(p => p.test(name));
}

async function callAI(apiKey: string, body: string): Promise<Response | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body,
      });
      if (resp.ok) return resp;
      if (resp.status === 429 || resp.status === 402) return resp; // caller handles
      console.warn(`AI attempt ${attempt + 1}: ${resp.status}`);
    } catch (err) {
      console.warn(`AI attempt ${attempt + 1} error:`, err);
    }
    if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { image_url, image_base64 } = await req.json();
    if (!image_url && !image_base64) {
      return new Response(JSON.stringify({ error: "Either image_url or image_base64 is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Parsing receipt...");

    // Always use base64 — download URL if needed
    let finalBase64 = image_base64;
    if (!finalBase64 && image_url) {
      console.log("Downloading image from URL...");
      try {
        const imgResp = await fetch(image_url);
        if (!imgResp.ok) throw new Error(`Download failed: ${imgResp.status}`);
        const imgBuffer = await imgResp.arrayBuffer();
        const ct = imgResp.headers.get("content-type") || "image/jpeg";
        const b64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
        finalBase64 = `data:${ct};base64,${b64}`;
      } catch (dlErr) {
        console.error("Image download failed:", dlErr);
        return new Response(JSON.stringify({ success: false, error: "Could not download receipt image." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const imageContent = { type: "image_url", image_url: { url: finalBase64 } };

    // ==========================================
    // PASS 1: Raw OCR text extraction
    // ==========================================
    console.log("Pass 1: OCR extraction...");
    const ocrBody = JSON.stringify({
      model: AI_MODEL,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Extract ALL text from this receipt image exactly as printed. Preserve the line-by-line layout. Include every line: item names, SKUs, prices, discounts, subtotals, tax, total. Return ONLY the raw text." },
          imageContent
        ]
      }],
    });

    let ocrText = "";
    const ocrResp = await callAI(LOVABLE_API_KEY, ocrBody);
    if (ocrResp?.ok) {
      const ocrData = await ocrResp.json();
      ocrText = ocrData.choices?.[0]?.message?.content || "";
      console.log(`OCR extracted ${ocrText.length} chars`);
    }

    // ==========================================
    // PASS 2: Structured extraction
    // AI just READS — returns every line including discounts
    // Our CODE does the math
    // ==========================================
    console.log("Pass 2: Structured extraction...");

    const ocrContext = ocrText
      ? `\n\nOCR text from the receipt (use to cross-reference):\n---\n${ocrText}\n---`
      : "";

    const parseBody = JSON.stringify({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a receipt reader. Your ONLY job is to read what's on the receipt and return it as structured data. Do NOT do math. Do NOT apply discounts. Just read each line.

RULES:
1. Return EVERY line that has a dollar amount — products, discounts, coupons, everything
2. Products have POSITIVE prices. Discount/coupon lines have NEGATIVE prices.
3. For discount lines (e.g. "Pro Xtra Preferred Pricing -$2.24"), return them as separate items with negative total_price
4. For multi-quantity lines like "3@4.48  13.44": quantity=3, unit_price=4.48, total_price=13.44
5. "MAX REFUND VALUE" lines are NOT items — skip them
6. Lines with just "SUBTOTAL", "TAX", "TOTAL" are NOT items — put those in the top-level fields
7. Use the RIGHTMOST dollar amount on each line as the price
8. Set is_discount=true for any discount/coupon/savings/markdown line
9. Set is_discount=false for regular product lines

CATEGORIES (for products only): plumbing, electrical, hvac, flooring, painting, cabinets, countertops, tile, light_fixtures, hardware, appliances, windows, doors, roofing, framing, insulation, drywall, bathroom, carpentry, fencing, landscaping, garage, cleaning, misc`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Read this receipt and return EVERY line with a price. Include discount lines as separate items with negative prices.${ocrContext}

Return ONLY valid JSON:
{
  "vendor_name": "STORE NAME",
  "total_amount": 152.16,
  "tax_amount": 11.60,
  "subtotal": 140.56,
  "purchase_date": "2026-02-28",
  "line_items": [
    { "item_name": "PRODUCT NAME", "quantity": 1, "unit_price": 15.97, "total_price": 15.97, "is_discount": false, "suggested_category": "hardware" },
    { "item_name": "Pro Xtra Preferred Pricing", "quantity": 1, "unit_price": -2.24, "total_price": -2.24, "is_discount": true, "suggested_category": "" }
  ]
}`
            },
            imageContent
          ]
        }
      ],
    });

    const parseResp = await callAI(LOVABLE_API_KEY, parseBody);
    if (!parseResp) {
      return new Response(JSON.stringify({ success: false, error: "AI failed after 3 attempts" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (parseResp.status === 429) {
      return new Response(JSON.stringify({ success: false, error: "Rate limited. Try again later." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (parseResp.status === 402) {
      return new Response(JSON.stringify({ success: false, error: "AI credits exhausted." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!parseResp.ok) {
      return new Response(JSON.stringify({ success: false, error: "AI request failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await parseResp.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(JSON.stringify({ success: false, error: "Empty AI response" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse JSON from AI response
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    let raw: any;
    try {
      raw = JSON.parse(jsonStr);
    } catch {
      console.error("JSON parse failed:", content.substring(0, 500));
      return new Response(JSON.stringify({ success: false, error: "Failed to parse AI response" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ==========================================
    // SERVER-SIDE: Apply discounts to products
    // The AI just read the lines. We do the math.
    // ==========================================
    console.log("Applying discounts server-side...");

    const rawItems: any[] = Array.isArray(raw.line_items) ? raw.line_items : [];

    // Separate products and discounts
    // A line is a discount if: is_discount=true, OR price is negative, OR name matches discount patterns
    const products: any[] = [];
    const orphanDiscounts: number[] = []; // discounts that couldn't be matched

    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i];
      const price = parseFloat(String(item.total_price)) || 0;
      const name = String(item.item_name || "");
      const flaggedDiscount = item.is_discount === true;
      const isNegative = price < 0;
      const nameIsDiscount = isDiscountLine(name);

      if (flaggedDiscount || isNegative || nameIsDiscount) {
        // This is a discount line — apply it to the nearest product ABOVE
        const discountAmt = Math.abs(price);
        if (discountAmt > 0 && products.length > 0) {
          const target = products[products.length - 1];
          target.discount = (target.discount || 0) + discountAmt;
          target.total_price = Math.round((target.total_price - discountAmt) * 100) / 100;
          target.unit_price = target.quantity > 0
            ? Math.round((target.total_price / target.quantity) * 100) / 100
            : target.total_price;
          console.log(`  Applied -$${discountAmt.toFixed(2)} "${name}" to "${target.item_name}" → $${target.total_price.toFixed(2)}`);
        } else if (discountAmt > 0) {
          orphanDiscounts.push(discountAmt);
          console.warn(`  Orphan discount: -$${discountAmt.toFixed(2)} "${name}" (no product above)`);
        }
      } else {
        // Regular product
        products.push({
          item_name: name || "Unknown Item",
          quantity: parseFloat(String(item.quantity)) || 1,
          unit_price: parseFloat(String(item.unit_price)) || 0,
          total_price: Math.abs(price), // ensure positive
          discount: 0,
          suggested_category: item.suggested_category || "misc",
        });
      }
    }

    // Fix unit_price consistency
    const finalItems = products.map(item => {
      const expected = Math.round(item.quantity * item.unit_price * 100) / 100;
      if (Math.abs(expected - item.total_price) > 0.02) {
        item.unit_price = item.quantity > 0
          ? Math.round((item.total_price / item.quantity) * 100) / 100
          : item.total_price;
      }
      return {
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        suggested_category: item.suggested_category,
      };
    });

    // Validate date
    const currentYear = new Date().getFullYear();
    let purchaseDate = raw.purchase_date || new Date().toISOString().split('T')[0];
    if (purchaseDate) {
      const y = parseInt(purchaseDate.split('-')[0], 10);
      if (y < currentYear - 1 || y > currentYear) {
        const parts = purchaseDate.split('-');
        purchaseDate = `${currentYear}-${parts[1]}-${parts[2]}`;
      }
    }

    const totalAmount = parseFloat(String(raw.total_amount)) || 0;
    const taxAmount = parseFloat(String(raw.tax_amount)) || 0;
    let subtotal = parseFloat(String(raw.subtotal)) || 0;
    if (subtotal === 0 && totalAmount > 0) subtotal = totalAmount - taxAmount;

    const itemsTotal = finalItems.reduce((s, i) => s + i.total_price, 0);
    const totalDiscount = products.reduce((s, i) => s + (i.discount || 0), 0);
    const diff = Math.abs(subtotal - itemsTotal);
    const pctDiff = subtotal > 0 ? (diff / subtotal) * 100 : 0;

    console.log("=== Parse Summary ===");
    console.log(`Vendor: ${raw.vendor_name || "?"}`);
    console.log(`Products: ${finalItems.length}, Discounts applied: $${totalDiscount.toFixed(2)}`);
    console.log(`Items total: $${itemsTotal.toFixed(2)} | Subtotal: $${subtotal.toFixed(2)} | Diff: ${pctDiff.toFixed(1)}%`);
    if (orphanDiscounts.length > 0) console.log(`Orphan discounts: ${orphanDiscounts.map(d => `$${d.toFixed(2)}`).join(', ')}`);
    console.log("=====================");

    return new Response(JSON.stringify({
      success: true,
      data: {
        vendor_name: raw.vendor_name || "Unknown Vendor",
        total_amount: totalAmount,
        tax_amount: taxAmount,
        subtotal,
        purchase_date: purchaseDate,
        line_items: finalItems,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error:", error);
    const msg = error instanceof Error ? error.message : "Failed to parse receipt";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

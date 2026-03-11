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
const AI_MODEL = "google/gemini-2.5-pro";

async function callAI(apiKey: string, body: string): Promise<Response | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body,
      });
      if (resp.ok) return resp;
      if (resp.status === 429 || resp.status === 402) return resp;
      console.warn(`AI attempt ${attempt + 1}: ${resp.status}`);
    } catch (err) {
      console.warn(`AI attempt ${attempt + 1} error:`, err);
    }
    if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
  }
  return null;
}

function jsonResp(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResp({ error: "Unauthorized" }, 401);

    if (!LOVABLE_API_KEY) return jsonResp({ error: "AI service not configured" }, 500);

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return jsonResp({ error: "Unauthorized" }, 401);

    const { image_url, image_base64 } = await req.json();
    if (!image_url && !image_base64) return jsonResp({ error: "image_url or image_base64 required" }, 400);

    // Always use base64
    let finalBase64 = image_base64;
    if (!finalBase64 && image_url) {
      try {
        const imgResp = await fetch(image_url);
        if (!imgResp.ok) throw new Error(`${imgResp.status}`);
        const buf = await imgResp.arrayBuffer();
        const ct = imgResp.headers.get("content-type") || "image/jpeg";
        finalBase64 = `data:${ct};base64,${btoa(String.fromCharCode(...new Uint8Array(buf)))}`;
      } catch (e) {
        return jsonResp({ success: false, error: "Could not download receipt image." }, 400);
      }
    }

    const imageContent = { type: "image_url", image_url: { url: finalBase64 } };

    // ==========================================
    // PASS 1: OCR
    // ==========================================
    console.log("Pass 1: OCR...");
    let ocrText = "";
    const ocrResp = await callAI(LOVABLE_API_KEY, JSON.stringify({
      model: AI_MODEL,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Extract ALL text from this receipt image exactly as printed, line by line. Include every line: items, SKUs, prices, discounts, subtotals, tax, total. Return ONLY the raw text." },
          imageContent
        ]
      }],
    }));
    if (ocrResp?.ok) {
      ocrText = (await ocrResp.json()).choices?.[0]?.message?.content || "";
      console.log(`OCR: ${ocrText.length} chars`);
    }

    // ==========================================
    // PASS 2: Structured extraction — NET prices
    // ==========================================
    console.log("Pass 2: Structure (net prices)...");
    const ocrRef = ocrText ? `\n\nOCR text for cross-reference:\n---\n${ocrText}\n---` : "";

    const parseResp = await callAI(LOVABLE_API_KEY, JSON.stringify({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a construction receipt parser. Return ONLY product lines — no discount lines as separate items.

CRITICAL RULES:
- For each product, return the FINAL NET price AFTER any discounts applied to that item.
- If a discount applies to a product (e.g. "Pro Xtra Preferred Pricing -$5.96" below an item), do NOT create a separate line for the discount. Instead:
  - Set total_price to the NET price (original minus discount)
  - Set discount to the positive discount amount
  - Set original_price to the price before discount
- If no discount applies, set discount to 0 and original_price equal to total_price.
- Multi-qty: "3@4.48 13.44" → quantity:3, unit_price:4.48, total_price:13.44 (then apply discounts to the total)
- Skip "MAX REFUND VALUE" lines entirely.
- SUBTOTAL/TAX/TOTAL go in top-level fields, NOT as line items.
- Use the RIGHTMOST dollar amount on each line as the price.
- Do NOT duplicate items. Each physical product = exactly one item.
- Categories: plumbing, electrical, hvac, flooring, painting, cabinets, countertops, tile, light_fixtures, hardware, appliances, windows, doors, roofing, framing, insulation, drywall, bathroom, carpentry, fencing, landscaping, garage, cleaning, misc

DISCOUNT RECOGNITION — these are discount lines, NOT products:
- Pro Xtra Preferred Pricing, Pro Xtra Savings, Instant Savings, Pro Savings
- Manager Markdown, MKDN, Amt Off, Coupon
- Any line with a negative dollar amount

EXAMPLE:
Receipt shows:
  GORILLA WOOD GLUE    $25.96
  Pro Xtra Preferred   -$5.96

You return ONE item:
  { "item_name": "GORILLA WOOD GLUE", "quantity": 1, "unit_price": 20.00, "total_price": 20.00, "discount": 5.96, "original_price": 25.96, "suggested_category": "hardware" }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Read this receipt. Return each product with its NET price after discounts. Do NOT return discount lines as separate items.${ocrRef}

Return ONLY valid JSON:
{
  "vendor_name": "STORE",
  "total_amount": 0,
  "tax_amount": 0,
  "subtotal": 0,
  "purchase_date": "YYYY-MM-DD",
  "line_items": [
    { "item_name": "NAME", "quantity": 1, "unit_price": 10.00, "total_price": 10.00, "discount": 0, "original_price": 10.00, "suggested_category": "hardware" }
  ]
}`
            },
            imageContent
          ]
        }
      ],
    }));

    if (!parseResp) return jsonResp({ success: false, error: "AI failed after 3 attempts" }, 502);
    if (parseResp.status === 429) return jsonResp({ success: false, error: "Rate limited." }, 429);
    if (parseResp.status === 402) return jsonResp({ success: false, error: "AI credits exhausted." }, 402);
    if (!parseResp.ok) return jsonResp({ success: false, error: "AI request failed" }, 502);

    const content = (await parseResp.json()).choices?.[0]?.message?.content;
    if (!content) return jsonResp({ success: false, error: "Empty AI response" }, 502);

    let jsonStr = content;
    const m = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) jsonStr = m[1].trim();

    let raw: any;
    try { raw = JSON.parse(jsonStr); }
    catch { return jsonResp({ success: false, error: "Failed to parse AI JSON" }, 502); }

    // ==========================================
    // SERVER-SIDE PROCESSING
    // 1. Filter valid products (no discount lines)
    // 2. Deduplicate
    // 3. Enforce subtotal (items MUST add up)
    // ==========================================
    const rawItems: any[] = Array.isArray(raw.line_items) ? raw.line_items : [];

    // Step 1: Collect products — skip any that slipped through as discounts
    const products: any[] = [];
    for (const item of rawItems) {
      const price = parseFloat(String(item.total_price)) || 0;
      if (price <= 0) continue; // skip negative/zero items (discount lines that leaked through)

      products.push({
        item_name: String(item.item_name || "Unknown Item"),
        quantity: parseFloat(String(item.quantity)) || 1,
        unit_price: parseFloat(String(item.unit_price)) || 0,
        total_price: Math.abs(price),
        discount: Math.abs(parseFloat(String(item.discount)) || 0),
        original_price: parseFloat(String(item.original_price)) || Math.abs(price),
        suggested_category: item.suggested_category || "misc",
      });
    }

    // Step 2: Deduplicate — if same item name appears multiple times, merge them
    const deduped = new Map<string, any>();
    for (const p of products) {
      const key = p.item_name.trim().toUpperCase();
      if (deduped.has(key)) {
        const existing = deduped.get(key);
        const priceDiff = Math.abs(existing.total_price / existing.quantity - p.total_price / p.quantity);
        if (priceDiff < 1.00) {
          if (p.total_price > existing.total_price) {
            deduped.set(key, p);
          }
          console.log(`  Dedup: removed duplicate "${p.item_name}" ($${p.total_price.toFixed(2)})`);
          continue;
        }
        deduped.set(key + `_${deduped.size}`, p);
      } else {
        deduped.set(key, p);
      }
    }
    const uniqueProducts = Array.from(deduped.values());

    // Step 3: Recalculate unit prices
    for (const item of uniqueProducts) {
      item.unit_price = item.quantity > 0
        ? Math.round((item.total_price / item.quantity) * 100) / 100
        : item.total_price;
    }

    // Get receipt totals
    const totalAmount = parseFloat(String(raw.total_amount)) || 0;
    const taxAmount = parseFloat(String(raw.tax_amount)) || 0;
    let subtotal = parseFloat(String(raw.subtotal)) || 0;
    if (subtotal === 0 && totalAmount > 0) subtotal = totalAmount - taxAmount;

    // Step 4: ENFORCE SUBTOTAL
    const itemsTotal = uniqueProducts.reduce((s, i) => s + i.total_price, 0);
    const diff = Math.abs(subtotal - itemsTotal);
    const pctDiff = subtotal > 0 ? (diff / subtotal) * 100 : 0;

    console.log(`Before enforcement: items=$${itemsTotal.toFixed(2)}, subtotal=$${subtotal.toFixed(2)}, diff=${pctDiff.toFixed(1)}%`);

    if (subtotal > 0 && pctDiff > 1 && uniqueProducts.length > 0) {
      const factor = subtotal / itemsTotal;
      console.log(`Enforcing subtotal: scaling by ${factor.toFixed(4)}`);

      let runningTotal = 0;
      for (let i = 0; i < uniqueProducts.length; i++) {
        const item = uniqueProducts[i];
        if (i === uniqueProducts.length - 1) {
          item.total_price = Math.round((subtotal - runningTotal) * 100) / 100;
        } else {
          item.total_price = Math.round(item.total_price * factor * 100) / 100;
        }
        runningTotal += item.total_price;
        item.unit_price = item.quantity > 0
          ? Math.round((item.total_price / item.quantity) * 100) / 100
          : item.total_price;
      }

      const finalTotal = uniqueProducts.reduce((s, i) => s + i.total_price, 0);
      console.log(`After enforcement: items=$${finalTotal.toFixed(2)} (should be $${subtotal.toFixed(2)})`);
    }

    // Build final line items
    const finalItems = uniqueProducts.map(p => ({
      item_name: p.item_name,
      quantity: p.quantity,
      unit_price: p.unit_price,
      total_price: p.total_price,
      discount: p.discount,
      original_price: p.original_price,
      suggested_category: p.suggested_category,
    }));

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

    console.log("=== Final Result ===");
    console.log(`${finalItems.length} items, subtotal=$${subtotal.toFixed(2)}, tax=$${taxAmount.toFixed(2)}, total=$${totalAmount.toFixed(2)}`);
    finalItems.forEach(i => console.log(`  ${i.item_name}: ${i.quantity}x $${i.unit_price} = $${i.total_price} [${i.suggested_category}]${i.discount > 0 ? ` (discount: -$${i.discount.toFixed(2)})` : ''}`));
    console.log("====================");

    return jsonResp({
      success: true,
      data: {
        vendor_name: raw.vendor_name || "Unknown Vendor",
        total_amount: totalAmount,
        tax_amount: taxAmount,
        subtotal,
        purchase_date: purchaseDate,
        line_items: finalItems,
      }
    });

  } catch (error: unknown) {
    console.error("Error:", error);
    return jsonResp({ success: false, error: error instanceof Error ? error.message : "Failed to parse receipt" }, 500);
  }
});

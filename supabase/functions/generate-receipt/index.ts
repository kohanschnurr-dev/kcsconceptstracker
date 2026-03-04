import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { getUserIdFromBearer } from "../_shared/auth.ts";
import { RateLimiter } from "../_shared/rateLimiter.ts";

serve(async (req) => {
  const { headers: corsHeaders, preflight } = handleCors(req);
  if (preflight) return preflight;

  try {
    const userId = getUserIdFromBearer(req.headers.get("Authorization"));
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { limited } = await new RateLimiter(
      createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
    ).check(userId, "generate-receipt", 30);
    if (limited) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Up to 30 documents per hour." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      vendorName,
      receiptDate,
      receiptNumber,
      projectName,
      descriptionOfWork,
      lineItems,
      total,
      paymentMethod,
      paymentDate,
      notes,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert contractor document writer. Your task is to write a professional payment receipt in plain text format.

Format the document with clear sections using ALL CAPS headers. Use this structure:

PAYMENT RECEIPT
[Receipt number and date]

FROM
[Vendor / company info]

FOR PROJECT
[Project name]

SERVICES PROVIDED
[Description of work and line items as a formatted list]

PAYMENT SUMMARY
[Line items with totals, then total amount paid]

PAYMENT DETAILS
[Payment method, date, and any notes]

Keep the language professional but concise. Output plain text only, no markdown.`;

    const fmt = (n: number) => `$${n.toFixed(2)}`;

    const lines: string[] = [];
    if (vendorName) lines.push(`Vendor / Company: ${vendorName}`);
    if (receiptNumber) lines.push(`Receipt Number: ${receiptNumber}`);
    if (receiptDate) lines.push(`Receipt Date: ${receiptDate}`);
    if (projectName) lines.push(`Project: ${projectName}`);
    if (descriptionOfWork) lines.push(`Description: ${descriptionOfWork}`);

    if (lineItems?.length) {
      const itemLines = lineItems
        .map((item: { description: string; qty: number; unitPrice: number; total: number }) =>
          `  - ${item.description || "Service"}: ${item.qty} x ${fmt(item.unitPrice)} = ${fmt(item.total)}`
        )
        .join("\n");
      lines.push(`Line Items:\n${itemLines}`);
    }

    lines.push(`Total Amount Paid: ${fmt(total || 0)}`);
    if (paymentMethod) lines.push(`Payment Method: ${paymentMethod}`);
    if (paymentDate) lines.push(`Payment Date: ${paymentDate}`);
    if (notes) lines.push(`Notes: ${notes}`);

    const userPrompt = `Please generate a professional payment receipt using the following details:\n\n${lines.join("\n")}`;

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Insufficient credits. Please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const receipt = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ receipt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-receipt error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

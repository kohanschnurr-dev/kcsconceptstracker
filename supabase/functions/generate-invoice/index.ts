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
    ).check(userId, "generate-invoice", 30);
    if (limited) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Up to 30 documents per hour." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      companyName,
      clientName,
      invoiceNumber,
      invoiceDate,
      dueDate,
      projectName,
      projectAddress,
      descriptionOfWork,
      lineItems,
      taxRate,
      subtotal,
      taxAmount,
      total,
      paymentMethod,
      paymentNotes,
      docLength,
      tone,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const toneMap: Record<string, string> = {
      simple: "Use plain, simple language. Short sentences. Easy to read.",
      standard: "Use clear, professional language appropriate for a contractor invoice.",
      professional: "Use formal, precise language suitable for business and legal review.",
    };

    const lengthMap: Record<string, string> = {
      brief: "Keep it concise — minimal headers, key info only.",
      standard: "Include all standard invoice sections with clear formatting.",
      detailed: "Include all sections with additional detail on each line item and payment instructions.",
    };

    const systemPrompt = `You are an expert contractor document writer. Your task is to write a professional contractor invoice in plain text format.

Tone: ${toneMap[tone] || toneMap.standard}
Length: ${lengthMap[docLength] || lengthMap.standard}

Format the document with clear sections using ALL CAPS headers. Use this structure:

INVOICE
[Invoice header — number, date, due date]

FROM
[Company/contractor info]

TO
[Client/property info]

PROJECT
[Project name and address]

DESCRIPTION OF WORK
[Overview of work performed]

LINE ITEMS
[Formatted table or list: Description | Qty | Unit Price | Total]

SUBTOTAL: [amount]
TAX ([rate]%): [amount]  (omit if no tax)
TOTAL DUE: [amount]

PAYMENT INFORMATION
[Payment method and instructions]

Do NOT add signature lines or legal boilerplate unless detailed tone is requested.
Output plain text only, no markdown.`;

    const fmt = (n: number) => `$${n.toFixed(2)}`;

    const lines: string[] = [];
    if (companyName) lines.push(`Company: ${companyName}`);
    if (clientName) lines.push(`Client: ${clientName}`);
    if (invoiceNumber) lines.push(`Invoice Number: ${invoiceNumber}`);
    if (invoiceDate) lines.push(`Invoice Date: ${invoiceDate}`);
    if (dueDate) lines.push(`Due Date: ${dueDate}`);
    if (projectName) lines.push(`Project: ${projectName}`);
    if (projectAddress) lines.push(`Project Address: ${projectAddress}`);
    if (descriptionOfWork) lines.push(`Description of Work: ${descriptionOfWork}`);

    if (lineItems?.length) {
      const itemLines = lineItems
        .map((item: { description: string; qty: number; unitPrice: number; total: number }) =>
          `  - ${item.description || "Service"}: ${item.qty} x ${fmt(item.unitPrice)} = ${fmt(item.total)}`
        )
        .join("\n");
      lines.push(`Line Items:\n${itemLines}`);
    }

    lines.push(`Subtotal: ${fmt(subtotal || 0)}`);
    if (taxRate) lines.push(`Tax Rate: ${taxRate}%`);
    if (taxAmount) lines.push(`Tax Amount: ${fmt(taxAmount)}`);
    lines.push(`Total Due: ${fmt(total || 0)}`);
    if (paymentMethod) lines.push(`Payment Method: ${paymentMethod}`);
    if (paymentNotes) lines.push(`Payment Notes: ${paymentNotes}`);

    const userPrompt = `Please generate a professional contractor invoice using the following details:\n\n${lines.join("\n")}`;

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
    const invoice = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ invoice }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-invoice error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

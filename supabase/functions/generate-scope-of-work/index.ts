import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      vendorName,
      companyName,
      customerName,
      date,
      jobNumber,
      tradeTypes,
      jobTitle,
      location,
      keyQuantities,
      workItems,
      alsoIncluded,
      exclusions,
      materialsResponsibility,
      specialNotes,
      scopeLength,
      tone,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const toneMap: Record<string, string> = {
      simple: "Use plain, simple language. Short sentences. Easy to read. Avoid construction jargon.",
      standard: "Use clear, professional language appropriate for a construction contract.",
      professional:
        "Use formal, legally precise language. Comprehensive, structured, and suitable for contract review.",
    };

    const lengthMap: Record<string, string> = {
      brief: "Keep it concise — 1–2 sentences per section. Total document should be under 300 words.",
      standard: "Write a thorough but readable document — approximately 300–600 words.",
      detailed:
        "Write a comprehensive, detailed scope — approximately 600–1000 words. Include specific procedures and standards where relevant.",
    };

    const systemPrompt = `You are an expert construction contract writer specializing in residential and commercial renovation projects.
Your task is to write a professional Scope of Work document based on the provided details.

Tone: ${toneMap[tone] || toneMap.standard}
Length: ${lengthMap[scopeLength] || lengthMap.standard}

Format the document with clear sections using ALL CAPS headers followed by the content. Use this structure:
SCOPE OF WORK
[Document header with company, vendor, date, job number if provided]

TRADE / TRADE TYPE
[Trades involved]

JOB TITLE
[Title]

LOCATION / AREA
[Where work will be performed]

WORK TO BE PERFORMED
[Detailed list of all work items — use numbered list]

ALSO INCLUDED
[Additional items included in scope]

NOT INCLUDED / EXCLUSIONS
[What is explicitly excluded]

MATERIALS
[Who is responsible for materials and how]

SPECIAL NOTES
[Any special instructions, access, scheduling, etc.]

Do NOT add any section that has no data. Do NOT add signature lines or payment terms — just the scope content.
Output plain text only, no markdown.`;

    const lines = [];
    if (companyName) lines.push(`Company: ${companyName}`);
    if (vendorName) lines.push(`Contractor / Vendor: ${vendorName}`);
    if (customerName) lines.push(`Customer / Property: ${customerName}`);
    if (date) lines.push(`Date: ${date}`);
    if (jobNumber) lines.push(`Job Number: ${jobNumber}`);
    if (tradeTypes?.length) lines.push(`Trade Types: ${tradeTypes.join(", ")}`);
    if (jobTitle) lines.push(`Job Title: ${jobTitle}`);
    if (location) lines.push(`Location / Area: ${location}`);
    if (keyQuantities) lines.push(`Key Quantities: ${keyQuantities}`);
    if (workItems) lines.push(`Work Items:\n${workItems}`);
    if (alsoIncluded) lines.push(`Also Included:\n${alsoIncluded}`);
    if (exclusions) lines.push(`Exclusions:\n${exclusions}`);
    if (materialsResponsibility) lines.push(`Materials Responsibility: ${materialsResponsibility}`);
    if (specialNotes) lines.push(`Special Notes: ${specialNotes}`);

    const userPrompt = `Please generate a Scope of Work document using the following details:\n\n${lines.join("\n")}`;

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
    const scope = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ scope }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-scope-of-work error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

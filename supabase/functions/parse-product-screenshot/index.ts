import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
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
    ).check(userId, "parse-product-screenshot", 20);
    if (limited) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Up to 20 screenshots per hour." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { image_base64 } = await req.json();

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an expert at extracting product information from retail website screenshots.
Extract the following details from the product page image:

1. Product name - Create a concise 3-5 word title. For standard items use "[Finish] [Category] [Type]" pattern. For tile, use "[Size] [Material] Tile" format.
2. Price - Extract the current/sale price. Just the number, no $ sign.
3. Model number / SKU - Look for "Model #", "SKU", "Item #"
4. Finish/Color - The color or finish of the product
5. Brand - The manufacturer name

Return ONLY valid JSON with this exact structure:
{
  "name": "string or null",
  "price": number or null,
  "model_number": "string or null",
  "finish": "string or null",
  "brand": "string or null"
}

If you cannot determine a value with confidence, use null.
Do NOT include any explanation - only the JSON object.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract product information from this retail website screenshot:"
              },
              {
                type: "image_url",
                image_url: {
                  url: image_base64.startsWith('data:') ? image_base64 : `data:image/png;base64,${image_base64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to analyze screenshot' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let productData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        productData = JSON.parse(jsonMatch[0]);
      } else {
        productData = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      return new Response(
        JSON.stringify({ error: 'Could not parse product data from screenshot' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Second AI call - extract product image
    let extractedImage: string | null = null;
    try {
      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract just the main product image from this retail website screenshot. Generate a clean, isolated image of the product on a plain white background. Focus only on the product itself, not the webpage elements, buttons, or text."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: image_base64.startsWith('data:') ? image_base64 : `data:image/png;base64,${image_base64}`
                  }
                }
              ]
            }
          ],
          modalities: ["image", "text"]
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        extractedImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
      } else {
        console.error("Image extraction failed with status:", imageResponse.status);
      }
    } catch (imageError) {
      console.error("Error extracting product image:", imageError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          name: productData.name || null,
          price: productData.price || null,
          model_number: productData.model_number || null,
          finish: productData.finish || null,
          brand: productData.brand || null,
          product_image: extractedImage,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error parsing product screenshot:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductData {
  name: string;
  price: number | null;
  model_number: string | null;
  finish: string | null;
  lead_time_days: number | null;
  dimensions: string | null;
  brand: string | null;
  tile_size: string | null;
  material: string | null;
  image_url: string | null;
  source_store: string;
  specs: Record<string, string>;
}

function detectStore(url: string): string {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('amazon.com')) return 'amazon';
  if (lowerUrl.includes('homedepot.com')) return 'home_depot';
  if (lowerUrl.includes('lowes.com')) return 'lowes';
  if (lowerUrl.includes('flooranddecor.com')) return 'floor_decor';
  if (lowerUrl.includes('build.com')) return 'build';
  if (lowerUrl.includes('ferguson.com')) return 'ferguson';
  return 'other';
}

function parsePrice(text: string | undefined | null): number | null {
  if (!text) return null;
  const match = text.match(/\$?([\d,]+\.?\d*)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ''));
  }
  return null;
}

function parseLeadTime(text: string): number | null {
  const lowerText = text.toLowerCase();
  
  // Look for "arrives by" or "delivery" patterns
  const deliveryMatch = lowerText.match(/(\d+)\s*(?:to|-)\s*(\d+)\s*(?:business\s+)?days?/i);
  if (deliveryMatch) {
    return parseInt(deliveryMatch[2]); // Return the higher estimate
  }
  
  const singleDayMatch = lowerText.match(/(\d+)\s*(?:business\s+)?days?/i);
  if (singleDayMatch) {
    return parseInt(singleDayMatch[1]);
  }
  
  // Check for "in stock" or immediate availability
  if (lowerText.includes('in stock') || lowerText.includes('available now')) {
    return 1;
  }
  
  return null;
}

function extractProductData(markdown: string, url: string): ProductData {
  const store = detectStore(url);
  const lines = markdown.split('\n');
  
  let name = '';
  let price: number | null = null;
  let model_number: string | null = null;
  let finish: string | null = null;
  let lead_time_days: number | null = null;
  let dimensions: string | null = null;
  let brand: string | null = null;
  let tile_size: string | null = null;
  let material: string | null = null;
  let image_url: string | null = null;
  const specs: Record<string, string> = {};
  
  // Extract name from first H1 or prominent text
  for (const line of lines) {
    if (line.startsWith('# ')) {
      name = line.replace('# ', '').trim();
      break;
    }
  }
  
  // If no H1, look for title patterns
  if (!name) {
    const titleMatch = markdown.match(/(?:^|\n)##?\s*([^\n]+)/);
    if (titleMatch) {
      name = titleMatch[1].trim();
    }
  }
  
  // Extract price
  const pricePatterns = [
    /\$\s*([\d,]+\.?\d*)/g,
    /price[:\s]+\$?([\d,]+\.?\d*)/gi,
    /(?:now|was|sale)[:\s]+\$?([\d,]+\.?\d*)/gi,
  ];
  
  for (const pattern of pricePatterns) {
    const matches = [...markdown.matchAll(pattern)];
    if (matches.length > 0) {
      price = parsePrice(matches[0][0]);
      if (price && price > 0.5 && price < 100000) break; // Sanity check
    }
  }
  
  // Extract model number
  const modelPatterns = [
    /model\s*#?\s*:?\s*([A-Z0-9\-]+)/gi,
    /sku\s*:?\s*([A-Z0-9\-]+)/gi,
    /item\s*#?\s*:?\s*([A-Z0-9\-]+)/gi,
    /(?:internet|store)\s*#?\s*:?\s*([0-9]+)/gi,
  ];
  
  for (const pattern of modelPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      model_number = match[1] || match[0].split(/[:# ]+/).pop()?.trim() || null;
      if (model_number) break;
    }
  }
  
  // Extract finish/color
  const finishPatterns = [
    /(?:color|finish)[:\s]+([^\n,]+)/gi,
    /(?:matte|satin|polished|brushed|chrome|nickel|bronze|brass|black|white|stainless)\s*(?:steel|finish)?/gi,
  ];
  
  for (const pattern of finishPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      finish = match[1]?.trim() || match[0].trim();
      if (finish) break;
    }
  }
  
  // Extract brand
  const brandPatterns = [
    /(?:by|brand)[:\s]+([A-Za-z][A-Za-z0-9\s&-]+)/gi,
    /(?:moen|delta|kohler|american standard|glacier bay|pfister|brizo|grohe|hansgrohe|schlage|kwikset|baldwin|emtek)/gi,
  ];
  
  for (const pattern of brandPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      brand = match[1]?.trim() || match[0].trim();
      if (brand) break;
    }
  }
  
  // Extract dimensions
  const dimPatterns = [
    /(?:dimensions?|size)[:\s]+([^\n]+)/gi,
    /(\d+(?:\.\d+)?)\s*(?:"|in|inch(?:es)?)\s*(?:x|by)\s*(\d+(?:\.\d+)?)\s*(?:"|in|inch(?:es)?)/gi,
  ];
  
  for (const pattern of dimPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      dimensions = match[1]?.trim() || match[0].trim();
      if (dimensions) break;
    }
  }

  // Extract tile size (e.g., 12x24, 4x12, 3x6)
  const tileSizePatterns = [
    /(?:tile\s*size|size)[:\s]*(\d+\s*(?:x|by)\s*\d+)/gi,
    /(\d{1,2})\s*(?:"|in\.?|inch(?:es)?)\s*(?:x|by)\s*(\d{1,2})\s*(?:"|in\.?|inch(?:es)?)/gi,
    /(\d{1,2}x\d{1,2})/gi,
  ];
  
  for (const pattern of tileSizePatterns) {
    const match = markdown.match(pattern);
    if (match) {
      tile_size = match[1]?.trim() || match[0].trim();
      // Clean up format
      tile_size = tile_size.replace(/\s+/g, '').replace(/by/gi, 'x');
      if (tile_size) break;
    }
  }

  // Extract material (ceramic, porcelain, natural stone, etc.)
  const materialPatterns = [
    /(?:material|type)[:\s]+([^\n,]+)/gi,
    /\b(porcelain|ceramic|natural\s*stone|marble|travertine|slate|granite|quartzite|limestone|glass|mosaic)\b/gi,
  ];
  
  for (const pattern of materialPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      material = match[1]?.trim() || match[0].trim();
      // Capitalize first letter
      material = material.charAt(0).toUpperCase() + material.slice(1).toLowerCase();
      if (material) break;
    }
  }

  // Also try to extract material from title/name
  if (!material && name) {
    const nameMaterialMatch = name.match(/\b(porcelain|ceramic|natural\s*stone|marble|travertine|slate|granite|quartzite|limestone|glass|mosaic)\b/gi);
    if (nameMaterialMatch) {
      material = nameMaterialMatch[0].trim();
      material = material.charAt(0).toUpperCase() + material.slice(1).toLowerCase();
    }
  }
  
  // Extract lead time / delivery for Dallas DFW area
  lead_time_days = parseLeadTime(markdown);
  
  // Look for specific Dallas/DFW delivery info
  const dfwMatch = markdown.match(/(?:dallas|dfw|75\d{3})[^.]*?(\d+)\s*(?:to|-)\s*(\d+)\s*days?/gi);
  if (dfwMatch) {
    const dayMatch = dfwMatch[0].match(/(\d+)\s*(?:to|-)\s*(\d+)/);
    if (dayMatch) {
      lead_time_days = parseInt(dayMatch[2]);
    }
  }
  
  // Extract product specs table
  const specPatterns = [
    /\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g,
    /([A-Za-z\s]+):\s*([^\n]+)/g,
  ];
  
  for (const pattern of specPatterns) {
    const matches = [...markdown.matchAll(pattern)];
    for (const match of matches.slice(0, 20)) { // Limit specs
      const key = match[1]?.trim().toLowerCase().replace(/\s+/g, '_');
      const value = match[2]?.trim();
      if (key && value && key.length < 50 && value.length < 200) {
        specs[key] = value;
      }
    }
  }

  // Add tile_size and material to specs if found
  if (tile_size) specs['tile_size'] = tile_size;
  if (material) specs['material'] = material;
  
  // Clean up name
  if (name.length > 200) {
    name = name.substring(0, 200);
  }
  
  return {
    name: name || 'Unknown Product',
    price,
    model_number,
    finish,
    lead_time_days,
    dimensions,
    brand,
    tile_size,
    material,
    image_url,
    source_store: store,
    specs,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Scraping service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping product URL:', formattedUrl);

    // Use Firecrawl to scrape the page
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000, // Wait for dynamic content
        location: {
          country: 'US',
          languages: ['en'],
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract markdown content
    const markdown = data.data?.markdown || data.markdown || '';
    
    if (!markdown) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not extract content from page' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse product data from markdown
    const productData = extractProductData(markdown, formattedUrl);

    console.log('Extracted product data:', productData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: productData,
        raw_markdown: markdown.substring(0, 2000), // Include partial markdown for debugging
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape product';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

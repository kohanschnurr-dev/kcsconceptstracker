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

function extractProductImage(html: string, url: string): string | null {
  const store = detectStore(url);
  
  // Amazon-specific image extraction
  if (store === 'amazon') {
    // Look for main product image patterns
    const amazonPatterns = [
      // Main product image
      /data-old-hires="([^"]+)"/i,
      /data-a-dynamic-image="\{&quot;([^&]+)&quot;/i,
      /"hiRes":"([^"]+)"/i,
      /"large":"([^"]+)"/i,
      /id="landingImage"[^>]+src="([^"]+)"/i,
      /id="imgBlkFront"[^>]+src="([^"]+)"/i,
      /class="a-dynamic-image[^"]*"[^>]+src="([^"]+)"/i,
    ];
    
    for (const pattern of amazonPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        let imgUrl = match[1].replace(/\\u002F/g, '/').replace(/\\/g, '');
        // Clean up Amazon image URL - get highest resolution
        imgUrl = imgUrl.replace(/\._[A-Z]{2}\d+_\./, '.');
        if (imgUrl.startsWith('http')) {
          return imgUrl;
        }
      }
    }
  }
  
  // Home Depot specific patterns
  if (store === 'home_depot') {
    const hdPatterns = [
      /data-src="(https:\/\/images\.homedepot[^"]+)"/i,
      /src="(https:\/\/images\.homedepot[^"]+)"/i,
      /"src":"(https:\/\/images\.homedepot[^"]+)"/i,
    ];
    
    for (const pattern of hdPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1].replace(/\\/g, '');
      }
    }
  }
  
  // Lowes specific patterns
  if (store === 'lowes') {
    const lowesPatterns = [
      /src="(https:\/\/mobileimages\.lowes[^"]+)"/i,
      /src="(https:\/\/images\.lowes[^"]+)"/i,
    ];
    
    for (const pattern of lowesPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1].replace(/\\/g, '');
      }
    }
  }
  
  // Generic og:image fallback
  const ogImageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) ||
                       html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
  if (ogImageMatch && ogImageMatch[1]) {
    return ogImageMatch[1];
  }
  
  // Generic product image patterns
  const genericPatterns = [
    /class="[^"]*product[^"]*image[^"]*"[^>]+src="([^"]+)"/i,
    /id="[^"]*product[^"]*image[^"]*"[^>]+src="([^"]+)"/i,
    /<img[^>]+alt="[^"]*product[^"]*"[^>]+src="([^"]+)"/i,
  ];
  
  for (const pattern of genericPatterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].startsWith('http')) {
      return match[1];
    }
  }
  
  return null;
}

function extractProductData(markdown: string, html: string, url: string): ProductData {
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
  
  // Extract product image from HTML
  image_url = extractProductImage(html, url);
  
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
  
  // Extract finish/color - clean extraction
  const colorPatterns = [
    /\b(white|black|gray|grey|beige|cream|ivory|tan|brown|espresso|charcoal|silver|gold|bronze|brass|nickel|chrome|copper|navy|blue|green|red|pink|yellow|orange|purple|taupe|sand|almond|bone|biscuit)\b/gi,
  ];
  
  for (const pattern of colorPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      finish = match[0].trim();
      // Capitalize first letter
      finish = finish.charAt(0).toUpperCase() + finish.slice(1).toLowerCase();
      break;
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
  
  // Extract dimensions - just numbers
  const dimPatterns = [
    /(\d+(?:\.\d+)?)\s*(?:"|in|inch(?:es)?)\s*(?:x|by)\s*(\d+(?:\.\d+)?)\s*(?:"|in|inch(?:es)?)/gi,
  ];
  
  for (const pattern of dimPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      dimensions = match[0].trim();
      break;
    }
  }

  // Extract tile size - just the numbers (e.g., "12x24")
  const tileSizePatterns = [
    /(\d{1,2})\s*x\s*(\d{1,2})/gi,
    /(\d{1,2})\s*(?:"|in\.?)\s*(?:x|by)\s*(\d{1,2})\s*(?:"|in\.?)/gi,
  ];
  
  for (const pattern of tileSizePatterns) {
    const match = markdown.match(pattern);
    if (match) {
      // Extract just the numbers
      const sizeMatch = match[0].match(/(\d{1,2})\s*(?:x|by|"|\s)+\s*(\d{1,2})/i);
      if (sizeMatch) {
        tile_size = `${sizeMatch[1]}x${sizeMatch[2]}`;
        break;
      }
    }
  }

  // Extract material - just the material type word
  const materialKeywords = ['porcelain', 'ceramic', 'marble', 'travertine', 'slate', 'granite', 'quartzite', 'limestone', 'glass', 'mosaic', 'natural stone', 'vinyl', 'laminate', 'hardwood', 'engineered'];
  
  const lowerMarkdown = markdown.toLowerCase();
  for (const mat of materialKeywords) {
    if (lowerMarkdown.includes(mat)) {
      // Capitalize properly
      material = mat.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
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

    // Use Firecrawl to scrape the page with screenshot
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'html'],
        onlyMainContent: false, // Need full HTML to extract product images
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

    // Extract markdown and HTML content
    const markdown = data.data?.markdown || data.markdown || '';
    const html = data.data?.html || data.html || '';
    
    if (!markdown && !html) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not extract content from page' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse product data from markdown and HTML
    const productData = extractProductData(markdown, html, formattedUrl);

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

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

// Detect product category from URL and content
function detectCategory(url: string, markdown: string): string {
  const lowerUrl = url.toLowerCase();
  const lowerContent = markdown.toLowerCase();
  
  // URL-based detection
  if (lowerUrl.includes('/bath') || lowerUrl.includes('bathroom')) return 'bathroom';
  if (lowerUrl.includes('/kitchen')) return 'kitchen';
  if (lowerUrl.includes('/lighting') || lowerUrl.includes('/light')) return 'lighting';
  if (lowerUrl.includes('/flooring') || lowerUrl.includes('/tile')) return 'tile';
  if (lowerUrl.includes('/plumbing')) return 'plumbing';
  if (lowerUrl.includes('/cabinet')) return 'cabinets';
  if (lowerUrl.includes('/door')) return 'doors';
  if (lowerUrl.includes('/window')) return 'windows';
  if (lowerUrl.includes('/hardware')) return 'hardware';
  if (lowerUrl.includes('/appliance')) return 'appliances';
  
  // Content-based detection
  if (lowerContent.includes('faucet') || lowerContent.includes('shower') || lowerContent.includes('toilet')) return 'bathroom';
  if (lowerContent.includes('tile') || lowerContent.includes('flooring')) return 'tile';
  if (lowerContent.includes('light') || lowerContent.includes('chandelier') || lowerContent.includes('pendant')) return 'lighting';
  if (lowerContent.includes('cabinet') || lowerContent.includes('vanity')) return 'cabinets';
  if (lowerContent.includes('mirror')) return 'bathroom';
  
  return 'general';
}

// Detect product type from content
function detectProductType(markdown: string, category: string): string | null {
  const lowerContent = markdown.toLowerCase();
  
  // Product type keywords by priority
  const productTypes: Record<string, string[]> = {
    bathroom: ['faucet', 'vanity', 'mirror', 'toilet', 'shower head', 'shower', 'sink', 'tub', 'bathtub'],
    kitchen: ['faucet', 'sink', 'range hood', 'garbage disposal'],
    plumbing: ['faucet', 'valve', 'drain', 'pipe', 'fixture', 'water heater'],
    tile: ['tile', 'flooring', 'backsplash'],
    lighting: ['chandelier', 'pendant', 'sconce', 'ceiling light', 'light fixture', 'lamp', 'light'],
    cabinets: ['cabinet', 'vanity', 'drawer', 'pantry'],
    doors: ['door', 'entry door', 'interior door', 'patio door'],
    windows: ['window', 'skylight'],
    hardware: ['handle', 'knob', 'lock', 'hinge', 'pull'],
    appliances: ['refrigerator', 'dishwasher', 'oven', 'range', 'microwave', 'washer', 'dryer'],
    general: ['faucet', 'light', 'tile', 'cabinet', 'mirror', 'fixture'],
  };
  
  const typesToCheck = productTypes[category] || productTypes.general;
  
  for (const type of typesToCheck) {
    if (lowerContent.includes(type)) {
      // Capitalize first letter
      return type.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }
  
  return null;
}

// Check if extracted name is garbage/unusable
function isGarbageName(name: string): boolean {
  if (!name || name.length < 5) return true;
  
  const lowerName = name.toLowerCase();
  
  // Common garbage phrases
  const garbagePhrases = [
    'product summary',
    'key product information',
    'keyboard shortcut',
    'skip to',
    'main content',
    'navigation',
    'search results',
    'add to cart',
    'buy now',
    'sign in',
    'customer review',
    'similar item',
    'frequently bought',
    'sponsored',
    'advertisement',
    'unknown product',
  ];
  
  for (const phrase of garbagePhrases) {
    if (lowerName.includes(phrase)) return true;
  }
  
  // Check if mostly navigation/accessibility text
  if (lowerName.includes('shift+') || lowerName.includes('alt+') || lowerName.includes('opt+')) {
    return true;
  }
  
  // Check if it's just a price or number
  if (/^\$?\d+\.?\d*$/.test(name.trim())) return true;
  
  // Check if too generic
  if (['item', 'product', 'home', 'page'].includes(lowerName.trim())) return true;
  
  return false;
}

// Extract product name from Amazon HTML
function extractAmazonProductName(html: string): string | null {
  // Primary: productTitle span
  const productTitleMatch = html.match(/<span[^>]+id="productTitle"[^>]*>([^<]+)<\/span>/i);
  if (productTitleMatch && productTitleMatch[1]) {
    const title = productTitleMatch[1].trim();
    if (!isGarbageName(title)) return title;
  }
  
  // Fallback: og:title meta tag
  const ogTitleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i) ||
                       html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i);
  if (ogTitleMatch && ogTitleMatch[1]) {
    const title = ogTitleMatch[1].trim();
    // Remove " - Amazon.com" suffix if present
    const cleanTitle = title.replace(/\s*[-–—]\s*Amazon\.com.*$/i, '').trim();
    if (!isGarbageName(cleanTitle)) return cleanTitle;
  }
  
  // Fallback: title tag
  const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleTagMatch && titleTagMatch[1]) {
    const title = titleTagMatch[1].trim();
    const cleanTitle = title.replace(/\s*[-–—]\s*Amazon\.com.*$/i, '').replace(/Amazon\.com:\s*/i, '').trim();
    if (!isGarbageName(cleanTitle) && cleanTitle.length > 10) return cleanTitle;
  }
  
  return null;
}

// Generate a concise 3-4 word product name from attributes
function generateCleanName(
  category: string,
  brand: string | null,
  finish: string | null,
  material: string | null,
  productType: string | null,
  tileSize: string | null
): string {
  // Category-based product type fallback
  const categoryDefaults: Record<string, string> = {
    bathroom: 'Fixture',
    kitchen: 'Fixture',
    plumbing: 'Fixture',
    tile: 'Tile',
    lighting: 'Light',
    cabinets: 'Cabinet',
    doors: 'Door',
    windows: 'Window',
    hardware: 'Hardware',
    appliances: 'Appliance',
    general: 'Item',
  };
  
  // Capitalize category for display
  const categoryDisplay = category.charAt(0).toUpperCase() + category.slice(1);
  
  // Product type is the main identifier
  const type = productType || categoryDefaults[category] || 'Item';
  
  // For tile: include size if available (e.g., "12x24 Porcelain Tile")
  if (category === 'tile') {
    if (tileSize && material) {
      return `${tileSize} ${material} Tile`;
    }
    if (material) {
      return `${material} Tile`;
    }
    if (tileSize) {
      return `${tileSize} Tile`;
    }
    return 'Floor Tile';
  }
  
  // For other products: [Finish] [Category] [Type]
  // Keep to 3-4 words max
  if (finish) {
    // Clean finish to single word if possible
    const cleanFinish = finish.split(/[\s,]/)[0];
    return `${cleanFinish} ${categoryDisplay} ${type}`;
  }
  
  // Fallback: just [Category] [Type]
  return `${categoryDisplay} ${type}`;
}

function parsePrice(text: string | undefined | null): number | null {
  if (!text) return null;
  const match = text.match(/\$?([\d,]+\.?\d*)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ''));
  }
  return null;
}

// Amazon-specific price extraction from HTML
function extractAmazonPrice(html: string): number | null {
  // Common Amazon price patterns in HTML - ordered by reliability
  const pricePatterns = [
    // Main product price containers
    /"priceAmount":\s*(\d+\.?\d*)/i,
    /"price":\s*"?\$?(\d+\.?\d*)"?/i,
    // Apex price (primary display price)
    /class="a-price-whole">(\d+)<.*?class="a-price-fraction">(\d+)/is,
    /apexPriceToPay[^>]*>.*?\$(\d+\.?\d*)/is,
    /priceToPay[^>]*>.*?\$(\d+\.?\d*)/is,
    // Core price div
    /corePrice_feature_div[^>]*>.*?\$(\d+\.?\d*)/is,
    // Price with data attribute
    /data-a-color="price"[^>]*>.*?\$(\d+\.?\d*)/is,
    // Buy box price
    /buybox[^>]*price[^>]*>.*?\$(\d+\.?\d*)/is,
    // Offer price
    /offer-price[^>]*>.*?\$(\d+\.?\d*)/is,
  ];

  const candidates: number[] = [];

  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match) {
      let price: number;
      if (match[2]) {
        // Handle split whole/fraction format
        price = parseFloat(`${match[1]}.${match[2]}`);
      } else {
        price = parseFloat(match[1]);
      }
      if (price && price > 0) {
        candidates.push(price);
      }
    }
  }

  // Filter and select best price
  const validPrices = candidates.filter(p => p >= 5 && p < 50000);
  
  if (validPrices.length === 0) return null;
  
  // Return the most common price, or the first valid one
  const priceCount = new Map<number, number>();
  for (const p of validPrices) {
    priceCount.set(p, (priceCount.get(p) || 0) + 1);
  }
  
  let bestPrice = validPrices[0];
  let maxCount = 0;
  for (const [price, count] of priceCount) {
    if (count > maxCount) {
      maxCount = count;
      bestPrice = price;
    }
  }
  
  return bestPrice;
}
// Home Depot-specific price extraction from embedded JSON
function extractHomeDepotPrice(html: string): number | null {
  const patterns = [
    // Embedded product JSON with pricing
    /"pricing"\s*:\s*\{\s*"value"\s*:\s*([\d.]+)/i,
    /"pricing":\{"value":([\d.]+)/i,
    // Price format patterns
    /"price"\s*:\s*([\d.]+)/i,
    // Data attributes
    /data-price="([\d.]+)"/i,
    // Price display classes  
    /class="[^"]*price[^"]*"[^>]*>\s*\$?([\d,]+\.?\d*)/i,
    /price-format__main-price[^>]*>\s*\$?([\d,]+\.?\d*)/i,
    /price__dollars[^>]*>([\d,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price && price > 0 && price < 50000) {
        console.log('Found Home Depot price via pattern:', pattern.toString().slice(0, 50));
        return price;
      }
    }
  }
  
  return null;
}

// Lowe's-specific price extraction from embedded JSON
function extractLowesPrice(html: string): number | null {
  const patterns = [
    /"price"\s*:\s*\{\s*"value"\s*:\s*([\d.]+)/i,
    /"sellingPrice"\s*:\s*([\d.]+)/i,
    /data-price="([\d.]+)"/i,
    /class="[^"]*price[^"]*"[^>]*>\s*\$?([\d,]+\.?\d*)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price && price > 0 && price < 50000) {
        console.log('Found Lowes price via pattern:', pattern.toString().slice(0, 50));
        return price;
      }
    }
  }
  
  return null;
}

// Extract price from markdown with context awareness
function extractPriceFromMarkdown(markdown: string, store: string): number | null {
  // Skip common false positive amounts (delivery fees, coupons)
  const falsePositives = new Set([5.99, 6.99, 7.99, 9.99, 10.00, 10.99]);
  
  const candidates: { price: number; score: number }[] = [];
  
  // Look for price with context keywords (higher confidence)
  const contextPatterns = [
    { pattern: /(?:price|cost|buy now)[:\s]*\$?([\d,]+\.?\d*)/gi, score: 10 },
    { pattern: /\$(\d{2,4}\.?\d{0,2})\s*(?:with coupon|\d+%\s*off)/gi, score: 8 },
    { pattern: /(?:now|sale|deal)[:\s]*\$?([\d,]+\.?\d*)/gi, score: 7 },
    { pattern: /\$(\d{2,4}\.\d{2})/g, score: 5 }, // Standard price format
  ];
  
  for (const { pattern, score } of contextPatterns) {
    const matches = [...markdown.matchAll(pattern)];
    for (const match of matches) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price && price >= 5 && price < 50000 && !falsePositives.has(price)) {
        candidates.push({ price, score });
      }
    }
  }
  
  // Sort by score and return best candidate
  candidates.sort((a, b) => b.score - a.score);
  
  if (candidates.length > 0) {
    return candidates[0].price;
  }
  
  // Ultra-simple fallback: just find ANY price in the markdown for HD/Lowes
  if (store === 'home_depot' || store === 'lowes') {
    const allPrices = [...markdown.matchAll(/\$(\d{2,4}\.\d{2})/g)];
    for (const match of allPrices) {
      const price = parseFloat(match[1]);
      if (price >= 15 && price < 10000) {
        console.log('Using simple fallback price:', price);
        return price;
      }
    }
  }
  
  // For non-Amazon stores, also try the first reasonable price
  if (store !== 'amazon') {
    const basicMatch = markdown.match(/\$(\d{2,4}\.?\d{0,2})/);
    if (basicMatch) {
      const price = parseFloat(basicMatch[1]);
      if (price >= 10 && price < 50000) {
        return price;
      }
    }
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
  const category = detectCategory(url, markdown);
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
  
  // Extract name - try HTML first for Amazon
  if (store === 'amazon') {
    const htmlName = extractAmazonProductName(html);
    if (htmlName) {
      name = htmlName;
    }
  }
  
  // Fall back to markdown H1/H2 extraction
  if (!name) {
    for (const line of lines) {
      if (line.startsWith('# ')) {
        name = line.replace('# ', '').trim();
        break;
      }
    }
  }
  
  // If no H1, look for title patterns
  if (!name) {
    const titleMatch = markdown.match(/(?:^|\n)##?\s*([^\n]+)/);
    if (titleMatch) {
      name = titleMatch[1].trim();
    }
  }
  
  // Extract price - use store-specific logic
  if (store === 'amazon') {
    // Try HTML extraction first for Amazon (more reliable)
    price = extractAmazonPrice(html);
    
    // Fall back to markdown extraction
    if (!price) {
      price = extractPriceFromMarkdown(markdown, store);
    }
  } else if (store === 'home_depot') {
    // Try embedded JSON extraction first for Home Depot
    price = extractHomeDepotPrice(html);
    
    // Fall back to markdown extraction
    if (!price) {
      price = extractPriceFromMarkdown(markdown, store);
    }
  } else if (store === 'lowes') {
    // Try embedded JSON extraction first for Lowe's
    price = extractLowesPrice(html);
    
    // Fall back to markdown extraction
    if (!price) {
      price = extractPriceFromMarkdown(markdown, store);
    }
  } else {
    // For other stores, use markdown extraction
    price = extractPriceFromMarkdown(markdown, store);
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
  
  // Check if name is garbage and generate clean name if needed
  if (isGarbageName(name)) {
    const productType = detectProductType(markdown, category);
    name = generateCleanName(category, brand, finish, material, productType, tile_size);
  }
  
  // Clean up name - truncate if too long
  if (name.length > 200) {
    name = name.substring(0, 200);
  }
  
  return {
    name: name || 'Product',
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
    // Try fast basic scrape first, then fallback to enhanced mode for difficult sites
    const store = detectStore(formattedUrl);
    const needsEnhancedMode = store === 'home_depot' || store === 'lowes';
    
    let data: any = null;
    let usedEnhancedMode = false;
    
    // ATTEMPT 1: Fast basic scrape (no proxy, no actions, short timeout)
    const basicScrapeOptions = {
      url: formattedUrl,
      formats: ['markdown', 'html'],
      onlyMainContent: false,
      timeout: 15000, // 15 seconds - fast!
      location: { country: 'US', languages: ['en-US'] },
    };
    
    console.log('Attempting fast basic scrape for:', store);
    let response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(basicScrapeOptions),
    });
    
    data = await response.json();
    
    // If basic scrape failed, DON'T try enhanced mode - it times out too
    // Instead, check if we got ANY data we can use
    if (!response.ok) {
      console.log('Basic scrape failed with status:', response.status);
      
      // Check if we got partial data we can still use
      const partialMarkdown = data?.data?.markdown || data?.markdown || '';
      const partialHtml = data?.data?.html || data?.html || '';
      
      if (partialMarkdown || partialHtml) {
        console.log('Got partial data despite error, attempting extraction...');
        // Continue with extraction below
      } else {
        // No data at all - return error
        console.error('Firecrawl API error with no usable data:', data);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Could not scrape this URL. Home Depot pages may require manual price entry.' 
          }),
          { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    console.log('Scrape successful, enhanced mode used:', usedEnhancedMode);

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

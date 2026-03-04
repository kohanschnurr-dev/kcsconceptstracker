import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { getUserIdFromBearer } from "../_shared/auth.ts";
import { RateLimiter } from "../_shared/rateLimiter.ts";

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

function detectCategory(url: string, markdown: string): string {
  const lowerUrl = url.toLowerCase();
  const lowerContent = markdown.toLowerCase();

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

  if (lowerContent.includes('faucet') || lowerContent.includes('shower') || lowerContent.includes('toilet')) return 'bathroom';
  if (lowerContent.includes('tile') || lowerContent.includes('flooring')) return 'tile';
  if (lowerContent.includes('light') || lowerContent.includes('chandelier') || lowerContent.includes('pendant')) return 'lighting';
  if (lowerContent.includes('cabinet') || lowerContent.includes('vanity')) return 'cabinets';
  if (lowerContent.includes('mirror')) return 'bathroom';

  return 'general';
}

function detectProductType(markdown: string, category: string): string | null {
  const lowerContent = markdown.toLowerCase();

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
      return type.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }

  return null;
}

function isGarbageName(name: string): boolean {
  if (!name || name.length < 5) return true;

  const lowerName = name.toLowerCase();

  const garbagePhrases = [
    'product summary', 'key product information', 'keyboard shortcut',
    'skip to', 'main content', 'navigation', 'search results',
    'add to cart', 'buy now', 'sign in', 'customer review',
    'similar item', 'frequently bought', 'sponsored', 'advertisement',
    'unknown product',
  ];

  for (const phrase of garbagePhrases) {
    if (lowerName.includes(phrase)) return true;
  }

  if (lowerName.includes('shift+') || lowerName.includes('alt+') || lowerName.includes('opt+')) {
    return true;
  }

  if (/^\$?\d+\.?\d*$/.test(name.trim())) return true;
  if (['item', 'product', 'home', 'page'].includes(lowerName.trim())) return true;

  return false;
}

function extractAmazonProductName(html: string): string | null {
  const productTitleMatch = html.match(/<span[^>]+id="productTitle"[^>]*>([^<]+)<\/span>/i);
  if (productTitleMatch && productTitleMatch[1]) {
    const title = productTitleMatch[1].trim();
    if (!isGarbageName(title)) return title;
  }

  const ogTitleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i) ||
                       html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i);
  if (ogTitleMatch && ogTitleMatch[1]) {
    const title = ogTitleMatch[1].trim();
    const cleanTitle = title.replace(/\s*[-–—]\s*Amazon\.com.*$/i, '').trim();
    if (!isGarbageName(cleanTitle)) return cleanTitle;
  }

  const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleTagMatch && titleTagMatch[1]) {
    const title = titleTagMatch[1].trim();
    const cleanTitle = title.replace(/\s*[-–—]\s*Amazon\.com.*$/i, '').replace(/Amazon\.com:\s*/i, '').trim();
    if (!isGarbageName(cleanTitle) && cleanTitle.length > 10) return cleanTitle;
  }

  return null;
}

function generateCleanName(
  category: string,
  brand: string | null,
  finish: string | null,
  material: string | null,
  productType: string | null,
  tileSize: string | null
): string {
  const categoryDefaults: Record<string, string> = {
    bathroom: 'Fixture', kitchen: 'Fixture', plumbing: 'Fixture',
    tile: 'Tile', lighting: 'Light', cabinets: 'Cabinet',
    doors: 'Door', windows: 'Window', hardware: 'Hardware',
    appliances: 'Appliance', general: 'Item',
  };

  const categoryDisplay = category.charAt(0).toUpperCase() + category.slice(1);
  const type = productType || categoryDefaults[category] || 'Item';

  if (category === 'tile') {
    if (tileSize && material) return `${tileSize} ${material} Tile`;
    if (material) return `${material} Tile`;
    if (tileSize) return `${tileSize} Tile`;
    return 'Floor Tile';
  }

  if (finish) {
    const cleanFinish = finish.split(/[\s,]/)[0];
    return `${cleanFinish} ${categoryDisplay} ${type}`;
  }

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

function extractAmazonPrice(html: string): number | null {
  const pricePatterns = [
    /"priceAmount":\s*(\d+\.?\d*)/i,
    /"price":\s*"?\$?(\d+\.?\d*)"?/i,
    /class="a-price-whole">(\d+)<.*?class="a-price-fraction">(\d+)/is,
    /apexPriceToPay[^>]*>.*?\$(\d+\.?\d*)/is,
    /priceToPay[^>]*>.*?\$(\d+\.?\d*)/is,
    /corePrice_feature_div[^>]*>.*?\$(\d+\.?\d*)/is,
    /data-a-color="price"[^>]*>.*?\$(\d+\.?\d*)/is,
    /buybox[^>]*price[^>]*>.*?\$(\d+\.?\d*)/is,
    /offer-price[^>]*>.*?\$(\d+\.?\d*)/is,
  ];

  const candidates: number[] = [];

  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match) {
      let price: number;
      if (match[2]) {
        price = parseFloat(`${match[1]}.${match[2]}`);
      } else {
        price = parseFloat(match[1]);
      }
      if (price && price > 0) {
        candidates.push(price);
      }
    }
  }

  const validPrices = candidates.filter(p => p >= 5 && p < 50000);
  if (validPrices.length === 0) return null;

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

function extractHomeDepotPrice(html: string): number | null {
  const patterns = [
    /"nowPrice"\s*:\s*([\d.]+)/i,
    /"originalPrice"\s*:\s*([\d.]+)/i,
    /"wasPrice"\s*:\s*([\d.]+)/i,
    /"specialPrice"\s*:\s*([\d.]+)/i,
    /"storePrice"\s*:\s*([\d.]+)/i,
    /"displayPrice"\s*:\s*"?\$?([\d,]+\.?\d*)"?/i,
    /"pricing"\s*:\s*\{\s*"value"\s*:\s*([\d.]+)/i,
    /"pricing":\{"value":([\d.]+)/i,
    /"price"\s*:\s*([\d.]+)/i,
    /data-price="([\d.]+)"/i,
    /class="[^"]*price[^"]*"[^>]*>\s*\$?([\d,]+\.?\d*)/i,
    /price-format__main-price[^>]*>\s*\$?([\d,]+\.?\d*)/i,
    /price__dollars[^>]*>([\d,]+)/i,
    /data-automation-id="[^"]*price[^"]*"[^>]*>\s*\$?([\d,]+\.?\d*)/i,
  ];

  const candidates: number[] = [];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price && price >= 5 && price < 50000) {
        candidates.push(price);
      }
    }
  }

  if (candidates.length === 0) return null;
  const counts = new Map<number, number>();
  for (const p of candidates) counts.set(p, (counts.get(p) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

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
        return price;
      }
    }
  }

  return null;
}

function extractPriceFromMarkdown(markdown: string, store: string): number | null {
  const falsePositives = new Set([5.99, 6.99, 7.99, 9.99, 10.00, 10.99]);

  const candidates: { price: number; score: number }[] = [];

  const contextPatterns: { pattern: RegExp; score: number }[] = [
    { pattern: /\*{1,2}\$(\d{1,4}(?:\.\d{2})?)\*{1,2}/g, score: 10 },
    { pattern: /\$(\d{1,4}\.\d{2})\s*(?:with Prime|& FREE|Save)/gi, score: 9 },
    { pattern: /(?:price|cost|buy now)[:\s]*\$?([\d,]+\.?\d*)/gi, score: 9 },
    { pattern: /(?:now|sale|deal)[:\s]*\$?([\d,]+\.?\d*)/gi, score: 7 },
    { pattern: /^\$(\d{2,4}(?:\.\d{2})?)\s*$/gm, score: 8 },
    { pattern: /\$(\d{2,4}\.\d{2})/g, score: 5 },
    { pattern: /(?:price|cost)[^$\n]{0,20}?([\d]{2,4}\.\d{2})/gi, score: 6 },
  ];

  for (const { pattern, score } of contextPatterns) {
    const matches = [...markdown.matchAll(pattern)];
    for (const match of matches) {
      const price = parseFloat((match[1] || '').replace(/,/g, ''));
      if (price && price >= 5 && price < 50000 && !falsePositives.has(price)) {
        candidates.push({ price, score });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length > 0) {
    return candidates[0].price;
  }

  if (store === 'home_depot' || store === 'lowes') {
    const allPrices = [...markdown.matchAll(/\$(\d{2,4}\.\d{2})/g)];
    for (const match of allPrices) {
      const price = parseFloat(match[1]);
      if (price >= 15 && price < 10000) {
        return price;
      }
    }
  }

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

  const deliveryMatch = lowerText.match(/(\d+)\s*(?:to|-)\s*(\d+)\s*(?:business\s+)?days?/i);
  if (deliveryMatch) {
    return parseInt(deliveryMatch[2]);
  }

  const singleDayMatch = lowerText.match(/(\d+)\s*(?:business\s+)?days?/i);
  if (singleDayMatch) {
    return parseInt(singleDayMatch[1]);
  }

  if (lowerText.includes('in stock') || lowerText.includes('available now')) {
    return 1;
  }

  return null;
}

function extractProductImage(html: string, url: string): string | null {
  const store = detectStore(url);
  const decodedHtml = html.replace(/&quot;/g, '"').replace(/&amp;/g, '&');

  if (store === 'amazon') {
    const amazonPatterns = [
      /property="og:image"[^>]+content="([^"]+)"/i,
      /<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i,
      /data-old-hires="([^"]+)"/i,
      /"hiRes":"([^"]+)"/i,
      /id="landingImage"[^>]+src="([^"]+)"/i,
      /id="imgBlkFront"[^>]+src="([^"]+)"/i,
      /class="a-dynamic-image[^"]*"[^>]+src="([^"]+)"/i,
      /"large":"([^"]+)"/i,
      /data-a-dynamic-image="(\{[^}]+\})"/i,
    ];

    for (const pattern of amazonPatterns) {
      const match = decodedHtml.match(pattern);
      if (match && match[1]) {
        if (match[1].startsWith('{')) {
          const urlMatch = match[1].match(/"(https:\/\/[^"]+)"/);
          if (urlMatch) {
            return urlMatch[1].replace(/\._[A-Z]{2}\d+_\./, '.');
          }
          continue;
        }
        let imgUrl = match[1].replace(/\\u002F/g, '/').replace(/\\/g, '');
        imgUrl = imgUrl.replace(/\._[A-Z]{2}\d+_\./, '.');
        if (imgUrl.startsWith('http')) {
          return imgUrl;
        }
      }
    }
  }

  if (store === 'home_depot') {
    const ogMatch = decodedHtml.match(/property="og:image"[^>]+content="([^"]+)"/i) ||
                    decodedHtml.match(/content="([^"]+)"[^>]+property="og:image"/i);
    if (ogMatch && ogMatch[1] && ogMatch[1].startsWith('http')) {
      return ogMatch[1];
    }
    const hdPatterns = [
      /data-src="(https:\/\/images\.homedepot[^"]+)"/i,
      /src="(https:\/\/images\.homedepot[^"]+)"/i,
      /"src":"(https:\/\/images\.homedepot[^"]+)"/i,
      /"imageUrl"\s*:\s*"(https:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i,
      /"primaryImage"\s*:\s*"(https:\/\/[^"]+)"/i,
      /"canonicalUrl"\s*:\s*"(https:\/\/[^"]+\.(jpg|jpeg|png|webp))"/i,
    ];

    for (const pattern of hdPatterns) {
      const match = decodedHtml.match(pattern);
      if (match && match[1] && match[1].startsWith('http')) {
        return match[1].replace(/\\/g, '');
      }
    }
  }

  if (store === 'lowes') {
    const ogMatch = decodedHtml.match(/property="og:image"[^>]+content="([^"]+)"/i) ||
                    decodedHtml.match(/content="([^"]+)"[^>]+property="og:image"/i);
    if (ogMatch && ogMatch[1] && ogMatch[1].startsWith('http')) return ogMatch[1];
    const lowesPatterns = [
      /src="(https:\/\/mobileimages\.lowes[^"]+)"/i,
      /src="(https:\/\/images\.lowes[^"]+)"/i,
      /"imageUrl"\s*:\s*"(https:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i,
    ];

    for (const pattern of lowesPatterns) {
      const match = decodedHtml.match(pattern);
      if (match && match[1] && match[1].startsWith('http')) {
        return match[1].replace(/\\/g, '');
      }
    }
  }

  const ogImageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) ||
                       html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
  if (ogImageMatch && ogImageMatch[1]) {
    return ogImageMatch[1];
  }

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

function applyAiExtraction(
  aiExtracted: Record<string, any>,
  fields: {
    name: string;
    price: number | null;
    brand: string | null;
    model_number: string | null;
    finish: string | null;
  }
): typeof fields {
  const result = { ...fields };

  const rawPrice = aiExtracted.price ?? aiExtracted.Price;
  if (rawPrice !== null && rawPrice !== undefined) {
    const parsed = parseFloat(String(rawPrice).replace(/[^0-9.]/g, ''));
    if (parsed >= 1 && parsed < 50000) {
      result.price = parsed;
    }
  }

  const rawName = aiExtracted.name ?? aiExtracted.Name;
  if (rawName && !isGarbageName(String(rawName))) {
    result.name = String(rawName).substring(0, 200);
  }

  const rawBrand = aiExtracted.brand ?? aiExtracted.Brand;
  if (rawBrand && String(rawBrand).length < 50 && String(rawBrand).toLowerCase() !== 'null') {
    result.brand = String(rawBrand);
  }

  const rawModel = aiExtracted.model_number ?? aiExtracted['model_number_or_SKU'] ?? aiExtracted.model_number_or_SKU ?? aiExtracted.sku ?? aiExtracted.SKU;
  if (rawModel && String(rawModel).length < 50 && String(rawModel).toLowerCase() !== 'null') {
    result.model_number = String(rawModel);
  }

  const rawFinish = aiExtracted.finish ?? aiExtracted['finish_or_color'] ?? aiExtracted.finish_or_color ?? aiExtracted.color ?? aiExtracted.Color;
  if (rawFinish && String(rawFinish).length < 80 && String(rawFinish).toLowerCase() !== 'null') {
    result.finish = String(rawFinish);
  }

  return result;
}

function extractProductData(
  markdown: string,
  html: string,
  url: string,
  aiExtracted: Record<string, any> | null = null
): ProductData {
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

  if (aiExtracted) {
    const ai = applyAiExtraction(aiExtracted, { name, price, brand, model_number, finish });
    name = ai.name;
    price = ai.price;
    brand = ai.brand;
    model_number = ai.model_number;
    finish = ai.finish;
  }

  image_url = extractProductImage(html, url);

  if (!name && store === 'amazon') {
    const htmlName = extractAmazonProductName(html);
    if (htmlName) name = htmlName;
  }

  if (!price) {
    if (store === 'amazon') {
      price = extractAmazonPrice(html);
    } else if (store === 'home_depot') {
      price = extractHomeDepotPrice(html);
    } else if (store === 'lowes') {
      price = extractLowesPrice(html);
    }
  }

  if (!name) {
    for (const line of lines) {
      if (line.startsWith('# ')) {
        name = line.replace('# ', '').trim();
        break;
      }
    }
  }
  if (!name) {
    const titleMatch = markdown.match(/(?:^|\n)##?\s*([^\n]+)/);
    if (titleMatch) name = titleMatch[1].trim();
  }

  if (!price) {
    price = extractPriceFromMarkdown(markdown, store);
  }

  if (!model_number) {
    const modelPatterns = [
      /model\s*(?:number|#|no\.?)?\s*:?\s*([A-Z0-9][A-Z0-9\-]{2,25})/i,
      /sku\s*:?\s*([A-Z0-9][A-Z0-9\-]{2,25})/i,
      /item\s*(?:number|#|no\.?)?\s*:?\s*([A-Z0-9][A-Z0-9\-]{2,25})/i,
      /internet\s*#?\s*:?\s*([0-9]{5,12})/i,
    ];

    for (const pattern of modelPatterns) {
      const match = pattern.exec(markdown);
      if (match && match[1]) {
        model_number = match[1].trim();
        break;
      }
    }
  }

  if (!finish) {
    const colorPatterns = [
      /\b(white|black|gray|grey|beige|cream|ivory|tan|brown|espresso|charcoal|silver|gold|bronze|brass|nickel|chrome|copper|navy|blue|green|red|pink|yellow|orange|purple|taupe|sand|almond|bone|biscuit)\b/gi,
    ];

    for (const pattern of colorPatterns) {
      const match = markdown.match(pattern);
      if (match) {
        finish = match[0].trim();
        finish = finish.charAt(0).toUpperCase() + finish.slice(1).toLowerCase();
        break;
      }
    }
  }

  if (!brand) {
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
  }

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

  const tileSizePatterns = [
    /(\d{1,2})\s*x\s*(\d{1,2})/gi,
    /(\d{1,2})\s*(?:"|in\.?)\s*(?:x|by)\s*(\d{1,2})\s*(?:"|in\.?)/gi,
  ];

  for (const pattern of tileSizePatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const sizeMatch = match[0].match(/(\d{1,2})\s*(?:x|by|"|\s)+\s*(\d{1,2})/i);
      if (sizeMatch) {
        tile_size = `${sizeMatch[1]}x${sizeMatch[2]}`;
        break;
      }
    }
  }

  const materialKeywords = ['porcelain', 'ceramic', 'marble', 'travertine', 'slate', 'granite', 'quartzite', 'limestone', 'glass', 'mosaic', 'natural stone', 'vinyl', 'laminate', 'hardwood', 'engineered'];

  const lowerMarkdown = markdown.toLowerCase();
  for (const mat of materialKeywords) {
    if (lowerMarkdown.includes(mat)) {
      material = mat.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }

  if (!material && name) {
    const nameMaterialMatch = name.match(/\b(porcelain|ceramic|natural\s*stone|marble|travertine|slate|granite|quartzite|limestone|glass|mosaic)\b/gi);
    if (nameMaterialMatch) {
      material = nameMaterialMatch[0].trim();
      material = material.charAt(0).toUpperCase() + material.slice(1).toLowerCase();
    }
  }

  lead_time_days = parseLeadTime(markdown);

  const dfwMatch = markdown.match(/(?:dallas|dfw|75\d{3})[^.]*?(\d+)\s*(?:to|-)\s*(\d+)\s*days?/gi);
  if (dfwMatch) {
    const dayMatch = dfwMatch[0].match(/(\d+)\s*(?:to|-)\s*(\d+)/);
    if (dayMatch) {
      lead_time_days = parseInt(dayMatch[2]);
    }
  }

  const specPatterns = [
    /\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g,
    /([A-Za-z\s]+):\s*([^\n]+)/g,
  ];

  for (const pattern of specPatterns) {
    const matches = [...markdown.matchAll(pattern)];
    for (const match of matches.slice(0, 20)) {
      const key = match[1]?.trim().toLowerCase().replace(/\s+/g, '_');
      const value = match[2]?.trim();
      if (key && value && key.length < 50 && value.length < 200) {
        specs[key] = value;
      }
    }
  }

  if (tile_size) specs['tile_size'] = tile_size;
  if (material) specs['material'] = material;

  if (isGarbageName(name)) {
    const productType = detectProductType(markdown, category);
    name = generateCleanName(category, brand, finish, material, productType, tile_size);
  }

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

async function firecrawlScrape(
  url: string,
  apiKey: string,
  options: {
    timeout?: number;
    waitFor?: number;
    onlyMainContent?: boolean;
    withAiJson?: boolean;
    withUserAgent?: boolean;
  } = {}
): Promise<{ ok: boolean; data: any }> {
  const { timeout = 10000, waitFor, onlyMainContent = false, withAiJson = false, withUserAgent = false } = options;

  const formats: string[] = ['markdown', 'html'];
  if (withAiJson) {
    formats.push('json');
  }

  const body: any = {
    url,
    formats,
    onlyMainContent,
    timeout,
    location: { country: 'US', languages: ['en-US'] },
  };

  if (withAiJson) {
    body.jsonOptions = {
      prompt: 'Extract product information: name (full product title, not a navigation label), price (number only, no $ sign, the actual sale price), brand, model_number or SKU (alphanumeric code), finish or color, material. Return null for any field not found.',
    };
  }

  if (waitFor) body.waitFor = waitFor;
  if (withUserAgent) {
    body.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
  }

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return { ok: response.ok, data };
}

Deno.serve(async (req) => {
  const { headers: corsHeaders, preflight } = handleCors(req);
  if (preflight) return preflight;

  try {
    const userId = getUserIdFromBearer(req.headers.get("Authorization"));
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { limited } = await new RateLimiter(
      createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
    ).check(userId, "scrape-product-url", 15);
    if (limited) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded. Up to 15 product scrapes per hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const store = detectStore(formattedUrl);

    const needsWaitFor = store === 'home_depot' || store === 'lowes' || store === 'amazon';
    const attemptTimeout = store === 'amazon' ? 25000 : needsWaitFor ? 20000 : 12000;
    const attemptWaitFor = store === 'amazon' ? 3000 : store === 'home_depot' ? 3000 : store === 'lowes' ? 2000 : undefined;

    const { ok, data } = await firecrawlScrape(formattedUrl, apiKey, {
      timeout: attemptTimeout,
      waitFor: attemptWaitFor,
      onlyMainContent: false,
      withAiJson: true,
      withUserAgent: needsWaitFor,
    });

    const markdown = data?.data?.markdown || data?.markdown || '';
    const html = data?.data?.html || data?.html || '';
    const aiExtracted: Record<string, any> | null = data?.data?.json || data?.json || null;

    const productData = extractProductData(markdown, html, formattedUrl, aiExtracted);

    return new Response(
      JSON.stringify({
        success: true,
        data: productData,
        raw_markdown: (markdown || '').substring(0, 2000),
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

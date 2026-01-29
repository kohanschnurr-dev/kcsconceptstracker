
## Generate Clean Product Names from Scraped Data

The current scraper is extracting garbage text like "Product summary presents key product information" instead of the actual product name. This happens because Amazon pages often have accessibility/navigation text before the actual product title in the markdown.

---

## Solution

Add smart name generation that:
1. Detects when the extracted name is garbage (too short, generic phrases, accessibility text)
2. Generates a clean, descriptive product name using category + brand + key attributes
3. Extracts the actual product title from HTML using Amazon-specific patterns

---

## Technical Changes

**File: `supabase/functions/scrape-product-url/index.ts`**

### 1. Add Amazon-specific name extraction from HTML

Create a new function `extractAmazonProductName(html: string)` that targets:
- `<span id="productTitle">...</span>` (primary Amazon pattern)
- `<h1 class="a-size-large...">...</h1>`
- `<meta property="og:title" content="..."/>`

### 2. Add garbage name detection

Create `isGarbageName(name: string)` to detect invalid names:
- Too short (less than 5 characters)
- Generic phrases like "Product summary", "Skip to", "Main content", "Navigation"
- Contains "keyboard shortcut" or accessibility text
- Too long and repetitive

### 3. Add clean name generation

Create `generateCleanName(category, brand, finish, material, specs)` to build descriptive names:

| Category | Example Output |
|----------|----------------|
| bathroom | "Delta Chrome Bathroom Faucet" |
| plumbing | "Moen Brushed Nickel Kitchen Faucet" |
| tile | "Porcelain 12x24 Floor Tile" |
| lighting | "Brushed Nickel Pendant Light" |
| cabinets | "Shaker White Base Cabinet" |

### 4. Update extractProductData flow

```text
1. Try HTML extraction for Amazon (new)
2. Fall back to markdown H1/H2 extraction (existing)
3. Check if name is garbage
4. If garbage, generate clean name from:
   - Category (detected from URL/content)
   - Brand (if extracted)
   - Finish/color (if extracted)
   - Material (if extracted)
   - Key specs
```

---

## Example Transformation

**Before:**
```
Name: "Product summary presents key product information"
```

**After:**
```
Name: "Delta Chrome Bathroom Faucet"
(generated from: brand=Delta, finish=Chrome, category=bathroom, specs include faucet)
```

---

## Implementation Details

### Category-to-product-type mapping

```typescript
const categoryProductTypes: Record<string, string[]> = {
  bathroom: ['Faucet', 'Vanity', 'Mirror', 'Toilet', 'Shower', 'Fixture'],
  plumbing: ['Faucet', 'Valve', 'Drain', 'Pipe', 'Fixture'],
  tile: ['Tile', 'Flooring'],
  lighting: ['Light', 'Fixture', 'Chandelier', 'Pendant', 'Sconce'],
  // ... etc
};
```

### Name generation priority

1. Brand + Finish + Product Type (e.g., "Delta Chrome Faucet")
2. Brand + Product Type (e.g., "Delta Faucet")
3. Finish + Product Type (e.g., "Chrome Bathroom Faucet")
4. Category + "Item" fallback (e.g., "Bathroom Item")

---

## Summary

This enhancement ensures users always get a readable, useful product name instead of garbage accessibility text, while still using the actual product title when it's properly extracted.

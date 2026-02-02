

## Plan: Auto-Extract Product Image from Screenshot using AI Vision

### Overview

When parsing a product screenshot with AI, also use AI image generation to extract/isolate the product image from the screenshot. This automatically populates the "Product Image" field, saving the user from having to manually upload a separate product photo.

---

### Changes Summary

| File | Change |
|------|--------|
| `supabase/functions/parse-product-screenshot/index.ts` | Add a second AI call to extract/generate the product image |
| `src/components/procurement/ProcurementItemModal.tsx` | Update `handleScreenshotUpload` to handle the returned image and upload it to storage |

---

### Technical Approach

Use the Lovable AI image generation model (`google/gemini-2.5-flash-image`) in a follow-up call after extracting text data. The model can:
1. Look at the screenshot
2. Generate a clean, isolated image of just the product

This is more reliable than trying to crop coordinates from the screenshot, since AI can intelligently extract just the product.

---

### Technical Details

**File: `supabase/functions/parse-product-screenshot/index.ts`**

After extracting text data, make a second AI call to generate the product image:

```typescript
// Second AI call - extract product image
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
            text: "Extract just the main product image from this retail website screenshot. Generate a clean, isolated image of the product on a plain white background. Focus only on the product itself, not the webpage elements."
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

// Extract the generated image from response
const imageData = await imageResponse.json();
const extractedImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
```

Return the extracted image in the response:
```typescript
return new Response(
  JSON.stringify({
    success: true,
    data: {
      name: productData.name || null,
      price: productData.price || null,
      model_number: productData.model_number || null,
      finish: productData.finish || null,
      brand: productData.brand || null,
      product_image: extractedImage || null, // NEW: base64 image data
    }
  }),
  ...
);
```

---

**File: `src/components/procurement/ProcurementItemModal.tsx`**

Update `handleScreenshotUpload` to handle the extracted image:

```typescript
const handleScreenshotUpload = async (file: File) => {
  setParsingScreenshot(true);
  try {
    const base64 = await fileToBase64(file);
    
    const { data, error } = await supabase.functions.invoke('parse-product-screenshot', {
      body: { image_base64: base64 }
    });
    
    if (error) throw error;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to parse screenshot');
    }
    
    // If AI extracted a product image, upload it to storage
    let imageUrl = '';
    if (data.data.product_image) {
      imageUrl = await uploadBase64Image(data.data.product_image);
    }
    
    // Populate form with parsed data including image
    setFormData(prev => ({
      ...prev,
      name: data.data.name || prev.name,
      unit_price: data.data.price?.toString() || prev.unit_price,
      model_number: data.data.model_number || prev.model_number,
      finish: data.data.finish || prev.finish,
      source_url: urlInput.trim(),
      source_store: detectStoreFromUrl(urlInput),
      image_url: imageUrl || prev.image_url, // NEW: use extracted image
    }));
    
    ...
  }
};

// Helper to upload base64 image to Supabase storage
const uploadBase64Image = async (base64Data: string): Promise<string> => {
  // Convert base64 to blob
  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const byteCharacters = atob(base64Content);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/png' });
  
  const fileName = `${Date.now()}-ai-extracted.png`;
  const { error } = await supabase.storage
    .from('procurement-images')
    .upload(fileName, blob);
  
  if (error) throw error;
  
  const { data } = supabase.storage.from('procurement-images').getPublicUrl(fileName);
  return data.publicUrl;
};
```

---

### Flow

```text
User pastes/uploads product screenshot
            │
            ▼
[Edge Function: parse-product-screenshot]
            │
            ├─► AI Call #1: Extract text data (name, price, model, etc.)
            │
            └─► AI Call #2: Extract/generate product image
                     │
                     ▼
            Return both to frontend
            │
            ▼
[Frontend uploads extracted image to storage]
            │
            ▼
Form populated with all data + product image
```

---

### User Experience

| Before | After |
|--------|-------|
| Parse screenshot → Only text fields filled | Parse screenshot → Text fields + Product Image filled |
| Product Image shows empty placeholder | Product Image shows the extracted product photo |
| User must manually upload product image | Product image auto-populated (user can still change it) |

---

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/parse-product-screenshot/index.ts` | Add second AI call with image generation model, return `product_image` in response |
| `src/components/procurement/ProcurementItemModal.tsx` | Add `uploadBase64Image` helper, update `handleScreenshotUpload` to process and save extracted image |




## Address Autocomplete Feature - Google Maps Style

### What This Does
Adds a modern autocomplete experience for address fields throughout the app. When you start typing an address (or use "@" to trigger it), the system suggests verified addresses via a geocoding API and automatically extracts latitude/longitude coordinates for instant map pin population.

---

### Current Behavior
- Address fields are plain text inputs
- No validation or suggestions
- No geocoding (lat/long not stored)
- Manual typing prone to typos

### New Behavior
- Type a few letters and see address suggestions in a dropdown
- Select from dropdown to auto-fill the complete address
- Latitude and longitude are automatically extracted and saved
- Optional "@" trigger for quick lookup (Notion/Slack-style)

---

### API Choice: Google Places vs Alternatives

| Option | Pros | Cons |
|--------|------|------|
| **Google Places API** | Best accuracy, familiar UX | Requires API key, has usage costs |
| **Mapbox Search** | Good accuracy, free tier | Requires API key |
| **Nominatim (OpenStreetMap)** | Free, no key needed | Less accurate, rate limited |

**Recommendation**: Use **Google Places API** for best accuracy since this is a real estate app where address precision matters. You'll need to add a Google Maps API key.

---

### Technical Implementation

#### 1. Database Migration - Add Lat/Long Columns

Add `latitude` and `longitude` columns to the `projects` table:

```sql
ALTER TABLE projects 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);
```

#### 2. Create Reusable AddressAutocomplete Component

**New File: `src/components/AddressAutocomplete.tsx`**

This component will:
- Display an input field with a MapPin icon
- Debounce user input (300ms)
- Call Google Places Autocomplete API via edge function
- Show dropdown of suggestions
- On selection, geocode the address to get lat/long
- Return full address + coordinates to parent component

```typescript
interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  className?: string;
}
```

Key features:
- Uses Command component for the dropdown (already in project)
- Supports "@" trigger: if user types "@123" it triggers search for "123"
- Shows "Searching..." loading state
- Displays structured results: **Main text** (street) + secondary text (city, state)

#### 3. Create Edge Function for Google Places API

**New File: `supabase/functions/geocode-address/index.ts`**

This edge function:
- Receives search query from frontend
- Calls Google Places Autocomplete API
- Returns predictions with place_id
- Can also geocode a selected place_id to get lat/long

```typescript
// Endpoint 1: Get autocomplete suggestions
POST /geocode-address
{ "action": "autocomplete", "query": "1234 Main" }
-> Returns: [{ place_id, description, main_text, secondary_text }]

// Endpoint 2: Get coordinates for selected place
POST /geocode-address  
{ "action": "geocode", "place_id": "ChIJ..." }
-> Returns: { lat: 32.7767, lng: -96.7970 }
```

#### 4. Update NewProjectModal

**File: `src/components/NewProjectModal.tsx`**

Replace the plain address input with the new autocomplete component:

```tsx
// Before
<Input
  placeholder="1234 Main St, Dallas, TX 75208"
  value={address}
  onChange={(e) => setAddress(e.target.value)}
/>

// After
<AddressAutocomplete
  value={address}
  onChange={(addr, lat, lng) => {
    setAddress(addr);
    setLatitude(lat);
    setLongitude(lng);
  }}
  placeholder="Start typing an address..."
/>
```

Update the database insert to include lat/long:

```typescript
const { data: project } = await supabase
  .from('projects')
  .insert({
    name,
    address,
    latitude,      // New
    longitude,     // New
    total_budget: parseFloat(totalBudget),
    // ...
  })
```

#### 5. Add Google Maps API Key

You'll need to add a `GOOGLE_MAPS_API_KEY` secret. The edge function will use this to call Google's APIs.

Required APIs to enable in Google Cloud Console:
- Places API
- Geocoding API

---

### Component Architecture

```text
┌─────────────────────────────────────────┐
│  AddressAutocomplete Component          │
│  ┌─────────────────────────────────┐    │
│  │ 📍 1234 Main St, Dallas...      │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ 1234 Main Street                │◄───┤ Dropdown
│  │   Dallas, TX 75208              │    │ (Command)
│  ├─────────────────────────────────┤    │
│  │ 1234 Main Avenue                │    │
│  │   Plano, TX 75093               │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
         │
         ▼
  ┌──────────────────┐
  │ Edge Function    │
  │ geocode-address  │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Google Places    │
  │ API              │
  └──────────────────┘
```

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/geocode-address/index.ts` | Create | Edge function for Places API calls |
| `src/components/AddressAutocomplete.tsx` | Create | Reusable autocomplete input component |
| `src/components/NewProjectModal.tsx` | Modify | Use AddressAutocomplete, save lat/long |
| Database | Migrate | Add latitude, longitude columns to projects |

---

### Optional Enhancements (Future)

1. **Map Preview**: Show a small map preview when address is selected
2. **Vendor Addresses**: Apply autocomplete to vendor forms
3. **Calendar Events**: Add location field with autocomplete to calendar events
4. **Offline Fallback**: Save recently used addresses for quick re-selection

---

### Setup Required

Before implementing, you'll need to:
1. **Create a Google Cloud Project** (if not already)
2. **Enable Places API and Geocoding API**
3. **Create an API key** with these APIs enabled
4. **Add the key** as a Supabase secret: `GOOGLE_MAPS_API_KEY`


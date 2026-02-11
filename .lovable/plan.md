

## Add State Field for Accurate Weather Geocoding

### What Changes
Add a "Business State" field next to "Business City" on the Settings page. The state will be stored in the database and combined with the city when geocoding for weather, ensuring the correct location is resolved (e.g., "Eugene, Oregon" instead of a Eugene in another country).

### Steps

**1. Database migration** -- Add a `state` column (text, nullable) to the `profiles` table.

**2. Update profile hook (`src/hooks/useProfile.ts`)**
- Add `state: string | null` to the `Profile` interface
- Include `state` in the `updateProfile` mutation payload

**3. Update Settings page (`src/pages/Settings.tsx`)**
- Add a `state` local state variable initialized from `profile.state`
- Replace the single city input with a side-by-side row: City + State (using the existing `grid gap-4 sm:grid-cols-2` pattern)
- Update placeholder to "e.g. Dallas" for city and "e.g. TX" for state
- Include `state` in the dirty-check and save logic

**4. Update Weather Widget (`src/components/calendar/WeatherWidget.tsx`)**
- Accept an optional `state` prop
- When geocoding, combine city and state into the search query: `"${city}, ${state}"` for more precise results

**5. Update Calendar Header (`src/components/calendar/CalendarHeader.tsx`)**
- Pass `profile.state` to the `WeatherWidget` alongside `profile.city`


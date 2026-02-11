

## Add Business City to Account Settings for Weather

### What Changes
A new "City" field will be added to the Account section on the Settings page. The weather widget on the Calendar page currently hardcodes "DFW" coordinates. After this change, it will pull the user's saved city and geocode it to show weather for their actual location.

### Steps

**1. Add `city` column to profiles table**
- Add a nullable `text` column called `city` to the `profiles` table via migration
- Default: `null` (falls back to DFW behavior)

**2. Update profile hook and Settings page**

**File: `src/hooks/useProfile.ts`**
- Add `city: string | null` to the `Profile` interface
- Include `city` in the `updateProfile` mutation payload

**File: `src/pages/Settings.tsx`**
- Add a `city` state variable initialized from `profile.city`
- Add a "City" input field in the Account card below the name fields (e.g., "Dallas, TX")
- Include `city` in the save logic and dirty-check

**3. Update Weather Widget to use saved city**

**File: `src/components/calendar/WeatherWidget.tsx`**
- Accept an optional `city` prop (string)
- When a city is provided, use the Open-Meteo geocoding API (`https://geocoding-api.open-meteo.com/v1/search?name=...`) to resolve lat/lon before fetching weather
- Fall back to hardcoded DFW coordinates if no city is set or geocoding fails
- Display the city name (or "DFW") as the label in the widget

**File: `src/pages/Calendar.tsx`** (or wherever WeatherWidget is rendered)
- Read the user's profile and pass `profile.city` to `<WeatherWidget city={profile?.city} />`


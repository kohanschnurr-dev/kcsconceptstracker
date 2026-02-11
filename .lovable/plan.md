

## Fix Weather Widget Location Label

### Problem
The weather widget shows "DFW" instead of the user's saved city and state ("Scottsdale, AZ"). Two issues:
1. The location label is pulled from the geocoding API response instead of the user's profile values
2. The label format should be "City, ST" (e.g., "Scottsdale, AZ")

### Change

**File: `src/components/calendar/WeatherWidget.tsx`**

Update the label logic (around lines 34-47) so that when the user has a city saved, the label is constructed directly from the `city` and `state` props in "City, ST" format -- not from the geocoding API response. The geocoding API is only used to resolve coordinates for the weather fetch.

- If both `city` and `state` are provided: label = `"City, ST"` (e.g., "Scottsdale, AZ")
- If only `city` is provided: label = the city name
- If neither is set: label = `"DFW"` (default fallback)

This is a single-line change: replace `label = geoData.results[0].name` with `label = state ? \`\${city}, \${state}\` : city` (and set it before the geocoding call rather than inside the response handler).


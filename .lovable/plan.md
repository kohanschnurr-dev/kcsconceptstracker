

## Switch Weather Widget to National Weather Service (NWS) API

### Why

The NWS API provides official US government forecasts -- the same data local TV meteorologists use. No API key required, no rate limits, and temperatures will closely match what you see on Weather.com and your phone.

### How It Works

The NWS API requires a two-step lookup:

1. **Points endpoint**: `https://api.weather.gov/points/{lat},{lon}` -- returns a forecast URL specific to that grid location
2. **Forecast endpoint**: The URL from step 1 returns a 7-day forecast with highs, lows, conditions, and precipitation chance

### Changes

**File: `src/components/calendar/WeatherWidget.tsx`**

- Keep the existing geocoding step (Open-Meteo geocoding) to resolve city/state to lat/lon coordinates
- Replace the Open-Meteo forecast call with two NWS API calls:
  1. Fetch the grid point from `api.weather.gov/points/{lat},{lon}`
  2. Fetch the forecast from the returned `forecast` URL
- Parse the NWS response format (periods with `temperature`, `shortForecast`, `probabilityOfPrecipitation`) into the existing `WeatherDay` structure
- NWS returns day/night periods, so pair them to extract high and low temps
- Map NWS `shortForecast` text (e.g., "Partly Cloudy", "Rain Showers") to weather icons using keyword matching instead of numeric codes
- Add a `User-Agent` header (required by NWS API): `"(KCSTracker, contact@example.com)"`
- Keep Open-Meteo as a fallback if NWS fails (e.g., for non-US locations)
- Limit to 5 days to match current display

### Technical Details

NWS forecast response structure:
```text
properties.periods[] = {
  name: "Tuesday",
  temperature: 85,
  temperatureUnit: "F",
  shortForecast: "Partly Cloudy",
  detailedForecast: "...",
  isDaytime: true,
  probabilityOfPrecipitation: { value: 30 }
}
```

Icon mapping will use keyword matching on `shortForecast`:
- Contains "Sun" or "Clear" -> Sun icon
- Contains "Cloud" -> Cloud icon
- Contains "Rain" or "Shower" -> CloudRain icon
- Contains "Snow" -> CloudSnow icon
- Contains "Thunder" -> CloudLightning icon
- Fallback -> Wind icon

No new files or dependencies needed. The UI and tooltip behavior remain identical.

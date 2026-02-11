import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface WeatherDay {
  date: string;
  tempHigh: number;
  tempLow: number;
  shortForecast: string;
  precipitation: number;
}

const DFW_LAT = 32.7767;
const DFW_LON = -96.7970;
const NWS_USER_AGENT = '(KCSTracker, contact@example.com)';

interface WeatherWidgetProps {
  city?: string | null;
  state?: string | null;
}

export function WeatherWidget({ city, state }: WeatherWidgetProps) {
  const [forecast, setForecast] = useState<WeatherDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationLabel, setLocationLabel] = useState('DFW');

  useEffect(() => {
    fetchWeather();
  }, [city, state]);

  const resolveCoordinates = async (): Promise<{ lat: number; lon: number; label: string }> => {
    let lat = DFW_LAT;
    let lon = DFW_LON;
    let label = 'DFW';

    if (city) {
      label = state ? `${city}, ${state}` : city;
      try {
        const searchQuery = state ? `${city}, ${state}` : city;
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1`
        );
        const geoData = await geoRes.json();
        if (geoData.results?.[0]) {
          lat = geoData.results[0].latitude;
          lon = geoData.results[0].longitude;
        }
      } catch {
        // fall back to DFW
      }
    }

    return { lat, lon, label };
  };

  const fetchNWS = async (lat: number, lon: number): Promise<WeatherDay[] | null> => {
    try {
      const headers = { 'User-Agent': NWS_USER_AGENT, Accept: 'application/geo+json' };

      // Step 1: get grid point
      const pointRes = await fetch(
        `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
        { headers }
      );
      if (!pointRes.ok) return null;
      const pointData = await pointRes.json();
      const forecastUrl = pointData.properties?.forecast;
      if (!forecastUrl) return null;

      // Step 2: get forecast
      const forecastRes = await fetch(forecastUrl, { headers });
      if (!forecastRes.ok) return null;
      const forecastData = await forecastRes.json();
      const periods = forecastData.properties?.periods;
      if (!periods || periods.length === 0) return null;

      // Pair day/night periods into WeatherDay objects
      const days: WeatherDay[] = [];
      let i = 0;

      while (i < periods.length && days.length < 5) {
        const period = periods[i];

        if (period.isDaytime) {
          const nightPeriod = periods[i + 1]?.isDaytime === false ? periods[i + 1] : null;
          const precip = period.probabilityOfPrecipitation?.value || 0;

          // Build a date string from the period's startTime
          const dateStr = period.startTime.split('T')[0];

          days.push({
            date: dateStr,
            tempHigh: period.temperature,
            tempLow: nightPeriod ? nightPeriod.temperature : period.temperature - 15,
            shortForecast: period.shortForecast,
            precipitation: precip,
          });

          i += nightPeriod ? 2 : 1;
        } else {
          // First period is a night period (partial day) — skip it
          i += 1;
        }
      }

      return days.length > 0 ? days : null;
    } catch {
      return null;
    }
  };

  const fetchOpenMeteoFallback = async (lat: number, lon: number): Promise<WeatherDay[]> => {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&temperature_unit=fahrenheit&timezone=auto&forecast_days=5`
    );
    const data = await response.json();

    if (data.daily) {
      return data.daily.time.map((date: string, i: number) => ({
        date,
        tempHigh: Math.round(data.daily.temperature_2m_max[i]),
        tempLow: Math.round(data.daily.temperature_2m_min[i]),
        shortForecast: getOpenMeteoLabel(data.daily.weather_code[i]),
        precipitation: data.daily.precipitation_sum[i] || 0,
      }));
    }
    return [];
  };

  const getOpenMeteoLabel = (code: number): string => {
    if (code === 0) return 'Clear';
    if (code === 1) return 'Mainly Clear';
    if (code === 2) return 'Partly Cloudy';
    if (code === 3) return 'Overcast';
    if (code >= 45 && code <= 48) return 'Foggy';
    if (code >= 51 && code <= 55) return 'Drizzle';
    if (code >= 56 && code <= 57) return 'Freezing Drizzle';
    if (code >= 61 && code <= 65) return 'Rain';
    if (code >= 66 && code <= 67) return 'Freezing Rain';
    if (code >= 71 && code <= 75) return 'Snow';
    if (code === 77) return 'Snow Grains';
    if (code >= 80 && code <= 82) return 'Rain Showers';
    if (code >= 85 && code <= 86) return 'Snow Showers';
    if (code === 95) return 'Thunderstorm';
    if (code >= 96 && code <= 99) return 'Thunderstorm w/ Hail';
    return 'Unknown';
  };

  const fetchWeather = async () => {
    setLoading(true);
    const { lat, lon, label } = await resolveCoordinates();
    setLocationLabel(label);

    try {
      // Try NWS first
      const nwsDays = await fetchNWS(lat, lon);
      if (nwsDays) {
        setForecast(nwsDays);
        return;
      }

      // Fallback to Open-Meteo
      const omDays = await fetchOpenMeteoFallback(lat, lon);
      setForecast(omDays);
    } catch (error) {
      console.error('Failed to fetch weather:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('thunder')) return <CloudLightning className="h-4 w-4 text-amber-500" />;
    if (lower.includes('snow') || lower.includes('sleet') || lower.includes('ice')) return <CloudSnow className="h-4 w-4 text-blue-200" />;
    if (lower.includes('rain') || lower.includes('shower') || lower.includes('drizzle')) return <CloudRain className="h-4 w-4 text-blue-400" />;
    if (lower.includes('sun') || lower.includes('clear')) return <Sun className="h-4 w-4 text-amber-400" />;
    if (lower.includes('cloud') || lower.includes('overcast') || lower.includes('fog')) return <Cloud className="h-4 w-4 text-muted-foreground" />;
    return <Wind className="h-4 w-4 text-muted-foreground" />;
  };

  const formatDay = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const hasRainWarning = (day: WeatherDay) => {
    return day.precipitation > 35;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 bg-card rounded-lg px-3 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Loading weather...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-card rounded-lg px-2 py-1.5">
      <span className="text-[10px] text-muted-foreground font-medium truncate mb-0.5">{locationLabel}</span>
      <div className="flex items-center gap-1">
      {forecast.map((day) => (
        <Tooltip key={day.date}>
          <TooltipTrigger asChild>
            <div
              className={`flex flex-col items-center px-2 py-1 rounded cursor-pointer transition-colors ${
                hasRainWarning(day) ? 'bg-amber-500/10' : 'hover:bg-secondary'
              }`}
            >
              <span className="text-[10px] text-muted-foreground">{formatDay(day.date)}</span>
              {getWeatherIcon(day.shortForecast)}
              <span className="text-xs text-foreground font-medium">{day.tempHigh}°</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-card border-border">
            <div className="text-xs">
              <p className="font-medium text-foreground">{day.shortForecast}</p>
              <p className="text-muted-foreground">High: {day.tempHigh}°F / Low: {day.tempLow}°F</p>
              {day.precipitation > 35 && (
                <p className="text-amber-400">⚠️ {day.precipitation}% chance of precipitation</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      ))}
      </div>
    </div>
  );
}

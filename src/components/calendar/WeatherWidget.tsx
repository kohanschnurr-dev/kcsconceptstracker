import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface WeatherDay {
  date: string;
  tempHigh: number;
  tempLow: number;
  code: number;
  precipitation: number;
}

const DFW_LAT = 32.7767;
const DFW_LON = -96.7970;

export function WeatherWidget() {
  const [forecast, setForecast] = useState<WeatherDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${DFW_LAT}&longitude=${DFW_LON}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&temperature_unit=fahrenheit&timezone=America/Chicago&forecast_days=5`
      );
      const data = await response.json();
      
      if (data.daily) {
        const days: WeatherDay[] = data.daily.time.map((date: string, i: number) => ({
          date,
          tempHigh: Math.round(data.daily.temperature_2m_max[i]),
          tempLow: Math.round(data.daily.temperature_2m_min[i]),
          code: data.daily.weather_code[i],
          precipitation: data.daily.precipitation_sum[i] || 0,
        }));
        setForecast(days);
      }
    } catch (error) {
      console.error('Failed to fetch weather:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (code: number) => {
    // WMO Weather codes: https://open-meteo.com/en/docs
    if (code === 0 || code === 1) return <Sun className="h-4 w-4 text-amber-400" />;
    if (code >= 2 && code <= 3) return <Cloud className="h-4 w-4 text-slate-400" />;
    if (code >= 45 && code <= 48) return <Cloud className="h-4 w-4 text-slate-500" />;
    if (code >= 51 && code <= 67) return <CloudRain className="h-4 w-4 text-blue-400" />;
    if (code >= 71 && code <= 77) return <CloudSnow className="h-4 w-4 text-blue-200" />;
    if (code >= 80 && code <= 82) return <CloudRain className="h-4 w-4 text-blue-500" />;
    if (code >= 95 && code <= 99) return <CloudLightning className="h-4 w-4 text-amber-500" />;
    return <Wind className="h-4 w-4 text-slate-400" />;
  };

  const getWeatherLabel = (code: number) => {
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

  const formatDay = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const hasRainWarning = (day: WeatherDay) => day.precipitation > 0.1;

  if (loading) {
    return (
      <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        <span className="text-xs text-slate-400">Loading DFW weather...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-slate-800 rounded-lg px-2 h-9">
      <span className="text-xs text-slate-500 mr-1 hidden lg:block">DFW</span>
      {forecast.map((day, i) => (
        <Tooltip key={day.date}>
          <TooltipTrigger asChild>
            <div 
              className={`flex flex-col items-center px-2 py-1 rounded cursor-pointer transition-colors ${
                hasRainWarning(day) ? 'bg-amber-500/10' : 'hover:bg-slate-700'
              }`}
            >
              <span className="text-[10px] text-slate-500">{formatDay(day.date)}</span>
              {getWeatherIcon(day.code)}
              <span className="text-xs text-white font-medium">{day.tempHigh}°</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-slate-800 border-slate-700">
            <div className="text-xs">
              <p className="font-medium text-white">{getWeatherLabel(day.code)}</p>
              <p className="text-slate-400">High: {day.tempHigh}°F / Low: {day.tempLow}°F</p>
              {day.precipitation > 0 && (
                <p className="text-amber-400">⚠️ {day.precipitation.toFixed(1)}" precipitation expected</p>
              )}
              {hasRainWarning(day) && (
                <p className="text-amber-500 mt-1 font-medium">Delay concrete/roofing</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

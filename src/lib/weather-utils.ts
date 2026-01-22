import { Cloud, Sun, CloudRain, CloudSnow, Wind } from "lucide-react";

export type WeatherCondition = "sunny" | "cloudy" | "rainy" | "snowy" | "windy";

export interface WeatherDay {
  date: Date;
  temp: number;
  tempMin: number;
  tempMax: number;
  condition: WeatherCondition;
  wind: number;
  precipitation: number;
}

export const weatherIcons = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
  windy: Wind,
};

export const weatherLabels = {
  sunny: "Sol",
  cloudy: "Overskyet",
  rainy: "Regn",
  snowy: "Snø",
  windy: "Vind",
};

export const weatherColors = {
  sunny: "text-amber-500",
  cloudy: "text-muted-foreground",
  rainy: "text-blue-500",
  snowy: "text-blue-300",
  windy: "text-slate-500",
};

/**
 * Generate consistent fictional weather for a specific date
 * Uses date-based seed for deterministic results
 */
export function getWeatherForDate(date: Date): WeatherDay {
  const conditions: WeatherCondition[] = ["sunny", "cloudy", "rainy", "snowy", "windy"];
  
  // Create a seed from the date (year, month, day)
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  
  // Generate pseudo-random but consistent values based on date
  const tempBase = Math.sin(seed / 1000) * 5 - 2; // Winter temps in Norway
  const temp = Math.round(tempBase + (seed % 7) - 3);
  const conditionIndex = Math.abs(Math.floor(seed / 100) % 5);
  
  return {
    date,
    temp,
    tempMin: temp - Math.abs((seed % 4) + 1),
    tempMax: temp + Math.abs((seed % 3) + 1),
    condition: conditions[conditionIndex],
    wind: Math.abs((seed % 15) + 2),
    precipitation: conditionIndex === 2 ? Math.abs((seed % 10) + 1) : conditionIndex === 3 ? Math.abs((seed % 8)) : 0,
  };
}

/**
 * Generate weather for multiple consecutive days
 */
export function generateWeatherRange(startDate: Date, days: number): WeatherDay[] {
  const weatherData: WeatherDay[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    weatherData.push(getWeatherForDate(date));
  }
  
  return weatherData;
}

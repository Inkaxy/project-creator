import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Thermometer } from "lucide-react";
import { format, addDays } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface WeatherDay {
  date: Date;
  temp: number;
  tempMin: number;
  tempMax: number;
  condition: "sunny" | "cloudy" | "rainy" | "snowy" | "windy";
  wind: number;
  precipitation: number;
}

// Generate fictional weather data for demo purposes
function generateFictionalWeather(startDate: Date, days: number): WeatherDay[] {
  const conditions: WeatherDay["condition"][] = ["sunny", "cloudy", "rainy", "snowy", "windy"];
  const weatherData: WeatherDay[] = [];
  
  // Seed based on date for consistent results
  const baseSeed = startDate.getTime();
  
  for (let i = 0; i < days; i++) {
    const date = addDays(startDate, i);
    const daySeed = baseSeed + i * 12345;
    
    // Generate pseudo-random but consistent values
    const tempBase = Math.sin(daySeed / 1000000) * 5 - 2; // Winter temps in Norway
    const temp = Math.round(tempBase + (daySeed % 7) - 3);
    const conditionIndex = Math.abs(Math.floor(daySeed / 100000) % 5);
    
    weatherData.push({
      date,
      temp,
      tempMin: temp - Math.abs((daySeed % 4) + 1),
      tempMax: temp + Math.abs((daySeed % 3) + 1),
      condition: conditions[conditionIndex],
      wind: Math.abs((daySeed % 15) + 2),
      precipitation: conditionIndex === 2 ? Math.abs((daySeed % 10) + 1) : conditionIndex === 3 ? Math.abs((daySeed % 8)) : 0,
    });
  }
  
  return weatherData;
}

const weatherIcons = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
  windy: Wind,
};

const weatherLabels = {
  sunny: "Sol",
  cloudy: "Overskyet",
  rainy: "Regn",
  snowy: "Snø",
  windy: "Vind",
};

const weatherColors = {
  sunny: "text-amber-500",
  cloudy: "text-muted-foreground",
  rainy: "text-blue-500",
  snowy: "text-blue-300",
  windy: "text-slate-500",
};

interface WeatherForecastWidgetProps {
  startDate: Date;
  days?: number;
  compact?: boolean;
  className?: string;
}

export function WeatherForecastWidget({ 
  startDate, 
  days = 7, 
  compact = false,
  className 
}: WeatherForecastWidgetProps) {
  const weather = generateFictionalWeather(startDate, days);
  
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {weather.slice(0, 7).map((day, i) => {
          const Icon = weatherIcons[day.condition];
          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center gap-1 px-2 py-1 rounded hover:bg-accent/50 transition-colors cursor-default">
                  <span className="text-xs text-muted-foreground">
                    {format(day.date, "EEE", { locale: nb })}
                  </span>
                  <Icon className={cn("h-4 w-4", weatherColors[day.condition])} />
                  <span className="text-xs font-medium">{day.temp}°</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <p className="font-medium">{format(day.date, "EEEE d. MMMM", { locale: nb })}</p>
                  <p>{weatherLabels[day.condition]}</p>
                  <p>Min: {day.tempMin}° / Max: {day.tempMax}°</p>
                  <p>Vind: {day.wind} m/s</p>
                  {day.precipitation > 0 && <p>Nedbør: {day.precipitation} mm</p>}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        <Badge variant="outline" className="text-xs ml-2">
          Fiktiv
        </Badge>
      </div>
    );
  }
  
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Værmelding</span>
          </div>
          <Badge variant="outline" className="text-xs">Fiktiv</Badge>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weather.map((day, i) => {
            const Icon = weatherIcons[day.condition];
            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors cursor-default",
                    "hover:bg-accent/50",
                    i === 0 && "bg-accent/30"
                  )}>
                    <span className="text-xs text-muted-foreground font-medium">
                      {format(day.date, "EEE", { locale: nb })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(day.date, "d.", { locale: nb })}
                    </span>
                    <Icon className={cn("h-6 w-6 my-1", weatherColors[day.condition])} />
                    <span className="text-sm font-semibold">{day.temp}°</span>
                    <span className="text-xs text-muted-foreground">
                      {day.tempMin}° / {day.tempMax}°
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <p className="font-medium">{format(day.date, "EEEE d. MMMM", { locale: nb })}</p>
                    <p>{weatherLabels[day.condition]}</p>
                    <p>Vind: {day.wind} m/s</p>
                    {day.precipitation > 0 && <p>Nedbør: {day.precipitation} mm</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

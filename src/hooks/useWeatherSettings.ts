import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useWeatherSettings() {
  return useQuery({
    queryKey: ["weather_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timesheet_settings")
        .select("show_weather_forecast")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data?.show_weather_forecast ?? true;
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TemperatureUnit {
  id: string;
  name: string;
  location: string | null;
  min_temp: number;
  max_temp: number;
  sensor_id: string | null;
  is_iot: boolean | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface TemperatureLog {
  id: string;
  unit_id: string;
  temperature: number;
  logged_by: string | null;
  logged_at: string;
  is_deviation: boolean | null;
  deviation_action: string | null;
  source: string | null;
  created_at: string;
  temperature_units?: TemperatureUnit;
  profiles?: { id: string; full_name: string };
}

// Fetch all active temperature units
export function useTemperatureUnits() {
  return useQuery({
    queryKey: ["temperature-units"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("temperature_units")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as TemperatureUnit[];
    },
  });
}

// Fetch temperature logs with optional filters
export function useTemperatureLogs(unitId?: string, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ["temperature-logs", unitId, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from("temperature_logs")
        .select(`
          *,
          temperature_units (id, name, location, min_temp, max_temp),
          profiles (id, full_name)
        `)
        .order("logged_at", { ascending: false })
        .limit(100);

      if (unitId) {
        query = query.eq("unit_id", unitId);
      }
      if (dateFrom) {
        query = query.gte("logged_at", dateFrom);
      }
      if (dateTo) {
        query = query.lte("logged_at", dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as TemperatureLog[];
    },
  });
}

// Get today's logs for dashboard
export function useTodayTemperatureLogs() {
  const today = new Date().toISOString().split("T")[0];
  return useTemperatureLogs(undefined, `${today}T00:00:00`, `${today}T23:59:59`);
}

// Log a temperature reading
export function useLogTemperature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      unitId,
      temperature,
      userId,
      deviationAction,
    }: {
      unitId: string;
      temperature: number;
      userId: string;
      deviationAction?: string;
    }) => {
      // Get unit to check if it's a deviation
      const { data: unit } = await supabase
        .from("temperature_units")
        .select("min_temp, max_temp")
        .eq("id", unitId)
        .single();

      const isDeviation = unit
        ? temperature < unit.min_temp || temperature > unit.max_temp
        : false;

      const { data, error } = await supabase
        .from("temperature_logs")
        .insert({
          unit_id: unitId,
          temperature,
          logged_by: userId,
          is_deviation: isDeviation,
          deviation_action: isDeviation ? deviationAction : null,
          source: "manual",
        })
        .select()
        .single();

      if (error) throw error;
      return { ...data, isDeviation };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["temperature-logs"] });
      if (data.isDeviation) {
        toast.warning("Temperaturavvik registrert!");
      } else {
        toast.success("Temperatur logget");
      }
    },
    onError: (error) => {
      toast.error("Kunne ikke logge temperatur: " + error.message);
    },
  });
}

// Admin: Create temperature unit
export function useCreateTemperatureUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<TemperatureUnit> & { name: string }) => {
      const { data: unit, error } = await supabase
        .from("temperature_units")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return unit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["temperature-units"] });
      toast.success("Temperaturenhet opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette enhet: " + error.message);
    },
  });
}

// Admin: Update temperature unit
export function useUpdateTemperatureUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<TemperatureUnit> & { id: string }) => {
      const { error } = await supabase
        .from("temperature_units")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["temperature-units"] });
      toast.success("Temperaturenhet oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere enhet: " + error.message);
    },
  });
}

// Get deviation count for dashboard
export function useTemperatureDeviationsToday() {
  const today = new Date().toISOString().split("T")[0];
  
  return useQuery({
    queryKey: ["temperature-deviations-today"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("temperature_logs")
        .select("*", { count: "exact", head: true })
        .eq("is_deviation", true)
        .gte("logged_at", `${today}T00:00:00`)
        .lte("logged_at", `${today}T23:59:59`);

      if (error) throw error;
      return count || 0;
    },
  });
}

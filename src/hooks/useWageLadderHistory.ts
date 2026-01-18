import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WageLadderHistoryEntry {
  id: string;
  ladder_id: string;
  level: number;
  old_hourly_rate: number | null;
  new_hourly_rate: number;
  effective_from: string;
  created_at: string;
  created_by: string | null;
  wage_ladders?: {
    id: string;
    name: string;
  };
  profiles?: {
    id: string;
    full_name: string;
  } | null;
}

// Fetch all wage ladder history with ladder info
export function useWageLadderHistory(ladderId?: string) {
  return useQuery({
    queryKey: ["wage-ladder-history", ladderId],
    queryFn: async () => {
      let query = supabase
        .from("wage_ladder_history")
        .select(`
          *,
          wage_ladders(id, name),
          profiles!wage_ladder_history_created_by_fkey(id, full_name)
        `)
        .order("created_at", { ascending: false });

      if (ladderId) {
        query = query.eq("ladder_id", ladderId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as WageLadderHistoryEntry[];
    },
  });
}

// Get history for a specific level
export function useWageLadderLevelHistory(ladderId: string, level: number) {
  return useQuery({
    queryKey: ["wage-ladder-history", ladderId, level],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wage_ladder_history")
        .select(`
          *,
          profiles!wage_ladder_history_created_by_fkey(id, full_name)
        `)
        .eq("ladder_id", ladderId)
        .eq("level", level)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WageLadderHistoryEntry[];
    },
    enabled: !!ladderId && level > 0,
  });
}

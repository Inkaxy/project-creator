import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WageLadderLevel {
  id: string;
  ladder_id: string;
  level: number;
  min_hours: number;
  max_hours: number | null;
  hourly_rate: number;
  effective_from: string | null;
  created_at: string;
}

export interface WageLadder {
  id: string;
  name: string;
  description: string | null;
  competence_level: "ufaglaert" | "faglaert" | "laerling";
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
  levels?: WageLadderLevel[];
}

export interface CreateWageLadderInput {
  name: string;
  description?: string;
  competence_level: "ufaglaert" | "faglaert" | "laerling";
}

export interface CreateWageLadderLevelInput {
  ladder_id: string;
  level: number;
  min_hours: number;
  max_hours?: number | null;
  hourly_rate: number;
  effective_from?: string;
}

export function useWageLadders() {
  return useQuery({
    queryKey: ["wage-ladders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wage_ladders")
        .select(`
          *,
          levels:wage_ladder_levels (
            id,
            ladder_id,
            level,
            min_hours,
            max_hours,
            hourly_rate,
            effective_from,
            created_at
          )
        `)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      
      // Sort levels by level number
      return (data as WageLadder[]).map(ladder => ({
        ...ladder,
        levels: ladder.levels?.sort((a, b) => a.level - b.level) || [],
      }));
    },
  });
}

export function useWageLadder(ladderId?: string) {
  return useQuery({
    queryKey: ["wage-ladders", ladderId],
    queryFn: async () => {
      if (!ladderId) return null;

      const { data, error } = await supabase
        .from("wage_ladders")
        .select(`
          *,
          levels:wage_ladder_levels (
            id,
            ladder_id,
            level,
            min_hours,
            max_hours,
            hourly_rate,
            effective_from,
            created_at
          )
        `)
        .eq("id", ladderId)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        levels: data.levels?.sort((a: WageLadderLevel, b: WageLadderLevel) => a.level - b.level) || [],
      } as WageLadder;
    },
    enabled: !!ladderId,
  });
}

export function useCreateWageLadder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateWageLadderInput) => {
      const { data, error } = await supabase
        .from("wage_ladders")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wage-ladders"] });
      toast.success("Lønnsstige opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette lønnsstige: " + error.message);
    },
  });
}

export function useUpdateWageLadder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<CreateWageLadderInput>) => {
      const { data, error } = await supabase
        .from("wage_ladders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wage-ladders"] });
      toast.success("Lønnsstige oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere lønnsstige: " + error.message);
    },
  });
}

export function useDeleteWageLadder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("wage_ladders")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wage-ladders"] });
      toast.success("Lønnsstige slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette lønnsstige: " + error.message);
    },
  });
}

export function useCreateWageLadderLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateWageLadderLevelInput) => {
      const { data, error } = await supabase
        .from("wage_ladder_levels")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wage-ladders"] });
      toast.success("Nivå lagt til");
    },
    onError: (error) => {
      toast.error("Kunne ikke legge til nivå: " + error.message);
    },
  });
}

export function useUpdateWageLadderLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<CreateWageLadderLevelInput>) => {
      const { data, error } = await supabase
        .from("wage_ladder_levels")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wage-ladders"] });
      toast.success("Nivå oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere nivå: " + error.message);
    },
  });
}

export function useDeleteWageLadderLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("wage_ladder_levels")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wage-ladders"] });
      toast.success("Nivå slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette nivå: " + error.message);
    },
  });
}

// Utility to calculate current hourly rate based on accumulated hours
export function calculateCurrentLevel(ladder: WageLadder, accumulatedHours: number): {
  level: number;
  hourlyRate: number;
  nextLevel: number | null;
  hoursToNextLevel: number | null;
  nextHourlyRate: number | null;
} {
  const levels = ladder.levels || [];
  if (levels.length === 0) {
    return {
      level: 1,
      hourlyRate: 0,
      nextLevel: null,
      hoursToNextLevel: null,
      nextHourlyRate: null,
    };
  }

  // Find current level
  let currentLevel = levels[0];
  for (const level of levels) {
    if (accumulatedHours >= level.min_hours) {
      if (level.max_hours === null || accumulatedHours < level.max_hours) {
        currentLevel = level;
        break;
      }
      currentLevel = level;
    }
  }

  // Find next level
  const nextLevelIndex = levels.findIndex(l => l.level === currentLevel.level) + 1;
  const nextLevel = nextLevelIndex < levels.length ? levels[nextLevelIndex] : null;

  return {
    level: currentLevel.level,
    hourlyRate: currentLevel.hourly_rate,
    nextLevel: nextLevel?.level || null,
    hoursToNextLevel: nextLevel ? nextLevel.min_hours - accumulatedHours : null,
    nextHourlyRate: nextLevel?.hourly_rate || null,
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { IndustrivernExercise, ExerciseType, IndustrivernRole } from "@/types/industrivern";

export function useIndustrivernExercises(status?: string) {
  return useQuery({
    queryKey: ["industrivern-exercises", status],
    queryFn: async () => {
      let query = supabase
        .from("industrivern_exercises")
        .select("*")
        .order("planned_date", { ascending: true });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as IndustrivernExercise[];
    },
  });
}

export function useUpcomingExercises(limit = 5) {
  return useQuery({
    queryKey: ["industrivern-exercises", "upcoming", limit],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("industrivern_exercises")
        .select("*")
        .eq("status", "planned")
        .gte("planned_date", today)
        .order("planned_date", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as IndustrivernExercise[];
    },
  });
}

export function useIndustrivernExercise(id: string) {
  return useQuery({
    queryKey: ["industrivern-exercises", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("industrivern_exercises")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as IndustrivernExercise;
    },
    enabled: !!id,
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exercise: {
      title: string;
      description?: string;
      exercise_type: ExerciseType;
      planned_date: string;
      planned_start?: string;
      planned_end?: string;
      location?: string;
      incident_scenario?: string;
      learning_objectives?: string[];
      target_roles?: IndustrivernRole[];
      external_participants?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("industrivern_exercises")
        .insert({
          ...exercise,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["industrivern-exercises"] });
      toast.success("Øvelse opprettet");
    },
    onError: (error) => {
      console.error("Error creating exercise:", error);
      toast.error("Kunne ikke opprette øvelse");
    },
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<IndustrivernExercise> & { id: string }) => {
      const { data, error } = await supabase
        .from("industrivern_exercises")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["industrivern-exercises"] });
      toast.success("Øvelse oppdatert");
    },
    onError: (error) => {
      console.error("Error updating exercise:", error);
      toast.error("Kunne ikke oppdatere øvelse");
    },
  });
}

export function useCompleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      actual_date,
      actual_start,
      actual_end,
    }: {
      id: string;
      actual_date: string;
      actual_start?: string;
      actual_end?: string;
    }) => {
      const { data, error } = await supabase
        .from("industrivern_exercises")
        .update({
          status: "completed",
          actual_date,
          actual_start,
          actual_end,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["industrivern-exercises"] });
      toast.success("Øvelse markert som gjennomført");
    },
    onError: (error) => {
      console.error("Error completing exercise:", error);
      toast.error("Kunne ikke fullføre øvelse");
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("industrivern_exercises")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["industrivern-exercises"] });
      toast.success("Øvelse slettet");
    },
    onError: (error) => {
      console.error("Error deleting exercise:", error);
      toast.error("Kunne ikke slette øvelse");
    },
  });
}

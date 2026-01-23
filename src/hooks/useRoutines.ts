import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Routine {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  icon: string | null;
  department_id: string | null;
  function_id: string | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  departments?: { id: string; name: string } | null;
  functions?: { id: string; name: string; color: string | null } | null;
  routine_items?: RoutineItem[];
}

export interface RoutineItem {
  id: string;
  routine_id: string;
  title: string;
  description: string | null;
  is_critical: boolean | null;
  sort_order: number | null;
  created_at: string;
}

export interface RoutineCompletion {
  id: string;
  routine_id: string;
  completed_by: string;
  completed_at: string;
  completion_date: string;
  notes: string | null;
  shift_id: string | null;
  routines?: Routine;
  profiles?: { id: string; full_name: string };
}

// Fetch all active routines
export function useRoutines(departmentId?: string | null) {
  return useQuery({
    queryKey: ["routines", departmentId],
    queryFn: async () => {
      let query = supabase
        .from("routines")
        .select(`
          *,
          departments (id, name),
          functions (id, name, color),
          routine_items (*)
        `)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (departmentId) {
        query = query.eq("department_id", departmentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Routine[];
    },
  });
}

// Fetch all routines (including inactive)
export function useAllRoutines() {
  return useQuery({
    queryKey: ["routines", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routines")
        .select(`
          *,
          departments (id, name),
          functions (id, name, color),
          routine_items (*)
        `)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Routine[];
    },
  });
}

// Fetch completions for a specific date
export function useRoutineCompletions(date: string) {
  return useQuery({
    queryKey: ["routine-completions", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routine_completions")
        .select(`
          *,
          routines (*)
        `)
        .eq("completion_date", date);

      if (error) throw error;
      return data as unknown as RoutineCompletion[];
    },
  });
}

// Create a new routine
export function useCreateRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      frequency?: string;
      icon?: string;
      department_id?: string;
      function_id?: string;
      items?: { title: string; description?: string; is_critical?: boolean }[];
    }) => {
      const { items, ...routineData } = input;

      // Create routine
      const { data: routine, error: routineError } = await supabase
        .from("routines")
        .insert(routineData)
        .select()
        .single();

      if (routineError) throw routineError;

      // Create items if provided
      if (items && items.length > 0) {
        const itemsToInsert = items.map((item, index) => ({
          ...item,
          routine_id: routine.id,
          sort_order: index,
        }));

        const { error: itemsError } = await supabase
          .from("routine_items")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      return routine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      toast.success("Rutine opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette rutine: " + error.message);
    },
  });
}

// Update a routine
export function useUpdateRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      description?: string;
      frequency?: string;
      icon?: string;
      department_id?: string | null;
      function_id?: string | null;
      is_active?: boolean;
    }) => {
      const { id, ...updateData } = input;

      const { error } = await supabase
        .from("routines")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      toast.success("Rutine oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere rutine: " + error.message);
    },
  });
}

// Delete a routine
export function useDeleteRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routineId: string) => {
      const { error } = await supabase
        .from("routines")
        .delete()
        .eq("id", routineId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      toast.success("Rutine slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette rutine: " + error.message);
    },
  });
}

// Complete a routine
export function useCompleteRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      routine_id: string;
      notes?: string;
      shift_id?: string;
    }) => {
      const { data: completion, error: completionError } = await supabase
        .from("routine_completions")
        .insert(input as any)
        .select()
        .single();

      if (completionError) throw completionError;
      return completion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routine-completions"] });
      toast.success("Rutine fullført");
    },
    onError: (error) => {
      toast.error("Kunne ikke fullføre rutine: " + error.message);
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FunctionData {
  id: string;
  name: string;
  short_name: string | null;
  category: string | null;
  department_id: string | null;
  color: string | null;
  icon: string | null;
  default_start: string | null;
  default_end: string | null;
  default_break_minutes: number | null;
  min_staff: number | null;
  max_staff: number | null;
  sort_order: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
  departments?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateFunctionInput {
  name: string;
  short_name?: string;
  category?: string;
  department_id?: string;
  color?: string;
  icon?: string;
  default_start?: string;
  default_end?: string;
  default_break_minutes?: number;
  min_staff?: number;
  max_staff?: number;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateFunctionInput extends Partial<CreateFunctionInput> {
  id: string;
}

export function useFunctions() {
  return useQuery({
    queryKey: ["functions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("functions")
        .select(`
          *,
          departments (
            id,
            name
          )
        `)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as FunctionData[];
    },
  });
}

export function useAllFunctions() {
  return useQuery({
    queryKey: ["functions", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("functions")
        .select(`
          *,
          departments (
            id,
            name
          )
        `)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as FunctionData[];
    },
  });
}

export function useCreateFunction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFunctionInput) => {
      const { data, error } = await supabase
        .from("functions")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["functions"] });
      toast.success("Funksjon opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette funksjon: " + error.message);
    },
  });
}

export function useUpdateFunction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateFunctionInput) => {
      const { data, error } = await supabase
        .from("functions")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["functions"] });
      toast.success("Funksjon oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere funksjon: " + error.message);
    },
  });
}

export function useDeleteFunction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from("functions")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["functions"] });
      toast.success("Funksjon slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette funksjon: " + error.message);
    },
  });
}

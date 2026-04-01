import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DeviationType {
  id: string;
  name: string;
  code: string;
  salary_type_id: string | null;
  color: string;
  sort_order: number;
  is_active: boolean;
  is_system: boolean;
  affects_time_bank: boolean;
  created_at: string;
  updated_at: string;
}

export function useDeviationTypes(activeOnly = true) {
  return useQuery({
    queryKey: ["deviation-types", activeOnly],
    queryFn: async () => {
      let query = supabase
        .from("deviation_types")
        .select("*")
        .order("sort_order")
        .order("name");

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DeviationType[];
    },
  });
}

export function useCreateDeviationType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<DeviationType, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("deviation_types")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deviation-types"] });
      toast.success("Avvikstype opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette avvikstype: " + error.message);
    },
  });
}

export function useUpdateDeviationType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<DeviationType> & { id: string }) => {
      const { error } = await supabase
        .from("deviation_types")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deviation-types"] });
      toast.success("Avvikstype oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere avvikstype: " + error.message);
    },
  });
}

export function useDeleteDeviationType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("deviation_types")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deviation-types"] });
      toast.success("Avvikstype slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette avvikstype: " + error.message);
    },
  });
}

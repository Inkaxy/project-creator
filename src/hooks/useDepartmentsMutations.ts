import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CreateDepartmentInput {
  name: string;
  color?: string;
  icon?: string;
  location_id?: string | null;
}

export interface UpdateDepartmentInput {
  id: string;
  name?: string;
  color?: string;
  icon?: string;
  location_id?: string | null;
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDepartmentInput) => {
      const { data, error } = await supabase
        .from("departments")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Avdeling opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette avdeling: " + error.message);
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateDepartmentInput) => {
      const { data, error } = await supabase
        .from("departments")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["functions"] });
      toast.success("Avdeling oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere avdeling: " + error.message);
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["functions"] });
      toast.success("Avdeling slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette avdeling: " + error.message);
    },
  });
}

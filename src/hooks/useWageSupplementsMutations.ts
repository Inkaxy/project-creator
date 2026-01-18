import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UpdateSupplementInput {
  id: string;
  name?: string;
  description?: string;
  supplement_type?: "percentage" | "fixed";
  amount?: number;
  applies_to?: "night" | "weekend" | "holiday" | "evening";
  time_start?: string | null;
  time_end?: string | null;
  is_active?: boolean;
  priority?: number;
}

export interface CreateSupplementInput {
  name: string;
  description?: string;
  supplement_type: "percentage" | "fixed";
  amount: number;
  applies_to: "night" | "weekend" | "holiday" | "evening";
  time_start?: string | null;
  time_end?: string | null;
  priority?: number;
}

export function useUpdateWageSupplement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateSupplementInput) => {
      const { data, error } = await supabase
        .from("wage_supplements")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wage_supplements"] });
      toast.success("Tillegg oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere tillegg: " + error.message);
    },
  });
}

export function useCreateWageSupplement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSupplementInput) => {
      const { data, error } = await supabase
        .from("wage_supplements")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wage_supplements"] });
      toast.success("Tillegg opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette tillegg: " + error.message);
    },
  });
}

export function useDeleteWageSupplement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("wage_supplements")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wage_supplements"] });
      toast.success("Tillegg slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette tillegg: " + error.message);
    },
  });
}

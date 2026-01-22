import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EquipmentCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  requires_temp_monitoring: boolean | null;
  requires_certification: boolean | null;
  default_service_interval_days: number | null;
  created_at: string;
}

export function useEquipmentCategories() {
  return useQuery({
    queryKey: ["equipment_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as EquipmentCategory[];
    },
  });
}

export function useCreateEquipmentCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: { name: string; icon?: string; color?: string; requires_temp_monitoring?: boolean; requires_certification?: boolean; default_service_interval_days?: number }) => {
      const { data, error } = await supabase
        .from("equipment_categories")
        .insert(category)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment_categories"] });
    },
  });
}

export function useUpdateEquipmentCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EquipmentCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from("equipment_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment_categories"] });
    },
  });
}

export function useDeleteEquipmentCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("equipment_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment_categories"] });
    },
  });
}

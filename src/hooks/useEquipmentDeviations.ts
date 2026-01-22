import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EquipmentDeviation {
  id: string;
  equipment_id: string;
  reported_by: string;
  assigned_to: string | null;
  severity: string;
  status: string;
  title: string;
  description: string | null;
  images: string[];
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  cost: number | null;
  created_at: string;
  updated_at: string;
  // Joined data
  equipment?: { id: string; name: string; category?: { name: string; icon: string } } | null;
  reporter?: { id: string; full_name: string } | null;
  assignee?: { id: string; full_name: string } | null;
  resolver?: { id: string; full_name: string } | null;
}

export function useEquipmentDeviations(equipmentId?: string | null, status?: string) {
  return useQuery({
    queryKey: ["equipment_deviations", equipmentId, status],
    queryFn: async () => {
      let query = supabase
        .from("equipment_deviations")
        .select(`
          *,
          equipment:equipment(id, name, category:equipment_categories(name, icon)),
          reporter:profiles!equipment_deviations_reported_by_fkey(id, full_name),
          assignee:profiles!equipment_deviations_assigned_to_fkey(id, full_name),
          resolver:profiles!equipment_deviations_resolved_by_fkey(id, full_name)
        `)
        .order("created_at", { ascending: false });

      if (equipmentId) {
        query = query.eq("equipment_id", equipmentId);
      }
      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EquipmentDeviation[];
    },
  });
}

export function useEquipmentDeviation(id: string | null) {
  return useQuery({
    queryKey: ["equipment_deviation", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("equipment_deviations")
        .select(`
          *,
          equipment:equipment(id, name, category:equipment_categories(name, icon)),
          reporter:profiles!equipment_deviations_reported_by_fkey(id, full_name),
          assignee:profiles!equipment_deviations_assigned_to_fkey(id, full_name),
          resolver:profiles!equipment_deviations_resolved_by_fkey(id, full_name)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as EquipmentDeviation;
    },
    enabled: !!id,
  });
}

export function useCreateEquipmentDeviation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (deviation: { equipment_id: string; reported_by: string; title: string; severity?: string; description?: string; images?: string[] }) => {
      const { data, error } = await supabase
        .from("equipment_deviations")
        .insert(deviation)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["equipment_deviations"] });
      queryClient.invalidateQueries({ queryKey: ["equipment_deviations", variables.equipment_id] });
      queryClient.invalidateQueries({ queryKey: ["equipment", "stats"] });
    },
  });
}

export function useUpdateEquipmentDeviation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EquipmentDeviation> & { id: string }) => {
      const { data, error } = await supabase
        .from("equipment_deviations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment_deviations"] });
      queryClient.invalidateQueries({ queryKey: ["equipment_deviation"] });
      queryClient.invalidateQueries({ queryKey: ["equipment", "stats"] });
    },
  });
}

export function useResolveEquipmentDeviation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, resolution, resolved_by, cost }: { id: string; resolution: string; resolved_by: string; cost?: number }) => {
      const { data, error } = await supabase
        .from("equipment_deviations")
        .update({
          status: "resolved",
          resolution,
          resolved_by,
          resolved_at: new Date().toISOString(),
          cost,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment_deviations"] });
      queryClient.invalidateQueries({ queryKey: ["equipment_deviation"] });
      queryClient.invalidateQueries({ queryKey: ["equipment", "stats"] });
    },
  });
}

// Open deviations count for dashboard
export function useOpenEquipmentDeviationsCount() {
  return useQuery({
    queryKey: ["equipment_deviations", "open_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("equipment_deviations")
        .select("*", { count: "exact", head: true })
        .in("status", ["new", "in_review", "action_planned", "in_progress"]);
      if (error) throw error;
      return count || 0;
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EquipmentServiceInterval {
  id: string;
  equipment_id: string;
  name: string;
  interval_type: string;
  interval_value: number;
  last_performed: string | null;
  next_due: string | null;
  alert_days_before: number;
  is_active: boolean;
  created_at: string;
}

export interface EquipmentService {
  id: string;
  equipment_id: string;
  service_interval_id: string | null;
  service_type: string;
  performed_by_employee_id: string | null;
  performed_by_external: string | null;
  supplier_id: string | null;
  performed_date: string;
  description: string | null;
  parts_replaced: string | null;
  cost_labor: number | null;
  cost_parts: number | null;
  invoice_number: string | null;
  next_service_date: string | null;
  attachments: unknown[];
  created_at: string;
  // Joined data
  performed_by?: { id: string; full_name: string } | null;
  supplier?: { id: string; name: string } | null;
  service_interval?: { id: string; name: string } | null;
}

export function useEquipmentServiceIntervals(equipmentId: string | null) {
  return useQuery({
    queryKey: ["equipment_service_intervals", equipmentId],
    queryFn: async () => {
      if (!equipmentId) return [];
      const { data, error } = await supabase
        .from("equipment_service_intervals")
        .select("*")
        .eq("equipment_id", equipmentId)
        .order("name");
      if (error) throw error;
      return data as EquipmentServiceInterval[];
    },
    enabled: !!equipmentId,
  });
}

export function useEquipmentServices(equipmentId: string | null) {
  return useQuery({
    queryKey: ["equipment_services", equipmentId],
    queryFn: async () => {
      if (!equipmentId) return [];
      const { data, error } = await supabase
        .from("equipment_services")
        .select(`
          *,
          performed_by:profiles(id, full_name),
          supplier:equipment_suppliers(id, name),
          service_interval:equipment_service_intervals(id, name)
        `)
        .eq("equipment_id", equipmentId)
        .order("performed_date", { ascending: false });
      if (error) throw error;
      return data as EquipmentService[];
    },
    enabled: !!equipmentId,
  });
}

export function useCreateServiceInterval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (interval: { equipment_id: string; name: string; interval_type: string; interval_value: number; next_due?: string; alert_days_before?: number }) => {
      const { data, error } = await supabase
        .from("equipment_service_intervals")
        .insert(interval)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["equipment_service_intervals", variables.equipment_id] });
    },
  });
}

export function useUpdateServiceInterval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EquipmentServiceInterval> & { id: string }) => {
      const { data, error } = await supabase
        .from("equipment_service_intervals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment_service_intervals"] });
    },
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (service: { equipment_id: string; service_type: string; performed_date: string; service_interval_id?: string; performed_by_employee_id?: string; performed_by_external?: string; supplier_id?: string; description?: string; parts_replaced?: string; cost_labor?: number; cost_parts?: number; invoice_number?: string; next_service_date?: string }) => {
      const { data, error } = await supabase
        .from("equipment_services")
        .insert(service)
        .select()
        .single();
      if (error) throw error;
      
      // Update the service interval if linked
      if (service.service_interval_id && service.next_service_date) {
        await supabase
          .from("equipment_service_intervals")
          .update({
            last_performed: service.performed_date,
            next_due: service.next_service_date,
          })
          .eq("id", service.service_interval_id);
      }
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["equipment_services", variables.equipment_id] });
      queryClient.invalidateQueries({ queryKey: ["equipment_service_intervals", variables.equipment_id] });
      queryClient.invalidateQueries({ queryKey: ["equipment", "stats"] });
    },
  });
}

// Get upcoming services across all equipment
export function useUpcomingServices(daysAhead: number = 30) {
  return useQuery({
    queryKey: ["equipment_services", "upcoming", daysAhead],
    queryFn: async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);
      
      const { data, error } = await supabase
        .from("equipment_service_intervals")
        .select(`
          *,
          equipment:equipment(id, name, category:equipment_categories(name, icon, color))
        `)
        .eq("is_active", true)
        .lte("next_due", futureDate.toISOString().split("T")[0])
        .order("next_due");
      if (error) throw error;
      return data;
    },
  });
}

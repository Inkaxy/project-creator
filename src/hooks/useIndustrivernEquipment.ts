import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { IndustrivernEquipment, IVEquipmentCategory } from "@/types/industrivern";

export function useIndustrivernEquipment(category?: IVEquipmentCategory) {
  return useQuery({
    queryKey: ["industrivern-equipment", category],
    queryFn: async () => {
      let query = supabase
        .from("industrivern_equipment")
        .select("*")
        .order("category")
        .order("name");

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as IndustrivernEquipment[];
    },
  });
}

export function useEquipmentByStatus(status: IndustrivernEquipment["status"]) {
  return useQuery({
    queryKey: ["industrivern-equipment", "status", status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("industrivern_equipment")
        .select("*")
        .eq("status", status)
        .order("next_inspection_date");

      if (error) throw error;
      return data as IndustrivernEquipment[];
    },
  });
}

export function useEquipmentDueForInspection(daysAhead = 30) {
  return useQuery({
    queryKey: ["industrivern-equipment", "due-inspection", daysAhead],
    queryFn: async () => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysAhead);
      
      const { data, error } = await supabase
        .from("industrivern_equipment")
        .select("*")
        .not("next_inspection_date", "is", null)
        .lte("next_inspection_date", futureDate.toISOString().split("T")[0])
        .order("next_inspection_date");

      if (error) throw error;
      return data as IndustrivernEquipment[];
    },
  });
}

export function useEquipmentStats() {
  return useQuery({
    queryKey: ["industrivern-equipment", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("industrivern_equipment")
        .select("status, category");

      if (error) throw error;

      const stats = {
        total: data.length,
        ok: data.filter(e => e.status === "ok").length,
        needsInspection: data.filter(e => e.status === "needs_inspection").length,
        needsService: data.filter(e => e.status === "needs_service").length,
        defective: data.filter(e => e.status === "defective").length,
        retired: data.filter(e => e.status === "retired").length,
        byCategory: {} as Record<string, number>,
      };

      data.forEach(e => {
        stats.byCategory[e.category] = (stats.byCategory[e.category] || 0) + 1;
      });

      return stats;
    },
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipment: {
      category: IVEquipmentCategory;
      equipment_type: string;
      name: string;
      serial_number?: string;
      inventory_number?: string;
      location: string;
      location_details?: string;
      status?: IndustrivernEquipment["status"];
      inspection_interval_months?: number;
      last_inspection_date?: string;
      next_inspection_date?: string;
      assigned_to?: string;
    }) => {
      const { data, error } = await supabase
        .from("industrivern_equipment")
        .insert({
          ...equipment,
          status: equipment.status || "ok",
          inspection_interval_months: equipment.inspection_interval_months || 12,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["industrivern-equipment"] });
      toast.success("Utstyr lagt til");
    },
    onError: (error) => {
      console.error("Error creating equipment:", error);
      toast.error("Kunne ikke legge til utstyr");
    },
  });
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<IndustrivernEquipment> & { id: string }) => {
      const { data, error } = await supabase
        .from("industrivern_equipment")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["industrivern-equipment"] });
      toast.success("Utstyr oppdatert");
    },
    onError: (error) => {
      console.error("Error updating equipment:", error);
      toast.error("Kunne ikke oppdatere utstyr");
    },
  });
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("industrivern_equipment")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["industrivern-equipment"] });
      toast.success("Utstyr slettet");
    },
    onError: (error) => {
      console.error("Error deleting equipment:", error);
      toast.error("Kunne ikke slette utstyr");
    },
  });
}

export function useRecordInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      equipment_id,
      inspection_date,
      status,
      notes,
      inspected_by,
    }: {
      equipment_id: string;
      inspection_date: string;
      status: IndustrivernEquipment["status"];
      notes?: string;
      inspected_by: string;
    }) => {
      // Get equipment to calculate next inspection
      const { data: equipment } = await supabase
        .from("industrivern_equipment")
        .select("inspection_interval_months")
        .eq("id", equipment_id)
        .single();

      const intervalMonths = equipment?.inspection_interval_months || 12;
      const nextDate = new Date(inspection_date);
      nextDate.setMonth(nextDate.getMonth() + intervalMonths);

      const passed = status === "ok";

      // Record inspection
      await supabase
        .from("iv_equipment_inspections")
        .insert({
          equipment_id,
          inspection_date,
          inspection_type: "routine",
          passed,
          findings: notes || null,
          inspected_by,
        });

      // Update equipment status and dates
      const { data, error } = await supabase
        .from("industrivern_equipment")
        .update({
          status,
          last_inspection_date: inspection_date,
          next_inspection_date: nextDate.toISOString().split("T")[0],
        })
        .eq("id", equipment_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["industrivern-equipment"] });
      toast.success("Kontroll registrert");
    },
    onError: (error) => {
      console.error("Error recording inspection:", error);
      toast.error("Kunne ikke registrere kontroll");
    },
  });
}

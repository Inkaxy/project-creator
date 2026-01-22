import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Supplier {
  id: string;
  name: string;
  org_number: string | null;
  address: string | null;
  phone_main: string | null;
  phone_service: string | null;
  phone_emergency: string | null;
  email: string | null;
  email_service: string | null;
  website: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  customer_number: string | null;
  sla_response_hours: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  // Computed
  equipment_count?: number;
}

export function useSuppliers() {
  return useQuery({
    queryKey: ["equipment_suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment_suppliers")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      
      // Get equipment count per supplier
      const { data: equipmentCounts } = await supabase
        .from("equipment")
        .select("supplier_id")
        .not("supplier_id", "is", null);
      
      const countMap = new Map<string, number>();
      equipmentCounts?.forEach((e) => {
        if (e.supplier_id) {
          countMap.set(e.supplier_id, (countMap.get(e.supplier_id) || 0) + 1);
        }
      });
      
      return data.map((supplier) => ({
        ...supplier,
        equipment_count: countMap.get(supplier.id) || 0,
      })) as Supplier[];
    },
  });
}

export function useSupplier(id: string | null) {
  return useQuery({
    queryKey: ["equipment_supplier", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("equipment_suppliers")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Supplier;
    },
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (supplier: { name: string; org_number?: string; address?: string; phone_main?: string; phone_service?: string; phone_emergency?: string; email?: string; email_service?: string; website?: string; contact_name?: string; contact_phone?: string; customer_number?: string; sla_response_hours?: number; notes?: string }) => {
      const { data, error } = await supabase
        .from("equipment_suppliers")
        .insert(supplier)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment_suppliers"] });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Supplier> & { id: string }) => {
      const { data, error } = await supabase
        .from("equipment_suppliers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["equipment_suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["equipment_supplier", variables.id] });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("equipment_suppliers")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment_suppliers"] });
    },
  });
}

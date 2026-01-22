import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Equipment {
  id: string;
  location_id: string | null;
  department_id: string | null;
  category_id: string | null;
  supplier_id: string | null;
  responsible_employee_id: string | null;
  name: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  qr_code: string | null;
  status: string;
  criticality: string;
  purchase_date: string | null;
  purchase_price: number | null;
  warranty_months: number | null;
  warranty_expires: string | null;
  ownership_type: string;
  lease_monthly_cost: number | null;
  lease_expires: string | null;
  expected_lifetime_years: number | null;
  location_description: string | null;
  image_url: string | null;
  manual_url: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  category?: { id: string; name: string; icon: string | null; color: string | null } | null;
  location?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
  responsible?: { id: string; full_name: string } | null;
  supplier?: { id: string; name: string } | null;
}

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

export interface EquipmentFilters {
  categoryId?: string;
  status?: string;
  departmentId?: string;
  locationId?: string;
  responsibleId?: string;
  search?: string;
  isActive?: boolean;
}

export function useEquipmentList(filters: EquipmentFilters = {}) {
  return useQuery({
    queryKey: ["equipment", filters],
    queryFn: async () => {
      let query = supabase
        .from("equipment")
        .select(`
          *,
          category:equipment_categories(id, name, icon, color),
          location:locations(id, name),
          department:departments(id, name),
          responsible:profiles(id, full_name),
          supplier:equipment_suppliers(id, name)
        `)
        .order("name");

      if (filters.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.departmentId) {
        query = query.eq("department_id", filters.departmentId);
      }
      if (filters.locationId) {
        query = query.eq("location_id", filters.locationId);
      }
      if (filters.responsibleId) {
        query = query.eq("responsible_employee_id", filters.responsibleId);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`);
      }
      if (filters.isActive !== undefined) {
        query = query.eq("is_active", filters.isActive);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Equipment[];
    },
  });
}

export function useEquipment(id: string | null) {
  return useQuery({
    queryKey: ["equipment", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("equipment")
        .select(`
          *,
          category:equipment_categories(id, name, icon, color, requires_temp_monitoring, requires_certification),
          location:locations(id, name),
          department:departments(id, name),
          responsible:profiles(id, full_name),
          supplier:equipment_suppliers(id, name, phone_main, phone_service, phone_emergency, email)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Equipment;
    },
    enabled: !!id,
  });
}

export function useEquipmentByQRCode(qrCode: string | null) {
  return useQuery({
    queryKey: ["equipment", "qr", qrCode],
    queryFn: async () => {
      if (!qrCode) return null;
      const { data, error } = await supabase
        .from("equipment")
        .select(`
          *,
          category:equipment_categories(id, name, icon, color),
          location:locations(id, name),
          department:departments(id, name),
          responsible:profiles(id, full_name),
          supplier:equipment_suppliers(id, name, phone_main, phone_service)
        `)
        .eq("qr_code", qrCode)
        .single();
      if (error) throw error;
      return data as Equipment;
    },
    enabled: !!qrCode,
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (equipment: Omit<Partial<Equipment>, 'category' | 'location' | 'department' | 'responsible' | 'supplier'>) => {
      // Generate QR code if not provided
      const qr_code = equipment.qr_code || `EQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const { data, error } = await supabase
        .from("equipment")
        .insert({ ...equipment, qr_code } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    },
  });
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Equipment> & { id: string }) => {
      const { data, error } = await supabase
        .from("equipment")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      queryClient.invalidateQueries({ queryKey: ["equipment", variables.id] });
    },
  });
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("equipment")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    },
  });
}

// Equipment Stats for Dashboard
export function useEquipmentStats() {
  return useQuery({
    queryKey: ["equipment", "stats"],
    queryFn: async () => {
      const { data: equipment, error } = await supabase
        .from("equipment")
        .select("id, status, is_active")
        .eq("is_active", true);

      if (error) throw error;

      const { data: serviceIntervals } = await supabase
        .from("equipment_service_intervals")
        .select("id, next_due, equipment_id")
        .eq("is_active", true);

      const { data: deviations } = await supabase
        .from("equipment_deviations")
        .select("id, status")
        .in("status", ["new", "in_review", "action_planned", "in_progress"]);

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const serviceDue = serviceIntervals?.filter(
        (s) => s.next_due && new Date(s.next_due) <= thirtyDaysFromNow
      ).length || 0;

      return {
        total: equipment?.length || 0,
        inOperation: equipment?.filter((e) => e.status === "in_operation").length || 0,
        underRepair: equipment?.filter((e) => e.status === "under_repair").length || 0,
        outOfService: equipment?.filter((e) => e.status === "out_of_service").length || 0,
        serviceDue,
        openDeviations: deviations?.length || 0,
      };
    },
  });
}

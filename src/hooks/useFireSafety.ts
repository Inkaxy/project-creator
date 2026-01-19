import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FireDrill {
  id: string;
  title: string;
  description: string | null;
  drill_type: string;
  scheduled_date: string;
  completed_at: string | null;
  duration_minutes: number | null;
  participants_count: number | null;
  meeting_point: string | null;
  evacuation_time_seconds: number | null;
  responsible: string | null;
  notes: string | null;
  evaluation: string | null;
  improvement_points: string | null;
  created_at: string;
  updated_at: string;
  responsible_person?: { id: string; full_name: string } | null;
}

export interface FireEquipment {
  id: string;
  name: string;
  equipment_type: string;
  location: string;
  serial_number: string | null;
  qr_code: string | null;
  last_inspected_at: string | null;
  next_inspection_date: string | null;
  last_service_at: string | null;
  next_service_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EquipmentInspection {
  id: string;
  equipment_id: string;
  inspection_type: string;
  inspected_by: string | null;
  inspected_at: string;
  status: string;
  notes: string | null;
  image_url: string | null;
  profiles?: { id: string; full_name: string };
}

// =====================================================
// FIRE DRILLS
// =====================================================

export function useFireDrills() {
  return useQuery({
    queryKey: ["fire-drills"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fire_drills")
        .select(`
          *,
          responsible_person:profiles!fire_drills_responsible_fkey (id, full_name)
        `)
        .order("scheduled_date", { ascending: false });

      if (error) throw error;
      return data as unknown as FireDrill[];
    },
  });
}

export function useCreateFireDrill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      drill_type: string;
      scheduled_date: string;
      responsible?: string;
      meeting_point?: string;
    }) => {
      const { data: drill, error } = await supabase
        .from("fire_drills")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return drill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fire-drills"] });
      toast.success("Brannøvelse opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette brannøvelse: " + error.message);
    },
  });
}

export function useCompleteFireDrill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      duration_minutes,
      participants_count,
      evacuation_time_seconds,
      evaluation,
      improvement_points,
    }: {
      id: string;
      duration_minutes?: number;
      participants_count?: number;
      evacuation_time_seconds?: number;
      evaluation?: string;
      improvement_points?: string;
    }) => {
      const { error } = await supabase
        .from("fire_drills")
        .update({
          completed_at: new Date().toISOString(),
          duration_minutes,
          participants_count,
          evacuation_time_seconds,
          evaluation,
          improvement_points,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fire-drills"] });
      toast.success("Brannøvelse registrert som fullført");
    },
    onError: (error) => {
      toast.error("Kunne ikke registrere fullføring: " + error.message);
    },
  });
}

// =====================================================
// FIRE EQUIPMENT
// =====================================================

export function useFireEquipment() {
  return useQuery({
    queryKey: ["fire-equipment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fire_equipment")
        .select("*")
        .order("location", { ascending: true });

      if (error) throw error;
      return data as FireEquipment[];
    },
  });
}

export function useCreateFireEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      equipment_type: string;
      location: string;
      serial_number?: string;
      next_inspection_date?: string;
      next_service_date?: string;
    }) => {
      const { data: equipment, error } = await supabase
        .from("fire_equipment")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return equipment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fire-equipment"] });
      toast.success("Utstyr lagt til");
    },
    onError: (error) => {
      toast.error("Kunne ikke legge til utstyr: " + error.message);
    },
  });
}

export function useUpdateFireEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<FireEquipment> & { id: string }) => {
      const { error } = await supabase
        .from("fire_equipment")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fire-equipment"] });
      toast.success("Utstyr oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere utstyr: " + error.message);
    },
  });
}

// =====================================================
// EQUIPMENT INSPECTIONS
// =====================================================

export function useEquipmentInspections(equipmentId?: string) {
  return useQuery({
    queryKey: ["equipment-inspections", equipmentId],
    queryFn: async () => {
      let query = supabase
        .from("equipment_inspections")
        .select(`
          *,
          profiles (id, full_name)
        `)
        .order("inspected_at", { ascending: false });

      if (equipmentId) {
        query = query.eq("equipment_id", equipmentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EquipmentInspection[];
    },
  });
}

export function useCreateEquipmentInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      equipment_id,
      inspected_by,
      status,
      notes,
      inspection_type = "visual",
    }: {
      equipment_id: string;
      inspected_by: string;
      status: string;
      notes?: string;
      inspection_type?: string;
    }) => {
      // Create inspection
      const { error: inspectionError } = await supabase
        .from("equipment_inspections")
        .insert({
          equipment_id,
          inspected_by,
          status,
          notes,
          inspection_type,
        });

      if (inspectionError) throw inspectionError;

      // Update equipment last inspected date
      const { error: updateError } = await supabase
        .from("fire_equipment")
        .update({
          last_inspected_at: new Date().toISOString().split("T")[0],
          status,
        })
        .eq("id", equipment_id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-inspections"] });
      queryClient.invalidateQueries({ queryKey: ["fire-equipment"] });
      toast.success("Kontroll registrert");
    },
    onError: (error) => {
      toast.error("Kunne ikke registrere kontroll: " + error.message);
    },
  });
}

// Get equipment needing inspection
export function useEquipmentNeedingInspection() {
  return useQuery({
    queryKey: ["equipment-needing-inspection"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("fire_equipment")
        .select("*")
        .or(`next_inspection_date.lte.${today},next_service_date.lte.${today}`)
        .order("next_inspection_date", { ascending: true });

      if (error) throw error;
      return data as FireEquipment[];
    },
  });
}

// Get overdue equipment count
export function useOverdueEquipmentCount() {
  return useQuery({
    queryKey: ["overdue-equipment-count"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const { count, error } = await supabase
        .from("fire_equipment")
        .select("*", { count: "exact", head: true })
        .or(`next_inspection_date.lte.${today},next_service_date.lte.${today}`);

      if (error) throw error;
      return count || 0;
    },
  });
}

// Get next scheduled drill
export function useNextFireDrill() {
  return useQuery({
    queryKey: ["next-fire-drill"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("fire_drills")
        .select("*")
        .gte("scheduled_date", today)
        .is("completed_at", null)
        .order("scheduled_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as FireDrill | null;
    },
  });
}

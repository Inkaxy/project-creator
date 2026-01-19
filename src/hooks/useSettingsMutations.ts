import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WorkTimeRules } from "./useWorkTimeRules";

// Work Time Rules Mutations
export function useUpdateWorkTimeRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<WorkTimeRules> & { id: string }) => {
      const { id, ...data } = updates;
      const { error } = await supabase
        .from("work_time_rules")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work_time_rules"] });
      toast.success("Arbeidstidsregler oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere arbeidstidsregler");
      console.error(error);
    },
  });
}

// Absence Types
export interface AbsenceType {
  id: string;
  name: string;
  color: string | null;
  affects_salary: boolean | null;
  requires_documentation: boolean | null;
  from_account: string | null;
  is_active: boolean | null;
}

export function useAbsenceTypesMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: Omit<AbsenceType, "id">) => {
      const { error } = await supabase.from("absence_types").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absence_types"] });
      toast.success("Fraværstype opprettet");
    },
    onError: () => toast.error("Kunne ikke opprette fraværstype"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<AbsenceType> & { id: string }) => {
      const { error } = await supabase
        .from("absence_types")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absence_types"] });
      toast.success("Fraværstype oppdatert");
    },
    onError: () => toast.error("Kunne ikke oppdatere fraværstype"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("absence_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absence_types"] });
      toast.success("Fraværstype slettet");
    },
    onError: () => toast.error("Kunne ikke slette fraværstype"),
  });

  return { createMutation, updateMutation, deleteMutation };
}

// Locations
export interface Location {
  id: string;
  name: string;
  address: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  gps_radius: number | null;
}

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Location[];
    },
  });
}

export function useLocationsMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: Omit<Location, "id">) => {
      const { error } = await supabase.from("locations").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Lokasjon opprettet");
    },
    onError: () => toast.error("Kunne ikke opprette lokasjon"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Location> & { id: string }) => {
      const { error } = await supabase
        .from("locations")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Lokasjon oppdatert");
    },
    onError: () => toast.error("Kunne ikke oppdatere lokasjon"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("locations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Lokasjon slettet");
    },
    onError: () => toast.error("Kunne ikke slette lokasjon"),
  });

  return { createMutation, updateMutation, deleteMutation };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EmployeeDetails {
  id: string;
  employee_id: string;
  end_date: string | null;
  probation_end_date: string | null;
  contracted_hours_per_week: number | null;
  full_time_hours: number | null;
  employment_percentage: number | null;
  salary_type: "hourly" | "fixed";
  wage_ladder_id: string | null;
  current_seniority_level: number | null;
  accumulated_hours: number | null;
  fixed_monthly_salary: number | null;
  included_night_hours: number | null;
  contracted_hours_per_month: number | null;
  competence_level: "ufaglaert" | "faglaert" | "laerling" | null;
  allow_mobile_clock: boolean | null;
  gps_required: boolean | null;
  is_safety_representative: boolean | null;
  is_fire_safety_leader: boolean | null;
  is_food_safety_responsible: boolean | null;
  has_first_aid_course: boolean | null;
  created_at: string;
  updated_at: string;
  // Joined data
  wage_ladders?: {
    id: string;
    name: string;
    competence_level: string;
  } | null;
}

export interface CreateEmployeeDetailsInput {
  employee_id: string;
  end_date?: string | null;
  probation_end_date?: string | null;
  contracted_hours_per_week?: number;
  full_time_hours?: number;
  salary_type?: "hourly" | "fixed";
  wage_ladder_id?: string | null;
  current_seniority_level?: number;
  accumulated_hours?: number;
  fixed_monthly_salary?: number | null;
  included_night_hours?: number | null;
  contracted_hours_per_month?: number | null;
  competence_level?: "ufaglaert" | "faglaert" | "laerling";
  allow_mobile_clock?: boolean;
  gps_required?: boolean;
  is_safety_representative?: boolean;
  is_fire_safety_leader?: boolean;
  is_food_safety_responsible?: boolean;
  has_first_aid_course?: boolean;
}

export interface UpdateEmployeeDetailsInput extends Partial<CreateEmployeeDetailsInput> {
  id: string;
}

export function useEmployeeDetails(employeeId?: string) {
  return useQuery({
    queryKey: ["employee-details", employeeId],
    queryFn: async () => {
      if (!employeeId) return null;

      const { data, error } = await supabase
        .from("employee_details")
        .select(`
          *,
          wage_ladders (
            id,
            name,
            competence_level
          )
        `)
        .eq("employee_id", employeeId)
        .maybeSingle();

      if (error) throw error;
      return data as EmployeeDetails | null;
    },
    enabled: !!employeeId,
  });
}

export function useCreateEmployeeDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEmployeeDetailsInput) => {
      const { data, error } = await supabase
        .from("employee_details")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employee-details", variables.employee_id] });
      toast.success("Ansettelsesdetaljer opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette detaljer: " + error.message);
    },
  });
}

export function useUpdateEmployeeDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateEmployeeDetailsInput) => {
      const { data, error } = await supabase
        .from("employee_details")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-details"] });
      toast.success("Ansettelsesdetaljer oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere detaljer: " + error.message);
    },
  });
}

export function useUpsertEmployeeDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEmployeeDetailsInput) => {
      const { data, error } = await supabase
        .from("employee_details")
        .upsert(input, { onConflict: "employee_id" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employee-details", variables.employee_id] });
      toast.success("Ansettelsesdetaljer lagret");
    },
    onError: (error) => {
      toast.error("Kunne ikke lagre detaljer: " + error.message);
    },
  });
}

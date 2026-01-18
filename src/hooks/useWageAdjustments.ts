import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WageAdjustment {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  total_hours: number;
  old_rate: number;
  new_rate: number;
  difference_per_hour: number;
  total_adjustment: number;
  status: 'pending' | 'approved' | 'exported' | 'paid' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  ladder_history_id: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface WageLadderHistory {
  id: string;
  ladder_id: string;
  level: number;
  old_hourly_rate: number | null;
  new_hourly_rate: number;
  effective_from: string;
  created_at: string;
  created_by: string | null;
}

export interface CreateWageAdjustmentInput {
  employee_id: string;
  period_start: string;
  period_end: string;
  total_hours: number;
  old_rate: number;
  new_rate: number;
  difference_per_hour: number;
  total_adjustment: number;
  ladder_history_id?: string;
}

export interface BackPayCalculation {
  employeeId: string;
  employeeName: string;
  totalHours: number;
  oldRate: number;
  newRate: number;
  differencePerHour: number;
  totalAdjustment: number;
}

// Fetch all wage adjustments with employee info
export function useWageAdjustments(status?: string) {
  return useQuery({
    queryKey: ["wage-adjustments", status],
    queryFn: async () => {
      let query = supabase
        .from("wage_adjustments")
        .select(`
          *,
          employee:profiles!wage_adjustments_employee_id_fkey(id, full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as WageAdjustment[];
    },
  });
}

// Create wage ladder history entry
export function useCreateWageLadderHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      ladder_id: string;
      level: number;
      old_hourly_rate: number | null;
      new_hourly_rate: number;
      effective_from: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("wage_ladder_history")
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as WageLadderHistory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wage-ladder-history"] });
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette historikk: " + error.message);
    },
  });
}

// Create wage adjustment
export function useCreateWageAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateWageAdjustmentInput) => {
      const { data, error } = await supabase
        .from("wage_adjustments")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wage-adjustments"] });
      toast.success("Etterbetaling opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette etterbetaling: " + error.message);
    },
  });
}

// Create multiple wage adjustments at once
export function useCreateWageAdjustments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inputs: CreateWageAdjustmentInput[]) => {
      if (inputs.length === 0) return [];
      
      const { data, error } = await supabase
        .from("wage_adjustments")
        .insert(inputs)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["wage-adjustments"] });
      if (data && data.length > 0) {
        toast.success(`${data.length} etterbetaling(er) opprettet`);
      }
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette etterbetalinger: " + error.message);
    },
  });
}

// Update wage adjustment status
export function useUpdateWageAdjustmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (status === 'approved') {
        const { data: { user } } = await supabase.auth.getUser();
        updateData.approved_by = user?.id;
        updateData.approved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("wage_adjustments")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wage-adjustments"] });
      const statusText = variables.status === 'approved' ? 'godkjent' : 
                         variables.status === 'rejected' ? 'avvist' : 
                         variables.status;
      toast.success(`Etterbetaling ${statusText}`);
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere status: " + error.message);
    },
  });
}

// Calculate back pay for affected employees
export async function calculateBackPayForLadder(
  ladderId: string,
  level: number,
  oldRate: number,
  newRate: number,
  effectiveFrom: Date
): Promise<BackPayCalculation[]> {
  const today = new Date();
  
  // Only calculate if effective date is in the past
  if (effectiveFrom >= today) {
    return [];
  }

  // Get employees on this wage ladder at this level
  const { data: employees, error: empError } = await supabase
    .from("employee_details")
    .select(`
      employee_id,
      current_seniority_level,
      accumulated_hours,
      profiles!employee_details_employee_id_fkey(id, full_name)
    `)
    .eq("wage_ladder_id", ladderId)
    .eq("salary_type", "hourly");

  if (empError) throw empError;

  const calculations: BackPayCalculation[] = [];
  const differencePerHour = newRate - oldRate;

  for (const emp of employees || []) {
    // Check if employee is at the affected level
    if (emp.current_seniority_level !== level) continue;

    // Get approved time entries in the period
    const { data: timeEntries, error: teError } = await supabase
      .from("time_entries")
      .select("clock_in, clock_out, break_minutes")
      .eq("employee_id", emp.employee_id)
      .eq("status", "approved")
      .gte("date", effectiveFrom.toISOString().split('T')[0])
      .lte("date", today.toISOString().split('T')[0]);

    if (teError) throw teError;

    // Calculate total hours
    let totalHours = 0;
    for (const entry of timeEntries || []) {
      if (entry.clock_in && entry.clock_out) {
        const clockIn = new Date(entry.clock_in);
        const clockOut = new Date(entry.clock_out);
        const breakMinutes = entry.break_minutes || 0;
        const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60) - breakMinutes / 60;
        totalHours += Math.max(0, hoursWorked);
      }
    }

    if (totalHours > 0) {
      calculations.push({
        employeeId: emp.employee_id,
        employeeName: (emp.profiles as { full_name: string })?.full_name || 'Ukjent',
        totalHours: Math.round(totalHours * 100) / 100,
        oldRate,
        newRate,
        differencePerHour,
        totalAdjustment: Math.round(totalHours * differencePerHour * 100) / 100,
      });
    }
  }

  return calculations;
}

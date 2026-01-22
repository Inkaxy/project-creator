import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// Types
export interface TimesheetSettings {
  id: string;
  auto_approve_within_margin: boolean;
  margin_minutes: number;
  default_positive_deviation_handling: string;
  default_negative_deviation_handling: string;
  require_explanation_above_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface TimeEntryDeviation {
  id: string;
  time_entry_id: string;
  deviation_type: "early_start" | "late_start" | "early_end" | "late_end" | "extended_break" | "short_break";
  deviation_minutes: number;
  handling: "time_bank" | "overtime_50" | "overtime_100" | "comp_time" | "ignore" | "deduct" | null;
  handled_by: string | null;
  handled_at: string | null;
  notes: string | null;
  account_transaction_id: string | null;
  created_at: string;
}

export interface DeviationHandlingInput {
  time_entry_id: string;
  deviation_type: TimeEntryDeviation["deviation_type"];
  deviation_minutes: number;
  handling: TimeEntryDeviation["handling"];
  notes?: string;
}

export interface DeviationDistribution {
  time_bank_minutes: number;
  overtime_50_minutes: number;
  overtime_100_minutes: number;
  comp_time_minutes: number;
  ignore_minutes: number;
}

// Fetch timesheet settings
export function useTimesheetSettings() {
  return useQuery({
    queryKey: ["timesheet_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timesheet_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as TimesheetSettings | null;
    },
  });
}

// Update timesheet settings
export function useUpdateTimesheetSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<TimesheetSettings> & { id: string }) => {
      const { id, ...data } = updates;
      const { error } = await supabase
        .from("timesheet_settings")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheet_settings"] });
      toast.success("Innstillinger oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere innstillinger: " + error.message);
    },
  });
}

// Fetch deviations for a time entry
export function useTimeEntryDeviations(timeEntryId: string | null) {
  return useQuery({
    queryKey: ["time_entry_deviations", timeEntryId],
    queryFn: async () => {
      if (!timeEntryId) return [];
      
      const { data, error } = await supabase
        .from("time_entry_deviations")
        .select("*")
        .eq("time_entry_id", timeEntryId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TimeEntryDeviation[];
    },
    enabled: !!timeEntryId,
  });
}

// Create deviation handling
export function useCreateDeviationHandling() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: DeviationHandlingInput) => {
      const { data, error } = await supabase
        .from("time_entry_deviations")
        .insert({
          ...input,
          handled_by: user?.id,
          handled_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entry_deviations"] });
    },
    onError: (error) => {
      toast.error("Kunne ikke registrere avvikshåndtering: " + error.message);
    },
  });
}

// Batch create deviation handling with account transactions
export function useHandleDeviationWithAccount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      timeEntryId,
      employeeId,
      distribution,
      notes,
    }: {
      timeEntryId: string;
      employeeId: string;
      distribution: DeviationDistribution;
      notes?: string;
    }) => {
      const currentYear = new Date().getFullYear();
      const deviations: DeviationHandlingInput[] = [];

      // Create deviation records for each handling type
      if (distribution.time_bank_minutes > 0) {
        deviations.push({
          time_entry_id: timeEntryId,
          deviation_type: "late_end", // Default type
          deviation_minutes: distribution.time_bank_minutes,
          handling: "time_bank",
          notes,
        });

        // Also create account transaction
        const { data: account } = await supabase
          .from("employee_accounts")
          .select("id")
          .eq("employee_id", employeeId)
          .eq("account_type", "time_bank")
          .eq("year", currentYear)
          .maybeSingle();

        if (account) {
          await supabase.from("account_transactions").insert({
            account_id: account.id,
            amount: distribution.time_bank_minutes / 60, // Convert to hours
            description: `Ekstratid fra timeliste`,
            reference_type: "overtime",
            reference_id: timeEntryId,
            created_by: user?.id,
          });
        }
      }

      if (distribution.overtime_50_minutes > 0) {
        deviations.push({
          time_entry_id: timeEntryId,
          deviation_type: "late_end",
          deviation_minutes: distribution.overtime_50_minutes,
          handling: "overtime_50",
          notes,
        });
      }

      if (distribution.overtime_100_minutes > 0) {
        deviations.push({
          time_entry_id: timeEntryId,
          deviation_type: "late_end",
          deviation_minutes: distribution.overtime_100_minutes,
          handling: "overtime_100",
          notes,
        });
      }

      if (distribution.comp_time_minutes > 0) {
        deviations.push({
          time_entry_id: timeEntryId,
          deviation_type: "late_end",
          deviation_minutes: distribution.comp_time_minutes,
          handling: "comp_time",
          notes,
        });
      }

      if (distribution.ignore_minutes > 0) {
        deviations.push({
          time_entry_id: timeEntryId,
          deviation_type: "late_end",
          deviation_minutes: distribution.ignore_minutes,
          handling: "ignore",
          notes,
        });
      }

      // Insert all deviations
      if (deviations.length > 0) {
        const insertData = deviations.map(d => ({
          ...d,
          handled_by: user?.id,
          handled_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from("time_entry_deviations")
          .insert(insertData);

        if (error) throw error;
      }

      return deviations;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entry_deviations"] });
      queryClient.invalidateQueries({ queryKey: ["employee-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account-transactions"] });
      toast.success("Avvik håndtert og registrert");
    },
    onError: (error) => {
      toast.error("Kunne ikke håndtere avvik: " + error.message);
    },
  });
}

// Calculate detailed deviations from a time entry
export function calculateDeviations(
  clockIn: Date,
  clockOut: Date,
  plannedStart: string,
  plannedEnd: string,
  date: string,
  breakMinutes: number,
  plannedBreakMinutes: number
): {
  totalDeviation: number;
  deviations: Array<{
    type: TimeEntryDeviation["deviation_type"];
    minutes: number;
    label: string;
  }>;
} {
  const deviations: Array<{
    type: TimeEntryDeviation["deviation_type"];
    minutes: number;
    label: string;
  }> = [];

  // Parse planned times
  const plannedStartDate = new Date(`${date}T${plannedStart}`);
  let plannedEndDate = new Date(`${date}T${plannedEnd}`);
  
  // Handle overnight shifts
  if (plannedEndDate < plannedStartDate) {
    plannedEndDate.setDate(plannedEndDate.getDate() + 1);
  }

  // Check start deviation
  const startDiffMinutes = Math.round((clockIn.getTime() - plannedStartDate.getTime()) / 60000);
  if (startDiffMinutes < -5) {
    // Started early
    deviations.push({
      type: "early_start",
      minutes: Math.abs(startDiffMinutes),
      label: `Startet ${Math.abs(startDiffMinutes)} min tidlig`,
    });
  } else if (startDiffMinutes > 5) {
    // Started late
    deviations.push({
      type: "late_start",
      minutes: startDiffMinutes,
      label: `Startet ${startDiffMinutes} min sent`,
    });
  }

  // Check end deviation
  const endDiffMinutes = Math.round((clockOut.getTime() - plannedEndDate.getTime()) / 60000);
  if (endDiffMinutes > 5) {
    // Ended late (overtime)
    deviations.push({
      type: "late_end",
      minutes: endDiffMinutes,
      label: `Sluttet ${endDiffMinutes} min sent`,
    });
  } else if (endDiffMinutes < -5) {
    // Ended early
    deviations.push({
      type: "early_end",
      minutes: Math.abs(endDiffMinutes),
      label: `Sluttet ${Math.abs(endDiffMinutes)} min tidlig`,
    });
  }

  // Check break deviation
  const breakDiff = breakMinutes - plannedBreakMinutes;
  if (breakDiff > 5) {
    deviations.push({
      type: "extended_break",
      minutes: breakDiff,
      label: `${breakDiff} min ekstra pause`,
    });
  } else if (breakDiff < -5) {
    deviations.push({
      type: "short_break",
      minutes: Math.abs(breakDiff),
      label: `${Math.abs(breakDiff)} min kortere pause`,
    });
  }

  // Calculate total deviation (positive = overtime, negative = under time)
  const actualMinutes = (clockOut.getTime() - clockIn.getTime()) / 60000 - breakMinutes;
  const plannedMinutes = (plannedEndDate.getTime() - plannedStartDate.getTime()) / 60000 - plannedBreakMinutes;
  const totalDeviation = Math.round(actualMinutes - plannedMinutes);

  return { totalDeviation, deviations };
}

// Check if entry should be auto-approved
export function shouldAutoApprove(
  deviationMinutes: number,
  settings: TimesheetSettings | null
): boolean {
  if (!settings || !settings.auto_approve_within_margin) return false;
  return Math.abs(deviationMinutes) <= settings.margin_minutes;
}

// Handling type labels in Norwegian
export const deviationHandlingLabels: Record<string, string> = {
  time_bank: "Tidsbank",
  overtime_50: "Overtid 50%",
  overtime_100: "Overtid 100%",
  comp_time: "Avspasering",
  ignore: "Ignorer",
  deduct: "Trekk fra lønn",
};

// Deviation type labels in Norwegian
export const deviationTypeLabels: Record<string, string> = {
  early_start: "Startet tidlig",
  late_start: "Startet sent",
  early_end: "Sluttet tidlig",
  late_end: "Sluttet sent",
  extended_break: "Lang pause",
  short_break: "Kort pause",
};

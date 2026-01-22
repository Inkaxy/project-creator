import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LogAutoApprovalInput {
  timeEntryId: string;
  employeeId: string;
  approverId: string;
  deviationMinutes: number;
}

export function useLogAutoApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LogAutoApprovalInput) => {
      const { data, error } = await supabase
        .from("auto_approvals_log")
        .insert({
          time_entry_id: input.timeEntryId,
          employee_id: input.employeeId,
          approver_id: input.approverId,
          deviation_minutes: input.deviationMinutes,
        })
        .select()
        .single();

      if (error) {
        console.error("Error logging auto-approval:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-approvals-log"] });
    },
  });
}

export function useLogMultipleAutoApprovals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inputs: LogAutoApprovalInput[]) => {
      if (inputs.length === 0) return [];

      const { data, error } = await supabase
        .from("auto_approvals_log")
        .insert(
          inputs.map(input => ({
            time_entry_id: input.timeEntryId,
            employee_id: input.employeeId,
            approver_id: input.approverId,
            deviation_minutes: input.deviationMinutes,
          }))
        )
        .select();

      if (error) {
        console.error("Error logging multiple auto-approvals:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-approvals-log"] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeniorityLogEntry {
  id: string;
  employee_id: string;
  hours_added: number;
  total_hours_after: number | null;
  source: "time_entry" | "manual" | "import" | "adjustment";
  reference_id: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export function useSeniorityLog(employeeId?: string) {
  return useQuery({
    queryKey: ["seniority-log", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];

      const { data, error } = await supabase
        .from("seniority_log")
        .select("*")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as SeniorityLogEntry[];
    },
    enabled: !!employeeId,
  });
}

export function useAddSeniorityHours() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      employeeId,
      hours,
      source,
      referenceId,
      notes,
    }: {
      employeeId: string;
      hours: number;
      source: "time_entry" | "manual" | "import" | "adjustment";
      referenceId?: string;
      notes?: string;
    }) => {
      // Call the database function
      const { data, error } = await supabase.rpc("add_seniority_hours", {
        p_employee_id: employeeId,
        p_hours: hours,
        p_source: source,
        p_reference_id: referenceId || null,
        p_notes: notes || null,
        p_created_by: user?.id || null,
      });

      if (error) throw error;
      return data as number; // Returns new total hours
    },
    onSuccess: (newTotal, variables) => {
      queryClient.invalidateQueries({ queryKey: ["seniority-log", variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ["employee-details", variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ["level-progressions"] });
      toast.success(`Timer oppdatert. Ny total: ${newTotal.toLocaleString("nb-NO")} t`);
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere timer: " + error.message);
    },
  });
}

// Source labels for display
export const senioritySourceLabels: Record<SeniorityLogEntry["source"], string> = {
  time_entry: "Timeliste",
  manual: "Manuell justering",
  import: "Import",
  adjustment: "Korrigering",
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateCurrentLevel, WageLadder } from "./useWageLadders";

export interface LevelProgressionCheck {
  employeeId: string;
  employeeName: string;
  currentLevel: number;
  newLevel: number;
  currentRate: number;
  newRate: number;
  accumulatedHours: number;
  wageLadderId: string;
  wageLadderName: string;
}

export interface EmployeeWithLadder {
  employee_id: string;
  current_seniority_level: number | null;
  accumulated_hours: number | null;
  wage_ladder_id: string | null;
  profiles: {
    id: string;
    full_name: string;
  };
  wage_ladders: WageLadder | null;
}

// Check all employees for potential level progression
export function useCheckLevelProgressions() {
  return useQuery({
    queryKey: ["level-progressions"],
    queryFn: async () => {
      // Get all employees with wage ladders
      const { data: employees, error } = await supabase
        .from("employee_details")
        .select(`
          employee_id,
          current_seniority_level,
          accumulated_hours,
          wage_ladder_id,
          profiles!employee_details_employee_id_fkey(id, full_name),
          wage_ladders!employee_details_wage_ladder_id_fkey(
            id,
            name,
            competence_level,
            levels:wage_ladder_levels(
              id,
              ladder_id,
              level,
              min_hours,
              max_hours,
              hourly_rate,
              effective_from,
              created_at
            )
          )
        `)
        .eq("salary_type", "hourly")
        .not("wage_ladder_id", "is", null);

      if (error) throw error;

      const progressions: LevelProgressionCheck[] = [];

      for (const emp of employees || []) {
        if (!emp.wage_ladders || !emp.wage_ladders.levels) continue;

        const accumulatedHours = emp.accumulated_hours || 0;
        const currentLevelNum = emp.current_seniority_level || 1;

        // Calculate what level they should be at
        const calculated = calculateCurrentLevel(
          emp.wage_ladders as WageLadder,
          accumulatedHours
        );

        // Check if they should advance
        if (calculated.level > currentLevelNum) {
          // Get current rate from their current level
          const currentLevelData = emp.wage_ladders.levels.find(
            (l) => l.level === currentLevelNum
          );
          const currentRate = currentLevelData?.hourly_rate || 0;

          progressions.push({
            employeeId: emp.employee_id,
            employeeName: (emp.profiles as { full_name: string })?.full_name || "Ukjent",
            currentLevel: currentLevelNum,
            newLevel: calculated.level,
            currentRate,
            newRate: calculated.hourlyRate,
            accumulatedHours,
            wageLadderId: emp.wage_ladder_id!,
            wageLadderName: emp.wage_ladders.name,
          });
        }
      }

      return progressions;
    },
    refetchInterval: 60000, // Check every minute
  });
}

// Apply level progression for an employee
export function useApplyLevelProgression() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      employeeId,
      newLevel,
    }: {
      employeeId: string;
      newLevel: number;
    }) => {
      const { data, error } = await supabase
        .from("employee_details")
        .update({ current_seniority_level: newLevel })
        .eq("employee_id", employeeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-details"] });
      queryClient.invalidateQueries({ queryKey: ["level-progressions"] });
      toast.success("Lønnsnivå oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere nivå: " + error.message);
    },
  });
}

// Batch apply all pending progressions
export function useApplyAllProgressions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (progressions: LevelProgressionCheck[]) => {
      const updates = progressions.map((p) =>
        supabase
          .from("employee_details")
          .update({ current_seniority_level: p.newLevel })
          .eq("employee_id", p.employeeId)
      );

      const results = await Promise.all(updates);

      // Check for any errors
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw new Error(`${errors.length} oppdateringer feilet`);
      }

      return results;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employee-details"] });
      queryClient.invalidateQueries({ queryKey: ["level-progressions"] });
      toast.success(`${variables.length} ansatte oppdatert til nytt lønnsnivå`);
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere nivåer: " + error.message);
    },
  });
}

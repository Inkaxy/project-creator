import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ApprovedAbsence {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  absence_types: {
    id: string;
    name: string;
    color: string;
  } | null;
  profiles: {
    id: string;
    full_name: string;
  } | null;
}

export const useApprovedAbsences = (startDate: string, endDate: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["approved-absences", startDate, endDate],
    queryFn: async () => {
      // Fetch absences that overlap with the given date range
      const { data, error } = await supabase
        .from("absence_requests")
        .select(`
          id,
          employee_id,
          start_date,
          end_date,
          total_days,
          absence_types (id, name, color),
          profiles!absence_requests_employee_id_fkey (id, full_name)
        `)
        .eq("status", "approved")
        .lte("start_date", endDate)
        .gte("end_date", startDate)
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data as unknown as ApprovedAbsence[];
    },
    enabled: !!user && !!startDate && !!endDate,
  });
};

// Helper to check if an employee has absence on a specific date
export const hasAbsenceOnDate = (
  absences: ApprovedAbsence[],
  employeeId: string,
  date: string
): ApprovedAbsence | undefined => {
  return absences.find(
    (absence) =>
      absence.employee_id === employeeId &&
      date >= absence.start_date &&
      date <= absence.end_date
  );
};

// Get all employees with absences on a specific date
export const getAbsencesForDate = (
  absences: ApprovedAbsence[],
  date: string
): ApprovedAbsence[] => {
  return absences.filter(
    (absence) => date >= absence.start_date && date <= absence.end_date
  );
};

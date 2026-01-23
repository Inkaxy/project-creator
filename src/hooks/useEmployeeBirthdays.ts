import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBirthdayVisibility } from "./useSettings";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO, getMonth, getDate } from "date-fns";

export interface EmployeeBirthday {
  id: string;
  full_name: string;
  date_of_birth: string;
  avatar_url: string | null;
}

export function useEmployeeBirthdays() {
  const { data: visibility } = useBirthdayVisibility();
  const { isAdminOrManager } = useAuth();

  // Check if user is a manager/admin
  const isManager = isAdminOrManager();

  // Only fetch if visibility allows or user is manager
  const canView = visibility === "all" || isManager;

  return useQuery({
    queryKey: ["employee-birthdays", canView],
    queryFn: async () => {
      if (!canView) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, date_of_birth, avatar_url")
        .not("date_of_birth", "is", null)
        .eq("is_active", true);

      if (error) throw error;
      return (data || []) as EmployeeBirthday[];
    },
    enabled: canView,
  });
}

// Helper to check if a birthday falls on a specific date (ignoring year)
export function getBirthdaysForDate(
  birthdays: EmployeeBirthday[],
  date: Date
): EmployeeBirthday[] {
  const targetMonth = getMonth(date);
  const targetDay = getDate(date);

  return birthdays.filter((employee) => {
    if (!employee.date_of_birth) return false;
    try {
      const dob = parseISO(employee.date_of_birth);
      return getMonth(dob) === targetMonth && getDate(dob) === targetDay;
    } catch {
      return false;
    }
  });
}

// Calculate age for a birthday
export function calculateAge(dateOfBirth: string, referenceDate: Date = new Date()): number {
  const dob = parseISO(dateOfBirth);
  let age = referenceDate.getFullYear() - dob.getFullYear();
  const monthDiff = referenceDate.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < dob.getDate())) {
    age--;
  }
  return age + 1; // +1 because we're showing what age they're turning
}

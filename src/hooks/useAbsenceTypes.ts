import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AbsenceType {
  id: string;
  name: string;
  affects_salary: boolean;
  requires_documentation: boolean;
  from_account: "vacation" | "time_bank" | "night_bank" | null;
  color: string;
  is_active: boolean;
}

export const useAbsenceTypes = () => {
  return useQuery({
    queryKey: ["absence-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("absence_types")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as AbsenceType[];
    },
  });
};

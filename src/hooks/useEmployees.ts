import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmployeeProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean | null;
  department_id: string | null;
  function_id: string | null;
  employee_type: string | null;
  start_date: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  departments?: {
    id: string;
    name: string;
  } | null;
  functions?: {
    id: string;
    name: string;
  } | null;
}

export function useEmployees(showInactive = false) {
  return useQuery({
    queryKey: ["employees", showInactive],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select(`
          *,
          departments (
            id,
            name
          ),
          functions:function_id (
            id,
            name
          )
        `)
        .order("full_name", { ascending: true });

      if (!showInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EmployeeProfile[];
    },
  });
}

export function useEmployee(employeeId: string) {
  return useQuery({
    queryKey: ["employees", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          departments (
            id,
            name
          ),
          functions:function_id (
            id,
            name
          )
        `)
        .eq("id", employeeId)
        .single();

      if (error) throw error;
      return data as EmployeeProfile;
    },
    enabled: !!employeeId,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

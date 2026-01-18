import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EmployeeFunctionData {
  id: string;
  employee_id: string;
  function_id: string;
  proficiency_level: string;
  certified_date: string | null;
  certified_by: string | null;
  notes: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
  // Joined data
  functions?: {
    id: string;
    name: string;
    color: string | null;
    category: string | null;
  } | null;
  profiles?: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
    is_active?: boolean | null;
  } | null;
  certified_by_profile?: {
    id: string;
    full_name: string;
  } | null;
}

export interface CreateEmployeeFunctionInput {
  employee_id: string;
  function_id: string;
  proficiency_level?: string;
  certified_date?: string;
  certified_by?: string;
  notes?: string;
}

export interface UpdateEmployeeFunctionInput extends Partial<CreateEmployeeFunctionInput> {
  id: string;
}

export function useEmployeeFunctions(employeeId?: string) {
  return useQuery({
    queryKey: ["employee_functions", employeeId],
    queryFn: async () => {
      let query = supabase
        .from("employee_functions")
        .select(`
          *,
          functions (
            id,
            name,
            color,
            category
          )
        `)
        .eq("is_active", true);

      if (employeeId) {
        query = query.eq("employee_id", employeeId);
      }

      const { data, error } = await query.order("created_at", { ascending: true });

      if (error) throw error;
      return data as EmployeeFunctionData[];
    },
    enabled: employeeId !== undefined,
  });
}

export function useQualifiedEmployees(functionId: string) {
  return useQuery({
    queryKey: ["qualified_employees", functionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_functions")
        .select(`
          *,
          profiles!employee_functions_employee_id_fkey (
            id,
            full_name,
            avatar_url,
            is_active
          )
        `)
        .eq("function_id", functionId)
        .eq("is_active", true);

      if (error) throw error;
      
      // Filter out inactive employees and sort by proficiency
      const proficiencyOrder = { expert: 0, competent: 1, learning: 2 };
      return (data as EmployeeFunctionData[])
        .filter(ef => ef.profiles?.is_active !== false)
        .sort((a, b) => {
          const orderA = proficiencyOrder[a.proficiency_level as keyof typeof proficiencyOrder] ?? 3;
          const orderB = proficiencyOrder[b.proficiency_level as keyof typeof proficiencyOrder] ?? 3;
          return orderA - orderB;
        });
    },
    enabled: !!functionId,
  });
}

export function useCreateEmployeeFunction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEmployeeFunctionInput) => {
      const { data, error } = await supabase
        .from("employee_functions")
        .insert(input)
        .select(`
          *,
          functions (
            id,
            name,
            color,
            category
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employee_functions", variables.employee_id] });
      queryClient.invalidateQueries({ queryKey: ["qualified_employees", variables.function_id] });
      toast.success("Funksjon tildelt");
    },
    onError: (error) => {
      toast.error("Kunne ikke tildele funksjon: " + error.message);
    },
  });
}

export function useUpdateEmployeeFunction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateEmployeeFunctionInput) => {
      const { data, error } = await supabase
        .from("employee_functions")
        .update(input)
        .eq("id", id)
        .select(`
          *,
          functions (
            id,
            name,
            color,
            category
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee_functions"] });
      queryClient.invalidateQueries({ queryKey: ["qualified_employees"] });
      toast.success("Funksjon oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere funksjon: " + error.message);
    },
  });
}

export function useDeleteEmployeeFunction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employee_functions")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee_functions"] });
      queryClient.invalidateQueries({ queryKey: ["qualified_employees"] });
      toast.success("Funksjon fjernet");
    },
    onError: (error) => {
      toast.error("Kunne ikke fjerne funksjon: " + error.message);
    },
  });
}

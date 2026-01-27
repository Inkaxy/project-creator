import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { 
  SalaryType, 
  SalaryTypeMapping, 
  PayrollSystemType 
} from "@/types/payroll";

export function useSalaryTypes() {
  return useQuery({
    queryKey: ["salary-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salary_types")
        .select(`
          *,
          mappings:salary_type_mappings (*)
        `)
        .eq("is_active", true)
        .order("sort_order")
        .order("code");

      if (error) throw error;
      return data as SalaryType[];
    },
  });
}

export function useSalaryTypesWithMappings() {
  return useQuery({
    queryKey: ["salary-types-with-mappings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salary_types")
        .select(`
          *,
          mappings:salary_type_mappings (*)
        `)
        .order("sort_order")
        .order("code");

      if (error) throw error;
      return data as SalaryType[];
    },
  });
}

export function useUpdateSalaryTypeMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      salaryTypeId,
      systemType,
      externalCode,
      externalName,
    }: {
      salaryTypeId: string;
      systemType: PayrollSystemType;
      externalCode: string;
      externalName?: string;
    }) => {
      // Check if mapping exists
      const { data: existing } = await supabase
        .from("salary_type_mappings")
        .select("id")
        .eq("salary_type_id", salaryTypeId)
        .eq("system_type", systemType)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("salary_type_mappings")
          .update({ 
            external_code: externalCode,
            external_name: externalName,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("salary_type_mappings")
          .insert({
            salary_type_id: salaryTypeId,
            system_type: systemType,
            external_code: externalCode,
            external_name: externalName,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-types"] });
      queryClient.invalidateQueries({ queryKey: ["salary-types-with-mappings"] });
      toast.success("Mapping oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere mapping: " + error.message);
    },
  });
}

export function useCreateSalaryType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<SalaryType, "id" | "created_at" | "updated_at" | "mappings">) => {
      const { data: result, error } = await supabase
        .from("salary_types")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-types"] });
      toast.success("Lønnsart opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette lønnsart: " + error.message);
    },
  });
}

export function useUpdateSalaryType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...data 
    }: Partial<SalaryType> & { id: string }) => {
      const { error } = await supabase
        .from("salary_types")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-types"] });
      toast.success("Lønnsart oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere lønnsart: " + error.message);
    },
  });
}

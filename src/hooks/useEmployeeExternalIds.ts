import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { EmployeeExternalId, PayrollSystemType } from "@/types/payroll";

export function useEmployeeExternalIds(systemType?: PayrollSystemType) {
  return useQuery({
    queryKey: ["employee-external-ids", systemType],
    queryFn: async () => {
      let query = supabase
        .from("employee_external_ids")
        .select("*")
        .eq("is_active", true);

      if (systemType) {
        query = query.eq("system_type", systemType);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data as EmployeeExternalId[];
    },
  });
}

export function useEmployeesWithExternalIds(systemType: PayrollSystemType) {
  return useQuery({
    queryKey: ["employees-with-external-ids", systemType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          employee_type,
          is_active,
          employee_external_ids!left (
            id,
            external_id,
            system_type,
            sync_status,
            synced_at
          )
        `)
        .eq("is_active", true)
        .order("full_name");

      if (error) throw error;

      return data.map((emp: any) => ({
        ...emp,
        externalId: emp.employee_external_ids?.find(
          (eid: any) => eid.system_type === systemType
        ),
      }));
    },
  });
}

export function useUpdateEmployeeExternalId() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      employeeId,
      systemType,
      externalId,
      externalName,
    }: {
      employeeId: string;
      systemType: PayrollSystemType;
      externalId: string;
      externalName?: string;
    }) => {
      // Check if record exists
      const { data: existing } = await supabase
        .from("employee_external_ids")
        .select("id")
        .eq("employee_id", employeeId)
        .eq("system_type", systemType)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("employee_external_ids")
          .update({ 
            external_id: externalId, 
            external_name: externalName,
            sync_status: "manual",
            synced_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("employee_external_ids")
          .insert({
            employee_id: employeeId,
            system_type: systemType,
            external_id: externalId,
            external_name: externalName,
            sync_status: "manual",
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-external-ids"] });
      queryClient.invalidateQueries({ queryKey: ["employees-with-external-ids"] });
      toast.success("Ansattnummer oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere: " + error.message);
    },
  });
}

export function useDeleteEmployeeExternalId() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employee_external_ids")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-external-ids"] });
      queryClient.invalidateQueries({ queryKey: ["employees-with-external-ids"] });
      toast.success("Kobling slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette: " + error.message);
    },
  });
}

export function useBulkUpdateEmployeeExternalIds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      systemType,
      mappings,
    }: {
      systemType: PayrollSystemType;
      mappings: Array<{ employeeId: string; externalId: string }>;
    }) => {
      for (const mapping of mappings) {
        const { data: existing } = await supabase
          .from("employee_external_ids")
          .select("id")
          .eq("employee_id", mapping.employeeId)
          .eq("system_type", systemType)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("employee_external_ids")
            .update({ 
              external_id: mapping.externalId,
              sync_status: "manual",
            })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("employee_external_ids")
            .insert({
              employee_id: mapping.employeeId,
              system_type: systemType,
              external_id: mapping.externalId,
              sync_status: "manual",
            });
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employee-external-ids"] });
      queryClient.invalidateQueries({ queryKey: ["employees-with-external-ids"] });
      toast.success(`${variables.mappings.length} ansattnumre oppdatert`);
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere: " + error.message);
    },
  });
}

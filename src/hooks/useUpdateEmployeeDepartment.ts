import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpdateDepartmentParams {
  employeeId: string;
  departmentId: string | null;
  employeeName: string;
}

export function useUpdateEmployeeDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, departmentId }: UpdateDepartmentParams) => {
      const { error } = await supabase
        .from("profiles")
        .update({ department_id: departmentId })
        .eq("id", employeeId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success(`${variables.employeeName} flyttet til ny avdeling`);
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere avdeling: " + error.message);
    },
  });
}

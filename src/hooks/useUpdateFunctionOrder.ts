import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrderUpdate {
  id: string;
  sort_order: number;
}

export function useUpdateFunctionOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: OrderUpdate[]) => {
      // Update each function's sort_order
      for (const update of updates) {
        const { error } = await supabase
          .from("functions")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["functions"] });
      toast.success("Rekkefølge oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere rekkefølge: " + error.message);
    },
  });
}

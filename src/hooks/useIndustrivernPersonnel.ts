import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { IndustrivernPersonnel, IndustrivernRole } from "@/types/industrivern";

export function useIndustrivernPersonnel() {
  return useQuery({
    queryKey: ["industrivern-personnel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("industrivern_personnel")
        .select(`
          *,
          profiles (
            id,
            full_name,
            email,
            phone,
            avatar_url
          )
        `)
        .eq("is_active", true)
        .order("role");

      if (error) throw error;
      return data as IndustrivernPersonnel[];
    },
  });
}

export function useIndustrivernPersonnelByRole(role: IndustrivernRole) {
  return useQuery({
    queryKey: ["industrivern-personnel", role],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("industrivern_personnel")
        .select(`
          *,
          profiles (
            id,
            full_name,
            email,
            phone,
            avatar_url
          )
        `)
        .eq("role", role)
        .eq("is_active", true);

      if (error) throw error;
      return data as IndustrivernPersonnel[];
    },
  });
}

export function useAddIndustrivernPersonnel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (personnel: {
      profile_id: string;
      role: IndustrivernRole;
      is_deputy?: boolean;
      deputy_for?: string;
      emergency_phone?: string;
    }) => {
      const { data, error } = await supabase
        .from("industrivern_personnel")
        .insert(personnel)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["industrivern-personnel"] });
      toast.success("Personell lagt til industrivern");
    },
    onError: (error) => {
      console.error("Error adding personnel:", error);
      toast.error("Kunne ikke legge til personell");
    },
  });
}

export function useUpdateIndustrivernPersonnel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<IndustrivernPersonnel> & { id: string }) => {
      const { data, error } = await supabase
        .from("industrivern_personnel")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["industrivern-personnel"] });
      toast.success("Personell oppdatert");
    },
    onError: (error) => {
      console.error("Error updating personnel:", error);
      toast.error("Kunne ikke oppdatere personell");
    },
  });
}

export function useRemoveIndustrivernPersonnel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("industrivern_personnel")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["industrivern-personnel"] });
      toast.success("Personell fjernet fra industrivern");
    },
    onError: (error) => {
      console.error("Error removing personnel:", error);
      toast.error("Kunne ikke fjerne personell");
    },
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UpdateProfileInput {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string | null;
  avatar_url?: string | null;
  employee_type?: "fast" | "deltid" | "tilkalling" | "vikar" | "laerling" | "sesong" | null;
  department_id?: string | null;
  function_id?: string | null;
  start_date?: string | null;
  is_active?: boolean | null;
  pin_code?: string | null;
  // Extended profile fields
  date_of_birth?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
  employee_number?: string | null;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateProfileInput) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Profil oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere profil: " + error.message);
    },
  });
}

export function useDeactivateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: false })
        .eq("id", employeeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Ansatt deaktivert");
    },
    onError: (error) => {
      toast.error("Kunne ikke deaktivere ansatt: " + error.message);
    },
  });
}

export function useReactivateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: true })
        .eq("id", employeeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Ansatt reaktivert");
    },
    onError: (error) => {
      toast.error("Kunne ikke reaktivere ansatt: " + error.message);
    },
  });
}

export function useUpdatePinCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, pinCode }: { employeeId: string; pinCode: string }) => {
      if (!/^\d{4}$/.test(pinCode)) {
        throw new Error("PIN-kode må være 4 siffer");
      }

      const { error } = await supabase
        .from("profiles")
        .update({ pin_code: pinCode })
        .eq("id", employeeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("PIN-kode oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere PIN-kode: " + error.message);
    },
  });
}

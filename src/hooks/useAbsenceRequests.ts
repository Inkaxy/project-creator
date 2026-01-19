import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AbsenceRequest {
  id: string;
  employee_id: string;
  absence_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: "pending" | "approved" | "rejected";
  overlapping_shift_action: "keep" | "delete" | "open" | null;
  comment: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  absence_types?: {
    id: string;
    name: string;
    color: string;
    from_account: string | null;
  };
  profiles?: {
    id: string;
    full_name: string;
  };
}

export interface CreateAbsenceRequestInput {
  absence_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  overlapping_shift_action?: "keep" | "delete" | "open";
  comment?: string;
  employee_id?: string; // For admin creating on behalf of employee
}

export interface UpdateAbsenceRequestInput {
  id: string;
  absence_type_id?: string;
  start_date?: string;
  end_date?: string;
  total_days?: number;
  overlapping_shift_action?: "keep" | "delete" | "open";
  comment?: string;
}

export const useAbsenceRequests = (employeeId?: string) => {
  const { user, isAdminOrManager } = useAuth();

  return useQuery({
    queryKey: ["absence-requests", employeeId],
    queryFn: async () => {
      let query = supabase
        .from("absence_requests")
        .select(`
          *,
          absence_types (id, name, color, from_account),
          profiles!absence_requests_employee_id_fkey (id, full_name)
        `)
        .order("created_at", { ascending: false });

      if (employeeId) {
        query = query.eq("employee_id", employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as AbsenceRequest[];
    },
    enabled: !!user,
  });
};

export const usePendingAbsenceRequests = () => {
  const { user, isAdminOrManager } = useAuth();

  return useQuery({
    queryKey: ["absence-requests", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("absence_requests")
        .select(`
          *,
          absence_types (id, name, color, from_account),
          profiles!absence_requests_employee_id_fkey (id, full_name)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as unknown as AbsenceRequest[];
    },
    enabled: !!user && isAdminOrManager(),
  });
};

export const useCreateAbsenceRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateAbsenceRequestInput) => {
      if (!user) throw new Error("Ikke innlogget");

      const { employee_id, ...rest } = input;
      
      const { data, error } = await supabase
        .from("absence_requests")
        .insert({
          employee_id: employee_id || user.id, // Allow admin to set employee_id
          ...rest,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["absence-requests"] });
      toast.success(variables.employee_id ? "Fraværssøknad opprettet for ansatt" : "Fraværssøknad sendt");
    },
    onError: (error) => {
      toast.error("Kunne ikke sende søknad: " + error.message);
    },
  });
};

export const useUpdateAbsenceRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateAbsenceRequestInput) => {
      const { id, ...updateData } = input;
      
      const { data, error } = await supabase
        .from("absence_requests")
        .update(updateData)
        .eq("id", id)
        .select(`
          *,
          absence_types (id, name, color, from_account),
          profiles!absence_requests_employee_id_fkey (id, full_name)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absence-requests"] });
      toast.success("Fraværssøknad oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere søknad: " + error.message);
    },
  });
};

export const useRevertAbsenceToStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending" | "approved" | "rejected" }) => {
      const updateData: Record<string, unknown> = { status };
      
      // Clear approval data if reverting to pending
      if (status === "pending") {
        updateData.approved_by = null;
        updateData.approved_at = null;
        updateData.rejection_reason = null;
      }
      
      const { data, error } = await supabase
        .from("absence_requests")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absence-requests"] });
      toast.success("Status endret");
    },
    onError: (error) => {
      toast.error("Kunne ikke endre status: " + error.message);
    },
  });
};

export const useApproveAbsenceRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, approved, rejectionReason }: { id: string; approved: boolean; rejectionReason?: string }) => {
      if (!user) throw new Error("Ikke innlogget");

      const updateData: Record<string, unknown> = {
        status: approved ? "approved" : "rejected",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      };

      // Include rejection reason when rejecting
      if (!approved && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { data, error } = await supabase
        .from("absence_requests")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ["absence-requests"] });
      toast.success(approved ? "Fraværssøknad godkjent" : "Fraværssøknad avslått");
    },
    onError: (error) => {
      toast.error("Kunne ikke behandle søknad: " + error.message);
    },
  });
};

export const useRevokeApprovedAbsence = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      if (!user) throw new Error("Ikke innlogget");

      const updateData: Record<string, unknown> = {
        status: "rejected",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: reason || "Godkjenning tilbakekalt",
      };

      const { data, error } = await supabase
        .from("absence_requests")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absence-requests"] });
      toast.success("Godkjent ferie tilbakekalt");
    },
    onError: (error) => {
      toast.error("Kunne ikke tilbakekalle: " + error.message);
    },
  });
};

export const useDeleteAbsenceWithNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      // First update with reason (so it's logged) then delete
      if (reason) {
        await supabase
          .from("absence_requests")
          .update({ rejection_reason: reason })
          .eq("id", id);
      }

      const { error } = await supabase
        .from("absence_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absence-requests"] });
      toast.success("Fraværssøknad slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette søknad: " + error.message);
    },
  });
};

export const useDeleteAbsenceRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("absence_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absence-requests"] });
      toast.success("Fraværssøknad slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette søknad: " + error.message);
    },
  });
};

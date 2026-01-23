import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EmployeeOnboarding {
  id: string;
  email: string;
  full_name: string;
  employee_type: string | null;
  department_id: string | null;
  function_id: string | null;
  start_date: string | null;
  status: 'invited' | 'info_pending' | 'account_pending' | 'contract_pending' | 'signature_pending' | 'completed' | 'cancelled';
  invitation_sent_at: string | null;
  info_completed_at: string | null;
  account_created_at: string | null;
  contract_generated_at: string | null;
  contract_signed_at: string | null;
  invitation_token: string | null;
  profile_id: string | null;
  contract_document_id: string | null;
  contract_template_id: string | null;
  personal_number: string | null;
  bank_account_number: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  phone: string | null;
  date_of_birth: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  created_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  departments?: { id: string; name: string } | null;
  functions?: { id: string; name: string } | null;
}

export interface CreateOnboardingInput {
  email: string;
  full_name: string;
  employee_type?: string;
  department_id?: string;
  function_id?: string;
  start_date?: string;
  contract_template_id?: string;
  notes?: string;
}

export interface UpdateOnboardingInput {
  id: string;
  personal_number?: string;
  bank_account_number?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  phone?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  status?: string;
  info_completed_at?: string;
  account_created_at?: string;
  contract_generated_at?: string;
  contract_signed_at?: string;
  profile_id?: string;
  contract_document_id?: string;
}

export function useOnboardings(statusFilter?: string) {
  return useQuery({
    queryKey: ["onboardings", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("employee_onboardings")
        .select(`
          *,
          departments (id, name),
          functions:function_id (id, name)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EmployeeOnboarding[];
    },
  });
}

export function useOnboardingByToken(token: string | undefined) {
  return useQuery({
    queryKey: ["onboarding", "token", token],
    queryFn: async () => {
      if (!token) return null;
      
      const { data, error } = await supabase
        .from("employee_onboardings")
        .select(`
          *,
          departments (id, name),
          functions:function_id (id, name)
        `)
        .eq("invitation_token", token)
        .single();

      if (error) throw error;
      return data as EmployeeOnboarding;
    },
    enabled: !!token,
  });
}

export function useCreateOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOnboardingInput) => {
      // Generate unique invitation token
      const invitationToken = crypto.randomUUID();
      
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("employee_onboardings")
        .insert({
          ...input,
          invitation_token: invitationToken,
          invitation_sent_at: new Date().toISOString(),
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboardings"] });
      toast.success("Onboarding opprettet og invitasjon sendt");
    },
    onError: (error) => {
      console.error("Error creating onboarding:", error);
      toast.error("Kunne ikke opprette onboarding");
    },
  });
}

export function useUpdateOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateOnboardingInput) => {
      const { data, error } = await supabase
        .from("employee_onboardings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboardings"] });
    },
    onError: (error) => {
      console.error("Error updating onboarding:", error);
      toast.error("Kunne ikke oppdatere onboarding");
    },
  });
}

export function useCancelOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("employee_onboardings")
        .update({ status: "cancelled" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboardings"] });
      toast.success("Onboarding avbrutt");
    },
    onError: (error) => {
      console.error("Error cancelling onboarding:", error);
      toast.error("Kunne ikke avbryte onboarding");
    },
  });
}

export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // In a real implementation, this would trigger an edge function to resend email
      const { data, error } = await supabase
        .from("employee_onboardings")
        .update({ 
          invitation_sent_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboardings"] });
      toast.success("Invitasjon sendt på nytt");
    },
    onError: (error) => {
      console.error("Error resending invitation:", error);
      toast.error("Kunne ikke sende invitasjon på nytt");
    },
  });
}

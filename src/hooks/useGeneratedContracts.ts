import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface GeneratedContract {
  id: string;
  employee_id: string;
  template_id: string | null;
  onboarding_id: string | null;
  title: string;
  content: string;
  pdf_url: string | null;
  version: number | null;
  supersedes_id: string | null;
  status: 'draft' | 'pending_signature' | 'signed' | 'expired' | 'cancelled';
  employee_signed_at: string | null;
  employee_signature_ip: string | null;
  employee_read_confirmed_at: string | null;
  employer_signed_at: string | null;
  employer_signed_by: string | null;
  merged_data: Record<string, unknown> | null;
  sent_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  employee?: { id: string; full_name: string; email: string } | null;
  template?: { id: string; name: string } | null;
}

export interface CreateContractInput {
  employee_id: string;
  template_id?: string;
  onboarding_id?: string;
  title: string;
  content: string;
  merged_data: Record<string, unknown>;
  status?: 'draft' | 'pending_signature';
}

export interface SignContractInput {
  contract_id: string;
  signature_ip?: string;
}

// Fetch all contracts (for admin)
export function useGeneratedContracts() {
  return useQuery({
    queryKey: ["generated-contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generated_contracts")
        .select(`
          *,
          employee:profiles!generated_contracts_employee_id_fkey(id, full_name, email),
          template:contract_templates(id, name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GeneratedContract[];
    },
  });
}

// Fetch contracts for a specific employee
export function useEmployeeContracts(employeeId: string | undefined) {
  return useQuery({
    queryKey: ["generated-contracts", "employee", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generated_contracts")
        .select(`
          *,
          template:contract_templates(id, name)
        `)
        .eq("employee_id", employeeId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GeneratedContract[];
    },
    enabled: !!employeeId,
  });
}

// Fetch pending contracts for current user (for MyPage)
export function useMyPendingContracts(userId: string | undefined) {
  return useQuery({
    queryKey: ["generated-contracts", "pending", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generated_contracts")
        .select("*")
        .eq("employee_id", userId!)
        .eq("status", "pending_signature")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GeneratedContract[];
    },
    enabled: !!userId,
  });
}

// Fetch a single contract
export function useGeneratedContract(contractId: string | undefined) {
  return useQuery({
    queryKey: ["generated-contracts", contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generated_contracts")
        .select(`
          *,
          employee:profiles!generated_contracts_employee_id_fkey(id, full_name, email),
          template:contract_templates(id, name)
        `)
        .eq("id", contractId!)
        .single();

      if (error) throw error;
      return data as GeneratedContract;
    },
    enabled: !!contractId,
  });
}

// Create a new contract
export function useCreateGeneratedContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateContractInput) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("generated_contracts")
        .insert([{
          employee_id: input.employee_id,
          template_id: input.template_id,
          onboarding_id: input.onboarding_id,
          title: input.title,
          content: input.content,
          merged_data: input.merged_data as Json,
          status: input.status || 'draft',
          created_by: userData.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-contracts"] });
      toast.success("Kontrakt opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette kontrakt: " + error.message);
    },
  });
}

// Send contract for signing
export function useSendContractForSigning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractId: string) => {
      const { data, error } = await supabase
        .from("generated_contracts")
        .update({
          status: "pending_signature",
          sent_at: new Date().toISOString(),
        })
        .eq("id", contractId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-contracts"] });
      toast.success("Kontrakt sendt til signering");
    },
    onError: (error) => {
      toast.error("Kunne ikke sende kontrakt: " + error.message);
    },
  });
}

// Employee signs the contract
export function useSignContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contract_id, signature_ip }: SignContractInput) => {
      const { data, error } = await supabase
        .from("generated_contracts")
        .update({
          status: "signed",
          employee_signed_at: new Date().toISOString(),
          employee_signature_ip: signature_ip,
        })
        .eq("id", contract_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-contracts"] });
      toast.success("Kontrakt signert!");
    },
    onError: (error) => {
      toast.error("Kunne ikke signere kontrakt: " + error.message);
    },
  });
}

// Confirm contract has been read
export function useConfirmContractRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractId: string) => {
      const { data, error } = await supabase
        .from("generated_contracts")
        .update({
          employee_read_confirmed_at: new Date().toISOString(),
        })
        .eq("id", contractId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-contracts"] });
    },
  });
}

// Cancel a contract
export function useCancelContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractId: string) => {
      const { data, error } = await supabase
        .from("generated_contracts")
        .update({ status: "cancelled" })
        .eq("id", contractId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-contracts"] });
      toast.success("Kontrakt avbrutt");
    },
    onError: (error) => {
      toast.error("Kunne ikke avbryte kontrakt: " + error.message);
    },
  });
}

// Helper: Merge template with employee data
export function mergeContractTemplate(
  template: string,
  variables: Record<string, string | number | null | undefined>
): string {
  let result = template;
  
  // Replace simple variables
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, String(value ?? ''));
  }
  
  // Handle conditional blocks [[IF condition]]...[[ENDIF]]
  const conditionalRegex = /\[\[IF\s+(\w+)=(\w+)\]\]([\s\S]*?)\[\[ENDIF\]\]/g;
  result = result.replace(conditionalRegex, (_, varName, expectedValue, content) => {
    const actualValue = String(variables[varName] ?? '');
    return actualValue === expectedValue ? content : '';
  });
  
  return result;
}

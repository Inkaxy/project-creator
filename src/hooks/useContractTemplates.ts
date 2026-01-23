import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ContractTemplate {
  id: string;
  name: string;
  employee_type: string | null;
  content: string;
  is_default: boolean | null;
  is_active: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateContractTemplateInput {
  name: string;
  employee_type?: string;
  content: string;
  is_default?: boolean;
}

export interface UpdateContractTemplateInput {
  id: string;
  name?: string;
  employee_type?: string;
  content?: string;
  is_default?: boolean;
  is_active?: boolean;
}

export function useContractTemplates() {
  return useQuery({
    queryKey: ["contract-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as ContractTemplate[];
    },
  });
}

export function useContractTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ["contract-templates", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as ContractTemplate;
    },
    enabled: !!id,
  });
}

export function useCreateContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateContractTemplateInput) => {
      const { data: { user } } = await supabase.auth.getUser();

      // If setting as default, unset other defaults first
      if (input.is_default) {
        await supabase
          .from("contract_templates")
          .update({ is_default: false })
          .eq("is_default", true);
      }

      const { data, error } = await supabase
        .from("contract_templates")
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-templates"] });
      toast.success("Kontraktmal opprettet");
    },
    onError: (error) => {
      console.error("Error creating template:", error);
      toast.error("Kunne ikke opprette kontraktmal");
    },
  });
}

export function useUpdateContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateContractTemplateInput) => {
      // If setting as default, unset other defaults first
      if (updates.is_default) {
        await supabase
          .from("contract_templates")
          .update({ is_default: false })
          .eq("is_default", true)
          .neq("id", id);
      }

      const { data, error } = await supabase
        .from("contract_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-templates"] });
      toast.success("Kontraktmal oppdatert");
    },
    onError: (error) => {
      console.error("Error updating template:", error);
      toast.error("Kunne ikke oppdatere kontraktmal");
    },
  });
}

export function useDeleteContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete by setting is_active to false
      const { data, error } = await supabase
        .from("contract_templates")
        .update({ is_active: false })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-templates"] });
      toast.success("Kontraktmal slettet");
    },
    onError: (error) => {
      console.error("Error deleting template:", error);
      toast.error("Kunne ikke slette kontraktmal");
    },
  });
}

// Helper function to replace template variables
export function generateContractFromTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  }
  
  return result;
}

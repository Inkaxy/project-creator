import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type DocumentCategory = 
  | "employment" 
  | "salary" 
  | "leave" 
  | "training" 
  | "reviews" 
  | "disciplinary" 
  | "termination";

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  category: DocumentCategory;
  name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  is_signed: boolean | null;
  signed_at: string | null;
  signed_by: string | null;
  uploaded_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentInput {
  employee_id: string;
  category: DocumentCategory;
  name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  notes?: string;
}

export const DOCUMENT_CATEGORIES: Record<DocumentCategory, { label: string; description: string }> = {
  employment: { label: "Ansettelse", description: "Arbeidsavtale, endringsavtaler, stillingsbeskrivelse" },
  salary: { label: "Lønn og vilkår", description: "Lønnsavtale, endringer i lønn eller stillingsprosent" },
  leave: { label: "Fravær og permisjon", description: "Permisjonssøknader og vedtak" },
  training: { label: "Kurs og opplæring", description: "Fullførte kurs, kursbevis, sertifikater" },
  reviews: { label: "Samtaler og oppfølging", description: "Medarbeidersamtaler, referater" },
  disciplinary: { label: "Avvik og disiplin", description: "Skriftlige advarsler, referater" },
  termination: { label: "Avslutning", description: "Oppsigelse, sluttattest, sluttdato" },
};

export function useEmployeeDocuments(employeeId?: string) {
  return useQuery({
    queryKey: ["employee-documents", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];

      const { data, error } = await supabase
        .from("employee_documents")
        .select("*")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EmployeeDocument[];
    },
    enabled: !!employeeId,
  });
}

export function useEmployeeDocumentsByCategory(employeeId?: string) {
  const { data: documents = [], ...rest } = useEmployeeDocuments(employeeId);

  const byCategory = Object.keys(DOCUMENT_CATEGORIES).reduce((acc, cat) => {
    acc[cat as DocumentCategory] = documents.filter(d => d.category === cat);
    return acc;
  }, {} as Record<DocumentCategory, EmployeeDocument[]>);

  return { data: byCategory, documents, ...rest };
}

export function useCreateEmployeeDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDocumentInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("employee_documents")
        .insert({
          ...input,
          uploaded_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employee-documents", variables.employee_id] });
      toast.success("Dokument lastet opp");
    },
    onError: (error) => {
      toast.error("Kunne ikke laste opp dokument: " + error.message);
    },
  });
}

export function useUpdateEmployeeDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<CreateDocumentInput>) => {
      const { data, error } = await supabase
        .from("employee_documents")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-documents"] });
      toast.success("Dokument oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere dokument: " + error.message);
    },
  });
}

export function useDeleteEmployeeDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employee_documents")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-documents"] });
      toast.success("Dokument slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette dokument: " + error.message);
    },
  });
}

export function useSignDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("employee_documents")
        .update({
          is_signed: true,
          signed_at: new Date().toISOString(),
          signed_by: user?.id,
        })
        .eq("id", documentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-documents"] });
      toast.success("Dokument signert");
    },
    onError: (error) => {
      toast.error("Kunne ikke signere dokument: " + error.message);
    },
  });
}

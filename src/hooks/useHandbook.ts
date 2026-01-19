import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Handbook {
  id: string;
  title: string;
  version: string;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  published_by: string | null;
  effective_date: string | null;
  created_at: string;
  updated_at: string;
  logo_url: string | null;
  footer_text: string | null;
}

export interface HandbookChapter {
  id: string;
  handbook_id: string;
  title: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_visible: boolean;
  requires_acknowledgment: boolean;
  created_at: string;
  updated_at: string;
  sections?: HandbookSection[];
}

export interface HandbookSection {
  id: string;
  chapter_id: string;
  title: string;
  slug: string;
  content: string;
  content_type: string;
  sort_order: number;
  is_visible: boolean;
  requires_acknowledgment: boolean;
  is_legal_requirement: boolean;
  legal_reference: string | null;
  last_reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  attachments?: HandbookAttachment[];
}

export interface HandbookAcknowledgment {
  id: string;
  employee_id: string;
  handbook_id: string;
  section_id: string | null;
  version: string;
  acknowledged_at: string;
  signature_method: string;
}

export interface HandbookAttachment {
  id: string;
  section_id: string;
  filename: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  description: string | null;
}

export interface HandbookVersion {
  id: string;
  handbook_id: string;
  version: string;
  changes_summary: string | null;
  published_at: string;
  published_by: string | null;
}

// Fetch the active handbook
export function useHandbook() {
  return useQuery({
    queryKey: ["handbook"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("handbook")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Handbook | null;
    },
  });
}

// Fetch chapters with sections
export function useHandbookChapters(handbookId: string | undefined) {
  return useQuery({
    queryKey: ["handbook-chapters", handbookId],
    queryFn: async () => {
      if (!handbookId) return [];
      
      const { data: chapters, error } = await supabase
        .from("handbook_chapters")
        .select(`
          *,
          sections:handbook_sections(
            *,
            attachments:handbook_attachments(*)
          )
        `)
        .eq("handbook_id", handbookId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      
      // Sort sections within chapters
      return (chapters as HandbookChapter[]).map(chapter => ({
        ...chapter,
        sections: chapter.sections?.sort((a, b) => a.sort_order - b.sort_order)
      }));
    },
    enabled: !!handbookId,
  });
}

// Fetch a single section
export function useHandbookSection(sectionId: string | undefined) {
  return useQuery({
    queryKey: ["handbook-section", sectionId],
    queryFn: async () => {
      if (!sectionId) return null;
      
      const { data, error } = await supabase
        .from("handbook_sections")
        .select(`
          *,
          attachments:handbook_attachments(*),
          chapter:handbook_chapters(title, icon)
        `)
        .eq("id", sectionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!sectionId,
  });
}

// Fetch user acknowledgments
export function useMyAcknowledgments(handbookId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["handbook-acknowledgments", handbookId, user?.id],
    queryFn: async () => {
      if (!handbookId || !user?.id) return [];
      
      const { data, error } = await supabase
        .from("handbook_acknowledgments")
        .select("*")
        .eq("handbook_id", handbookId)
        .eq("employee_id", user.id);

      if (error) throw error;
      return data as HandbookAcknowledgment[];
    },
    enabled: !!handbookId && !!user?.id,
  });
}

// Fetch all acknowledgment statuses (admin)
export function useAcknowledgmentStatuses(handbookId: string | undefined) {
  return useQuery({
    queryKey: ["handbook-acknowledgment-statuses", handbookId],
    queryFn: async () => {
      if (!handbookId) return [];
      
      // Get handbook version
      const { data: handbook } = await supabase
        .from("handbook")
        .select("version")
        .eq("id", handbookId)
        .single();
      
      if (!handbook) return [];
      
      // Get all active employees
      const { data: employees, error: empError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          department_id,
          departments:departments(name)
        `)
        .eq("is_active", true);

      if (empError) throw empError;
      
      // Get all acknowledgments for this handbook
      const { data: acknowledgments, error: ackError } = await supabase
        .from("handbook_acknowledgments")
        .select("*")
        .eq("handbook_id", handbookId)
        .is("section_id", null);

      if (ackError) throw ackError;
      
      // Map employees with their acknowledgment status
      return employees.map(emp => {
        const ack = acknowledgments?.find(a => a.employee_id === emp.id);
        let status: "acknowledged" | "outdated" | "pending" = "pending";
        
        if (ack) {
          status = ack.version === handbook.version ? "acknowledged" : "outdated";
        }
        
        return {
          employee_id: emp.id,
          full_name: emp.full_name,
          email: emp.email,
          department_id: emp.department_id,
          department_name: (emp.departments as any)?.name,
          current_version: handbook.version,
          acknowledged_version: ack?.version || null,
          acknowledged_at: ack?.acknowledged_at || null,
          status,
        };
      });
    },
    enabled: !!handbookId,
  });
}

// Fetch version history
export function useHandbookVersions(handbookId: string | undefined) {
  return useQuery({
    queryKey: ["handbook-versions", handbookId],
    queryFn: async () => {
      if (!handbookId) return [];
      
      const { data, error } = await supabase
        .from("handbook_versions")
        .select(`
          *,
          publisher:profiles!handbook_versions_published_by_fkey(full_name)
        `)
        .eq("handbook_id", handbookId)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as (HandbookVersion & { publisher: { full_name: string } | null })[];
    },
    enabled: !!handbookId,
  });
}

// Create or update handbook
export function useUpsertHandbook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (handbook: Partial<Handbook> & { id?: string }) => {
      if (handbook.id) {
        const { data, error } = await supabase
          .from("handbook")
          .update(handbook)
          .eq("id", handbook.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("handbook")
          .insert(handbook)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handbook"] });
      toast.success("Håndbok oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere håndbok: " + error.message);
    },
  });
}

// Create chapter
export function useCreateChapter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (chapter: Partial<HandbookChapter>) => {
      const { data, error } = await supabase
        .from("handbook_chapters")
        .insert(chapter)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["handbook-chapters", variables.handbook_id] });
      toast.success("Kapittel opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette kapittel: " + error.message);
    },
  });
}

// Update chapter
export function useUpdateChapter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HandbookChapter> & { id: string }) => {
      const { data, error } = await supabase
        .from("handbook_chapters")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handbook-chapters"] });
      toast.success("Kapittel oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere kapittel: " + error.message);
    },
  });
}

// Delete chapter
export function useDeleteChapter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (chapterId: string) => {
      const { error } = await supabase
        .from("handbook_chapters")
        .delete()
        .eq("id", chapterId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handbook-chapters"] });
      toast.success("Kapittel slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette kapittel: " + error.message);
    },
  });
}

// Create section
export function useCreateSection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (section: Partial<HandbookSection>) => {
      const { data, error } = await supabase
        .from("handbook_sections")
        .insert(section)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handbook-chapters"] });
      toast.success("Seksjon opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette seksjon: " + error.message);
    },
  });
}

// Update section
export function useUpdateSection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HandbookSection> & { id: string }) => {
      const { data, error } = await supabase
        .from("handbook_sections")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handbook-chapters"] });
      queryClient.invalidateQueries({ queryKey: ["handbook-section"] });
      toast.success("Seksjon oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere seksjon: " + error.message);
    },
  });
}

// Delete section
export function useDeleteSection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sectionId: string) => {
      const { error } = await supabase
        .from("handbook_sections")
        .delete()
        .eq("id", sectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handbook-chapters"] });
      toast.success("Seksjon slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette seksjon: " + error.message);
    },
  });
}

// Acknowledge handbook
export function useAcknowledgeHandbook() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      handbookId, 
      version, 
      sectionId,
      signatureMethod = "click" 
    }: { 
      handbookId: string; 
      version: string; 
      sectionId?: string;
      signatureMethod?: string;
    }) => {
      if (!user?.id) throw new Error("Ikke logget inn");
      
      const { data, error } = await supabase
        .from("handbook_acknowledgments")
        .insert({
          employee_id: user.id,
          handbook_id: handbookId,
          section_id: sectionId || null,
          version,
          signature_method: signatureMethod,
          user_agent: navigator.userAgent,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handbook-acknowledgments"] });
      queryClient.invalidateQueries({ queryKey: ["handbook-acknowledgment-statuses"] });
      toast.success("Håndbok signert");
    },
    onError: (error) => {
      toast.error("Kunne ikke signere: " + error.message);
    },
  });
}

// Publish handbook
export function usePublishHandbook() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      handbookId, 
      newVersion, 
      changesSummary 
    }: { 
      handbookId: string; 
      newVersion: string; 
      changesSummary?: string;
    }) => {
      // Get current handbook content for snapshot
      const { data: chapters } = await supabase
        .from("handbook_chapters")
        .select(`*, sections:handbook_sections(*)`)
        .eq("handbook_id", handbookId);
      
      // Create version record
      const { error: versionError } = await supabase
        .from("handbook_versions")
        .insert({
          handbook_id: handbookId,
          version: newVersion,
          changes_summary: changesSummary,
          content_snapshot: chapters,
          published_by: user?.id,
        });
      
      if (versionError) throw versionError;
      
      // Update handbook status
      const { data, error } = await supabase
        .from("handbook")
        .update({
          status: "published",
          version: newVersion,
          published_at: new Date().toISOString(),
          published_by: user?.id,
        })
        .eq("id", handbookId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handbook"] });
      queryClient.invalidateQueries({ queryKey: ["handbook-versions"] });
      toast.success("Håndbok publisert");
    },
    onError: (error) => {
      toast.error("Kunne ikke publisere: " + error.message);
    },
  });
}

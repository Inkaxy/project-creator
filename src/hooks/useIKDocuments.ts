import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface IKDocumentFolder {
  id: string;
  parent_id: string | null;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_system: boolean;
  is_required: boolean;
  legal_reference: string | null;
  created_at: string;
  updated_at: string;
  children?: IKDocumentFolder[];
  document_count?: number;
}

export interface IKDocument {
  id: string;
  folder_id: string;
  document_type: string;
  name: string;
  description: string | null;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  file_mime_type: string | null;
  version_number: string;
  change_description: string | null;
  status: string;
  review_interval_days: number;
  next_review_date: string | null;
  last_reviewed_at: string | null;
  last_reviewed_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  linked_checklist_id: string | null;
  is_required: boolean;
  legal_reference: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  folder?: IKDocumentFolder;
}

export interface IKDocumentVersion {
  id: string;
  document_id: string;
  version_number: string;
  content: string | null;
  file_url: string | null;
  change_description: string | null;
  created_by: string | null;
  created_at: string;
}

// Fetch all folders
export function useIKFolders() {
  return useQuery({
    queryKey: ["ik-folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ik_document_folders")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as IKDocumentFolder[];
    },
  });
}

// Fetch folders with nested structure and document counts
export function useIKFoldersWithHierarchy() {
  const { data: folders = [] } = useIKFolders();
  const { data: documents = [] } = useIKDocuments();

  // Build tree structure
  const buildTree = (folders: IKDocumentFolder[]): IKDocumentFolder[] => {
    const folderMap = new Map<string, IKDocumentFolder>();
    const rootFolders: IKDocumentFolder[] = [];

    // Count documents per folder
    const documentCounts = new Map<string, number>();
    documents.forEach((doc) => {
      const count = documentCounts.get(doc.folder_id) || 0;
      documentCounts.set(doc.folder_id, count + 1);
    });

    // Initialize folders
    folders.forEach((folder) => {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
        document_count: documentCounts.get(folder.id) || 0,
      });
    });

    // Build hierarchy
    folders.forEach((folder) => {
      const currentFolder = folderMap.get(folder.id)!;
      if (folder.parent_id) {
        const parentFolder = folderMap.get(folder.parent_id);
        if (parentFolder) {
          parentFolder.children!.push(currentFolder);
          // Add child document counts to parent
          parentFolder.document_count =
            (parentFolder.document_count || 0) + (currentFolder.document_count || 0);
        }
      } else {
        rootFolders.push(currentFolder);
      }
    });

    return rootFolders.sort((a, b) => a.sort_order - b.sort_order);
  };

  return {
    folders: buildTree(folders),
    isLoading: !folders.length && !documents.length,
  };
}

// Fetch all documents
export function useIKDocuments(folderId?: string | null) {
  return useQuery({
    queryKey: ["ik-documents", folderId],
    queryFn: async () => {
      let query = supabase
        .from("ik_documents")
        .select("*, folder:ik_document_folders(*)")
        .order("created_at", { ascending: false });

      if (folderId) {
        query = query.eq("folder_id", folderId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as IKDocument[];
    },
  });
}

// Fetch a single document
export function useIKDocument(documentId: string | null) {
  return useQuery({
    queryKey: ["ik-document", documentId],
    queryFn: async () => {
      if (!documentId) return null;

      const { data, error } = await supabase
        .from("ik_documents")
        .select("*, folder:ik_document_folders(*)")
        .eq("id", documentId)
        .single();

      if (error) throw error;
      return data as IKDocument;
    },
    enabled: !!documentId,
  });
}

// Fetch document versions
export function useIKDocumentVersions(documentId: string | null) {
  return useQuery({
    queryKey: ["ik-document-versions", documentId],
    queryFn: async () => {
      if (!documentId) return [];

      const { data, error } = await supabase
        .from("ik_document_versions")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as IKDocumentVersion[];
    },
    enabled: !!documentId,
  });
}

// Fetch documents needing review
export function useIKDocumentsNeedingReview() {
  return useQuery({
    queryKey: ["ik-documents-review"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("ik_documents")
        .select("*, folder:ik_document_folders(*)")
        .or(`next_review_date.lte.${today},status.eq.review_pending`)
        .neq("status", "archived");

      if (error) throw error;
      return data as IKDocument[];
    },
  });
}

// Stats about documents
export function useIKDocumentStats() {
  const { data: documents = [] } = useIKDocuments();
  const { data: reviewDocs = [] } = useIKDocumentsNeedingReview();

  return {
    total: documents.length,
    active: documents.filter((d) => d.status === "active").length,
    draft: documents.filter((d) => d.status === "draft").length,
    needsReview: reviewDocs.length,
    archived: documents.filter((d) => d.status === "archived").length,
  };
}

// Create document mutation
export function useCreateIKDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (document: Partial<IKDocument>) => {
      const { data, error } = await supabase
        .from("ik_documents")
        .insert([{
          folder_id: document.folder_id,
          document_type: document.document_type || 'routine',
          name: document.name,
          description: document.description,
          content: document.content,
          file_url: document.file_url,
          status: document.status || 'draft',
          created_by: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      // Create initial version
      if (data) {
        await supabase.from("ik_document_versions").insert({
          document_id: data.id,
          version_number: "1.0",
          content: document.content,
          file_url: document.file_url,
          change_description: "Initial version",
          created_by: user?.id,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-documents"] });
      toast.success("Dokument opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette dokument");
      console.error(error);
    },
  });
}

// Update document mutation
export function useUpdateIKDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
      createVersion = false,
    }: {
      id: string;
      updates: Partial<IKDocument>;
      createVersion?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("ik_documents")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Create new version if requested
      if (createVersion && data) {
        await supabase.from("ik_document_versions").insert({
          document_id: data.id,
          version_number: updates.version_number || data.version_number,
          content: updates.content || data.content,
          file_url: updates.file_url || data.file_url,
          change_description: updates.change_description,
          created_by: user?.id,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-documents"] });
      queryClient.invalidateQueries({ queryKey: ["ik-document"] });
      queryClient.invalidateQueries({ queryKey: ["ik-document-versions"] });
      toast.success("Dokument oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere dokument");
      console.error(error);
    },
  });
}

// Delete document mutation
export function useDeleteIKDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ik_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-documents"] });
      toast.success("Dokument slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette dokument");
      console.error(error);
    },
  });
}

// Mark document as read
export function useMarkDocumentRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      documentId,
      versionNumber,
    }: {
      documentId: string;
      versionNumber: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("ik_document_reads")
        .upsert({
          document_id: documentId,
          version_number: versionNumber,
          employee_id: user.id,
          acknowledged: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-document-reads"] });
      toast.success("Dokument bekreftet lest");
    },
    onError: (error) => {
      toast.error("Kunne ikke bekrefte lesing");
      console.error(error);
    },
  });
}

// Check if current user has read a document
export function useHasReadDocument(documentId: string | null, versionNumber: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["ik-document-read", documentId, versionNumber, user?.id],
    queryFn: async () => {
      if (!user || !documentId || !versionNumber) return false;

      const { data, error } = await supabase
        .from("ik_document_reads")
        .select("id")
        .eq("document_id", documentId)
        .eq("version_number", versionNumber)
        .eq("employee_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!documentId && !!versionNumber,
  });
}

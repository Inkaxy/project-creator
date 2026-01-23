import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EquipmentDocument {
  id: string;
  equipment_id: string;
  document_type: string;
  name: string;
  file_url: string;
  expires_at: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
  uploader?: {
    full_name: string;
  } | null;
}

export const DOCUMENT_TYPES = [
  { value: "datasheet", label: "Datablad", icon: "📊" },
  { value: "manual", label: "Manual", icon: "📖" },
  { value: "service_report", label: "Servicerapport", icon: "🔧" },
  { value: "invoice", label: "Faktura", icon: "💰" },
  { value: "certificate", label: "Sertifikat", icon: "📜" },
  { value: "warranty", label: "Garanti", icon: "🛡️" },
  { value: "safety_datasheet", label: "Sikkerhetsdatablad", icon: "⚠️" },
  { value: "cleaning_procedure", label: "Rengjøringsprosedyre", icon: "🧹" },
  { value: "image", label: "Bilde", icon: "📷" },
  { value: "other", label: "Annet", icon: "📄" },
] as const;

export function getDocumentTypeInfo(type: string) {
  const found = DOCUMENT_TYPES.find((t) => t.value === type);
  return found || { value: "other", label: "Annet", icon: "📄" };
}

export function useEquipmentDocuments(equipmentId: string | null) {
  return useQuery({
    queryKey: ["equipment_documents", equipmentId],
    queryFn: async () => {
      if (!equipmentId) return [];
      const { data, error } = await supabase
        .from("equipment_documents")
        .select(`
          *,
          uploader:uploaded_by(full_name)
        `)
        .eq("equipment_id", equipmentId)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data as EquipmentDocument[];
    },
    enabled: !!equipmentId,
  });
}

export function useUploadEquipmentDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      equipmentId,
      file,
      documentType,
      name,
      expiresAt,
    }: {
      equipmentId: string;
      file: File;
      documentType: string;
      name: string;
      expiresAt?: string | null;
    }) => {
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${equipmentId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("equipment-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("equipment-documents")
        .getPublicUrl(filePath);

      // Save to database
      const { data, error: dbError } = await supabase
        .from("equipment_documents")
        .insert({
          equipment_id: equipmentId,
          document_type: documentType,
          name: name,
          file_url: urlData.publicUrl,
          expires_at: expiresAt || null,
          uploaded_by: userId || null,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["equipment_documents", variables.equipmentId] });
      toast({
        title: "Dokument lastet opp",
        description: "Dokumentet ble lagret",
      });
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Feil ved opplasting",
        description: "Kunne ikke laste opp dokumentet",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteEquipmentDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, equipmentId }: { id: string; equipmentId: string }) => {
      const { error } = await supabase
        .from("equipment_documents")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["equipment_documents", variables.equipmentId] });
      toast({
        title: "Dokument slettet",
        description: "Dokumentet ble fjernet",
      });
    },
    onError: () => {
      toast({
        title: "Feil",
        description: "Kunne ikke slette dokumentet",
        variant: "destructive",
      });
    },
  });
}

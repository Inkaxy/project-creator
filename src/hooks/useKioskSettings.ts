import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface KioskSettings {
  id: string;
  company_name: string | null;
  company_logo_url: string | null;
  show_clock_seconds: boolean;
  require_pin_for_all: boolean;
  auto_logout_seconds: number;
  show_planned_shifts: boolean;
  show_active_workers: boolean;
  show_all_employees: boolean;
  allow_clock_without_shift: boolean;
  primary_color: string | null;
  welcome_message: string | null;
  created_at: string;
  updated_at: string;
}

export function useKioskSettings() {
  return useQuery({
    queryKey: ["kiosk-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kiosk_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      return data as KioskSettings;
    },
  });
}

export function useUpdateKioskSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Omit<KioskSettings, "id" | "created_at" | "updated_at">>) => {
      // Get the existing settings ID first
      const { data: existing } = await supabase
        .from("kiosk_settings")
        .select("id")
        .limit(1)
        .single();

      if (!existing) throw new Error("No kiosk settings found");

      const { data, error } = await supabase
        .from("kiosk_settings")
        .update(updates)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kiosk-settings"] });
      toast.success("Kiosk-innstillinger oppdatert");
    },
    onError: (error) => {
      console.error("Failed to update kiosk settings:", error);
      toast.error("Kunne ikke oppdatere innstillinger");
    },
  });
}

export function useUploadKioskLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `kiosk-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("public-assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // If bucket doesn't exist, we need to handle this gracefully
        console.error("Upload error:", uploadError);
        throw new Error("Kunne ikke laste opp logo. Sjekk at storage er konfigurert.");
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("public-assets")
        .getPublicUrl(filePath);

      // Update settings with new logo URL
      const { data: existing } = await supabase
        .from("kiosk_settings")
        .select("id")
        .limit(1)
        .single();

      if (!existing) throw new Error("No kiosk settings found");

      const { error: updateError } = await supabase
        .from("kiosk_settings")
        .update({ company_logo_url: publicUrl })
        .eq("id", existing.id);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kiosk-settings"] });
      toast.success("Logo lastet opp");
    },
    onError: (error) => {
      console.error("Failed to upload logo:", error);
      toast.error("Kunne ikke laste opp logo");
    },
  });
}

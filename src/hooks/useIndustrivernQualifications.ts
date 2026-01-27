import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { IndustrivernQualification, PersonnelQualification } from "@/types/industrivern";

export function useIndustrivernQualifications() {
  return useQuery({
    queryKey: ["industrivern-qualifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("industrivern_qualifications")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as IndustrivernQualification[];
    },
  });
}

export function usePersonnelQualifications(profileId?: string) {
  return useQuery({
    queryKey: ["personnel-qualifications", profileId],
    queryFn: async () => {
      let query = supabase
        .from("personnel_qualifications")
        .select(`
          *,
          industrivern_qualifications (*)
        `)
        .order("achieved_date", { ascending: false });

      if (profileId) {
        query = query.eq("profile_id", profileId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PersonnelQualification[];
    },
  });
}

export function useExpiringQualifications(daysAhead = 60) {
  return useQuery({
    queryKey: ["personnel-qualifications", "expiring", daysAhead],
    queryFn: async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);
      const today = new Date().toISOString().split("T")[0];
      const future = futureDate.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("personnel_qualifications")
        .select(`
          *,
          industrivern_qualifications (*),
          profiles:profile_id (
            id,
            full_name,
            email
          )
        `)
        .not("expires_date", "is", null)
        .gte("expires_date", today)
        .lte("expires_date", future)
        .order("expires_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function useAddPersonnelQualification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (qualification: {
      profile_id: string;
      qualification_id: string;
      achieved_date: string;
      expires_date?: string;
      certificate_number?: string;
      certificate_url?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("personnel_qualifications")
        .insert(qualification)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personnel-qualifications"] });
      toast.success("Kvalifikasjon registrert");
    },
    onError: (error) => {
      console.error("Error adding qualification:", error);
      toast.error("Kunne ikke registrere kvalifikasjon");
    },
  });
}

export function useUpdatePersonnelQualification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<PersonnelQualification> & { id: string }) => {
      const { data, error } = await supabase
        .from("personnel_qualifications")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personnel-qualifications"] });
      toast.success("Kvalifikasjon oppdatert");
    },
    onError: (error) => {
      console.error("Error updating qualification:", error);
      toast.error("Kunne ikke oppdatere kvalifikasjon");
    },
  });
}

export function useVerifyQualification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("personnel_qualifications")
        .update({
          verified_by: user?.id,
          verified_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personnel-qualifications"] });
      toast.success("Kvalifikasjon verifisert");
    },
    onError: (error) => {
      console.error("Error verifying qualification:", error);
      toast.error("Kunne ikke verifisere kvalifikasjon");
    },
  });
}

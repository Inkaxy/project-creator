import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RiskAssessment {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  probability: number;
  consequence: number;
  risk_score: number;
  current_measures: string | null;
  planned_measures: string | null;
  responsible: string | null;
  review_date: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  responsible_person?: { id: string; full_name: string } | null;
}

// Fetch all risk assessments
export function useRiskAssessments() {
  return useQuery({
    queryKey: ["risk-assessments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_assessments")
        .select(`
          *,
          responsible_person:profiles!risk_assessments_responsible_fkey (id, full_name)
        `)
        .eq("status", "active")
        .order("risk_score", { ascending: false });

      if (error) throw error;
      return data as unknown as RiskAssessment[];
    },
  });
}

// Create a risk assessment
export function useCreateRiskAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      category?: string;
      probability: number;
      consequence: number;
      current_measures?: string;
      planned_measures?: string;
      responsible?: string;
      review_date?: string;
      created_by: string;
    }) => {
      const { data: assessment, error } = await supabase
        .from("risk_assessments")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return assessment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-assessments"] });
      toast.success("Risiko opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette risiko: " + error.message);
    },
  });
}

// Update a risk assessment
export function useUpdateRiskAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<RiskAssessment> & { id: string }) => {
      const { error } = await supabase
        .from("risk_assessments")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-assessments"] });
      toast.success("Risiko oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere risiko: " + error.message);
    },
  });
}

// Delete a risk assessment (soft delete)
export function useDeleteRiskAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("risk_assessments")
        .update({ status: "archived" })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-assessments"] });
      toast.success("Risiko slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette risiko: " + error.message);
    },
  });
}

// Get risk level from score
export function getRiskLevel(score: number): { level: string; color: string } {
  if (score >= 15) return { level: "Kritisk", color: "destructive" };
  if (score >= 8) return { level: "Høy", color: "warning" };
  if (score >= 4) return { level: "Medium", color: "secondary" };
  return { level: "Lav", color: "success" };
}

// Get high risk count for dashboard
export function useHighRiskCount() {
  return useQuery({
    queryKey: ["high-risk-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_assessments")
        .select("probability, consequence")
        .eq("status", "active");

      if (error) throw error;
      
      // Count risks with score >= 15 (critical)
      const highRiskCount = data.filter(r => r.probability * r.consequence >= 15).length;
      return highRiskCount;
    },
  });
}

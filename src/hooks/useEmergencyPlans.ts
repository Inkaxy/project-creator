import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { EmergencyPlan, AlertPlan, ActionCard } from "@/types/industrivern";

// Emergency Plans
export function useEmergencyPlans() {
  return useQuery({
    queryKey: ["emergency-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_plans")
        .select("*")
        .order("version", { ascending: false });

      if (error) throw error;
      return data as EmergencyPlan[];
    },
  });
}

export function useActiveEmergencyPlan() {
  return useQuery({
    queryKey: ["emergency-plans", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_plans")
        .select("*")
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;
      return data as EmergencyPlan | null;
    },
  });
}

export function useCreateEmergencyPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: {
      organization_chart?: Record<string, unknown> | null;
    }) => {
      // Get highest version number
      const { data: existing } = await supabase
        .from("emergency_plans")
        .select("version")
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      const newVersion = (existing?.version || 0) + 1;

      const { data, error } = await supabase
        .from("emergency_plans")
        .insert({
          organization_chart: plan.organization_chart as unknown as undefined,
          version: newVersion,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-plans"] });
      toast.success("Ny beredskapsplan opprettet");
    },
    onError: (error) => {
      console.error("Error creating plan:", error);
      toast.error("Kunne ikke opprette beredskapsplan");
    },
  });
}

export function useActivateEmergencyPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Archive current active plan
      await supabase
        .from("emergency_plans")
        .update({ status: "archived" })
        .eq("status", "active");

      // Activate new plan
      const { data, error } = await supabase
        .from("emergency_plans")
        .update({
          status: "active",
          approved_by: user?.id,
          approved_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-plans"] });
      toast.success("Beredskapsplan aktivert");
    },
    onError: (error) => {
      console.error("Error activating plan:", error);
      toast.error("Kunne ikke aktivere beredskapsplan");
    },
  });
}

// Alert Plans
export function useAlertPlans(emergencyPlanId?: string) {
  return useQuery({
    queryKey: ["alert-plans", emergencyPlanId],
    queryFn: async () => {
      let query = supabase
        .from("alert_plans")
        .select("*")
        .order("incident_type");

      if (emergencyPlanId) {
        query = query.eq("emergency_plan_id", emergencyPlanId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AlertPlan[];
    },
    enabled: !emergencyPlanId || !!emergencyPlanId,
  });
}

export function useCreateAlertPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: {
      emergency_plan_id?: string;
      incident_type: string;
      alert_sequence: AlertPlan["alert_sequence"];
      notify_neighbors?: boolean;
      neighbor_instructions?: string;
    }) => {
      const { data, error } = await supabase
        .from("alert_plans")
        .insert(plan)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-plans"] });
      toast.success("Varslingsplan opprettet");
    },
    onError: (error) => {
      console.error("Error creating alert plan:", error);
      toast.error("Kunne ikke opprette varslingsplan");
    },
  });
}

// Action Cards
export function useActionCards(emergencyPlanId?: string) {
  return useQuery({
    queryKey: ["action-cards", emergencyPlanId],
    queryFn: async () => {
      let query = supabase
        .from("action_cards")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (emergencyPlanId) {
        query = query.eq("emergency_plan_id", emergencyPlanId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ActionCard[];
    },
  });
}

export function useCreateActionCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (card: {
      emergency_plan_id?: string;
      title: string;
      incident_type: string;
      target_role?: string;
      immediate_actions: string[];
      extended_actions?: string[];
      equipment_needed?: string[];
      safety_considerations?: string[];
    }) => {
      const { data, error } = await supabase
        .from("action_cards")
        .insert({
          emergency_plan_id: card.emergency_plan_id || null,
          title: card.title,
          incident_type: card.incident_type,
          target_role: card.target_role as any || null,
          immediate_actions: card.immediate_actions,
          extended_actions: card.extended_actions || null,
          equipment_needed: card.equipment_needed || null,
          safety_considerations: card.safety_considerations || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-cards"] });
      toast.success("Tiltakskort opprettet");
    },
    onError: (error) => {
      console.error("Error creating action card:", error);
      toast.error("Kunne ikke opprette tiltakskort");
    },
  });
}

export function useUpdateActionCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<ActionCard> & { id: string }) => {
      const { data, error } = await supabase
        .from("action_cards")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-cards"] });
      toast.success("Tiltakskort oppdatert");
    },
    onError: (error) => {
      console.error("Error updating action card:", error);
      toast.error("Kunne ikke oppdatere tiltakskort");
    },
  });
}

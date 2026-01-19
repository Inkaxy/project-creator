import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SafetyRound {
  id: string;
  title: string;
  description: string | null;
  department_id: string | null;
  assigned_to: string | null;
  status: string;
  scheduled_date: string;
  completed_at: string | null;
  completed_by: string | null;
  signature_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  departments?: { id: string; name: string } | null;
  assignee?: { id: string; full_name: string } | null;
  completer?: { id: string; full_name: string } | null;
}

export interface SafetyRoundItem {
  id: string;
  round_id: string;
  category: string;
  title: string;
  description: string | null;
  status: string | null;
  finding: string | null;
  image_url: string | null;
  sort_order: number | null;
  created_at: string;
}

// Fetch all safety rounds
export function useSafetyRounds(status?: string) {
  return useQuery({
    queryKey: ["safety-rounds", status],
    queryFn: async () => {
      let query = supabase
        .from("safety_rounds")
        .select(`
          *,
          departments (id, name),
          assignee:profiles!safety_rounds_assigned_to_fkey (id, full_name),
          completer:profiles!safety_rounds_completed_by_fkey (id, full_name)
        `)
        .order("scheduled_date", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as SafetyRound[];
    },
  });
}

// Fetch a single safety round with items
export function useSafetyRound(id: string | null) {
  return useQuery({
    queryKey: ["safety-round", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("safety_rounds")
        .select(`
          *,
          departments (id, name),
          assignee:profiles!safety_rounds_assigned_to_fkey (id, full_name)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as SafetyRound;
    },
    enabled: !!id,
  });
}

// Fetch items for a safety round
export function useSafetyRoundItems(roundId: string | null) {
  return useQuery({
    queryKey: ["safety-round-items", roundId],
    queryFn: async () => {
      if (!roundId) return [];

      const { data, error } = await supabase
        .from("safety_round_items")
        .select("*")
        .eq("round_id", roundId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as SafetyRoundItem[];
    },
    enabled: !!roundId,
  });
}

// Create a safety round
export function useCreateSafetyRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      department_id?: string;
      assigned_to?: string;
      scheduled_date: string;
    }) => {
      const { data: round, error } = await supabase
        .from("safety_rounds")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return round;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["safety-rounds"] });
      toast.success("Vernerunde opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette vernerunde: " + error.message);
    },
  });
}

// Update a safety round
export function useUpdateSafetyRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<SafetyRound> & { id: string }) => {
      const { error } = await supabase
        .from("safety_rounds")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["safety-rounds"] });
      queryClient.invalidateQueries({ queryKey: ["safety-round", variables.id] });
      toast.success("Vernerunde oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere vernerunde: " + error.message);
    },
  });
}

// Complete a safety round
export function useCompleteSafetyRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      completedBy,
      notes,
    }: {
      id: string;
      completedBy: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from("safety_rounds")
        .update({
          status: "completed",
          completed_by: completedBy,
          completed_at: new Date().toISOString(),
          notes,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["safety-rounds"] });
      queryClient.invalidateQueries({ queryKey: ["safety-round", variables.id] });
      toast.success("Vernerunde fullført");
    },
    onError: (error) => {
      toast.error("Kunne ikke fullføre vernerunde: " + error.message);
    },
  });
}

// Update a safety round item
export function useUpdateSafetyRoundItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<SafetyRoundItem> & { id: string }) => {
      const { error } = await supabase
        .from("safety_round_items")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["safety-round-items"] });
      toast.success("Punkt oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere punkt: " + error.message);
    },
  });
}

// Add items to a safety round
export function useAddSafetyRoundItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roundId,
      items,
    }: {
      roundId: string;
      items: { category: string; title: string; description?: string }[];
    }) => {
      const itemsWithRoundId = items.map((item, index) => ({
        ...item,
        round_id: roundId,
        sort_order: index,
      }));

      const { error } = await supabase
        .from("safety_round_items")
        .insert(itemsWithRoundId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["safety-round-items"] });
      toast.success("Punkter lagt til");
    },
    onError: (error) => {
      toast.error("Kunne ikke legge til punkter: " + error.message);
    },
  });
}

// Get pending safety rounds count
export function usePendingSafetyRoundsCount() {
  return useQuery({
    queryKey: ["pending-safety-rounds-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("safety_rounds")
        .select("*", { count: "exact", head: true })
        .eq("status", "planned")
        .lte("scheduled_date", new Date().toISOString().split("T")[0]);

      if (error) throw error;
      return count || 0;
    },
  });
}

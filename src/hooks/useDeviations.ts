import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Deviation {
  id: string;
  category: string;
  title: string;
  description: string | null;
  location: string | null;
  department_id: string | null;
  severity: string;
  status: string;
  is_anonymous: boolean | null;
  image_url: string | null;
  reported_by: string | null;
  assigned_to: string | null;
  root_cause: string | null;
  corrective_action: string | null;
  preventive_action: string | null;
  closed_by: string | null;
  closed_at: string | null;
  due_date: string | null;
  require_clock_out_confirmation: boolean | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  confirmation_notes: string | null;
  confirmation_image_url: string | null;
  created_at: string;
  updated_at: string;
  reporter?: { id: string; full_name: string } | null;
  assignee?: { id: string; full_name: string } | null;
  closer?: { id: string; full_name: string } | null;
  department?: { id: string; name: string } | null;
}

export interface DeviationComment {
  id: string;
  deviation_id: string;
  comment: string;
  created_by: string | null;
  created_at: string;
  profiles?: { id: string; full_name: string };
}

export type DeviationCategory = "idea" | "concern" | "accident";
export type DeviationSeverity = "low" | "medium" | "high" | "critical";
export type DeviationStatus = "open" | "in_progress" | "resolved" | "closed";

// Fetch all deviations with optional filters
export function useDeviations(status?: string) {
  return useQuery({
    queryKey: ["deviations", status],
    queryFn: async () => {
      let query = supabase
        .from("deviations")
        .select(`
          *,
          reporter:profiles!deviations_reported_by_fkey (id, full_name),
          assignee:profiles!deviations_assigned_to_fkey (id, full_name),
          closer:profiles!deviations_closed_by_fkey (id, full_name),
          department:departments (id, name)
        `)
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Deviation[];
    },
  });
}

// Fetch a single deviation
export function useDeviation(id: string | null) {
  return useQuery({
    queryKey: ["deviation", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("deviations")
        .select(`
          *,
          reporter:profiles!deviations_reported_by_fkey (id, full_name),
          assignee:profiles!deviations_assigned_to_fkey (id, full_name),
          closer:profiles!deviations_closed_by_fkey (id, full_name),
          department:departments (id, name)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Deviation;
    },
    enabled: !!id,
  });
}

// Fetch comments for a deviation
export function useDeviationComments(deviationId: string | null) {
  return useQuery({
    queryKey: ["deviation-comments", deviationId],
    queryFn: async () => {
      if (!deviationId) return [];

      const { data, error } = await supabase
        .from("deviation_comments")
        .select(`
          *,
          profiles (id, full_name)
        `)
        .eq("deviation_id", deviationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as DeviationComment[];
    },
    enabled: !!deviationId,
  });
}

// Create a new deviation
export function useCreateDeviation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      category: string;
      title: string;
      description?: string;
      location?: string;
      department_id?: string;
      severity: string;
      is_anonymous?: boolean;
      image_url?: string;
      reported_by: string | null;
    }) => {
      const { data: deviation, error } = await supabase
        .from("deviations")
        .insert({
          ...data,
          reported_by: data.is_anonymous ? null : data.reported_by,
        })
        .select()
        .single();

      if (error) throw error;
      return deviation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deviations"] });
      toast.success("Avvik meldt");
    },
    onError: (error) => {
      toast.error("Kunne ikke melde avvik: " + error.message);
    },
  });
}

// Update a deviation
export function useUpdateDeviation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Deviation> & { id: string }) => {
      const { error } = await supabase
        .from("deviations")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deviations"] });
      queryClient.invalidateQueries({ queryKey: ["deviation", variables.id] });
      toast.success("Avvik oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere avvik: " + error.message);
    },
  });
}

// Close a deviation
export function useCloseDeviation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      closedBy,
      correctiveAction,
      preventiveAction,
    }: {
      id: string;
      closedBy: string;
      correctiveAction?: string;
      preventiveAction?: string;
    }) => {
      const { error } = await supabase
        .from("deviations")
        .update({
          status: "closed",
          closed_by: closedBy,
          closed_at: new Date().toISOString(),
          corrective_action: correctiveAction,
          preventive_action: preventiveAction,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deviations"] });
      queryClient.invalidateQueries({ queryKey: ["deviation", variables.id] });
      toast.success("Avvik lukket");
    },
    onError: (error) => {
      toast.error("Kunne ikke lukke avvik: " + error.message);
    },
  });
}

// Add a comment
export function useAddDeviationComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      deviationId,
      comment,
      createdBy,
    }: {
      deviationId: string;
      comment: string;
      createdBy: string;
    }) => {
      const { error } = await supabase
        .from("deviation_comments")
        .insert({
          deviation_id: deviationId,
          comment,
          created_by: createdBy,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deviation-comments", variables.deviationId] });
      toast.success("Kommentar lagt til");
    },
    onError: (error) => {
      toast.error("Kunne ikke legge til kommentar: " + error.message);
    },
  });
}

// Get open deviation count for dashboard
export function useOpenDeviationsCount() {
  return useQuery({
    queryKey: ["open-deviations-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("deviations")
        .select("*", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]);

      if (error) throw error;
      return count || 0;
    },
  });
}

// Get deviation statistics
export function useDeviationStats() {
  return useQuery({
    queryKey: ["deviation-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deviations")
        .select("status, severity, category");

      if (error) throw error;

      const byStatus: Record<string, number> = {};
      const bySeverity: Record<string, number> = {};
      const byCategory: Record<string, number> = {};

      data.forEach((d) => {
        byStatus[d.status] = (byStatus[d.status] || 0) + 1;
        bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
        byCategory[d.category] = (byCategory[d.category] || 0) + 1;
      });

      return {
        total: data.length,
        byStatus,
        bySeverity,
        byCategory,
      };
    },
  });
}

// Get deviations assigned to user that need confirmation
export function useMyAssignedDeviations(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-assigned-deviations", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("deviations")
        .select(`
          *,
          department:departments (id, name)
        `)
        .eq("assigned_to", userId)
        .in("status", ["open", "in_progress"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Deviation[];
    },
    enabled: !!userId,
  });
}

// Get deviations requiring clock-out confirmation for a user
export function useDeviationsRequiringConfirmation(userId: string | undefined) {
  return useQuery({
    queryKey: ["deviations-requiring-confirmation", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("deviations")
        .select(`
          *,
          department:departments (id, name)
        `)
        .eq("assigned_to", userId)
        .eq("require_clock_out_confirmation", true)
        .is("confirmed_at", null)
        .in("status", ["open", "in_progress"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Deviation[];
    },
    enabled: !!userId,
  });
}

// Assign deviation to employee
export function useAssignDeviation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      assignedTo,
      requireClockOutConfirmation,
      dueDate,
    }: {
      id: string;
      assignedTo: string;
      requireClockOutConfirmation?: boolean;
      dueDate?: string;
    }) => {
      const { error } = await supabase
        .from("deviations")
        .update({
          assigned_to: assignedTo,
          require_clock_out_confirmation: requireClockOutConfirmation || false,
          due_date: dueDate,
          status: "in_progress",
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deviations"] });
      queryClient.invalidateQueries({ queryKey: ["deviation", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["my-assigned-deviations"] });
      toast.success("Avvik tildelt");
    },
    onError: (error) => {
      toast.error("Kunne ikke tildele avvik: " + error.message);
    },
  });
}

// Confirm deviation (employee confirms they've handled it)
export function useConfirmDeviation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      confirmedBy,
      notes,
      imageUrl,
    }: {
      id: string;
      confirmedBy: string;
      notes?: string;
      imageUrl?: string;
    }) => {
      const { error } = await supabase
        .from("deviations")
        .update({
          confirmed_at: new Date().toISOString(),
          confirmed_by: confirmedBy,
          confirmation_notes: notes,
          confirmation_image_url: imageUrl,
          status: "resolved",
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deviations"] });
      queryClient.invalidateQueries({ queryKey: ["deviation", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["my-assigned-deviations"] });
      queryClient.invalidateQueries({ queryKey: ["deviations-requiring-confirmation"] });
      toast.success("Avvik bekreftet");
    },
    onError: (error) => {
      toast.error("Kunne ikke bekrefte avvik: " + error.message);
    },
  });
}

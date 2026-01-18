import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ApprovalRequestType = "timesheet" | "absence" | "shift_swap" | "overtime" | "expense";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalRequestData {
  id: string;
  request_type: ApprovalRequestType;
  requestor_id: string;
  target_id: string;
  status: ApprovalStatus;
  description: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  profiles?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

// Fetch approval requests with optional filters
export function useApprovalRequests(
  type?: ApprovalRequestType,
  status?: ApprovalStatus
) {
  return useQuery({
    queryKey: ["approval_requests", type, status],
    queryFn: async () => {
      let query = supabase
        .from("approval_requests")
        .select(`
          *,
          profiles!approval_requests_requestor_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false });

      if (type) {
        query = query.eq("request_type", type);
      }
      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ApprovalRequestData[];
    },
  });
}

// Fetch pending approval requests count
export function usePendingApprovalsCount() {
  return useQuery({
    queryKey: ["approval_requests", "pending", "count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("approval_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (error) throw error;
      return count || 0;
    },
  });
}

// Create approval request
export function useCreateApprovalRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestType,
      requestorId,
      targetId,
      description,
    }: {
      requestType: ApprovalRequestType;
      requestorId: string;
      targetId: string;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from("approval_requests")
        .insert({
          request_type: requestType,
          requestor_id: requestorId,
          target_id: targetId,
          description,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval_requests"] });
      toast.success("Forespørsel sendt");
    },
    onError: (error) => {
      toast.error("Kunne ikke sende forespørsel: " + error.message);
    },
  });
}

// Approve request
export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      reviewerId,
      notes,
    }: {
      requestId: string;
      reviewerId: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from("approval_requests")
        .update({
          status: "approved",
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: notes || null,
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval_requests"] });
      toast.success("Forespørsel godkjent");
    },
    onError: (error) => {
      toast.error("Kunne ikke godkjenne: " + error.message);
    },
  });
}

// Reject request
export function useRejectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      reviewerId,
      notes,
    }: {
      requestId: string;
      reviewerId: string;
      notes: string;
    }) => {
      const { error } = await supabase
        .from("approval_requests")
        .update({
          status: "rejected",
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: notes,
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval_requests"] });
      toast.success("Forespørsel avslått");
    },
    onError: (error) => {
      toast.error("Kunne ikke avslå: " + error.message);
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type SwapType = "swap" | "giveaway" | "cover";
export type SwapStatus = "pending_colleague" | "pending_manager" | "approved" | "rejected" | "cancelled";

export interface ShiftSwapRequest {
  id: string;
  requester_id: string;
  original_shift_id: string;
  swap_type: SwapType;
  target_shift_id: string | null;
  target_employee_id: string | null;
  status: SwapStatus;
  colleague_approved_at: string | null;
  manager_approved_at: string | null;
  manager_approved_by: string | null;
  reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  requester?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  target_employee?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  original_shift?: {
    id: string;
    date: string;
    planned_start: string;
    planned_end: string;
    functions: {
      name: string;
      color: string | null;
    } | null;
  };
  target_shift?: {
    id: string;
    date: string;
    planned_start: string;
    planned_end: string;
    functions: {
      name: string;
      color: string | null;
    } | null;
  };
}

// Get all swap requests (for managers)
export function useShiftSwapRequests() {
  return useQuery({
    queryKey: ["shift_swap_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shift_swap_requests")
        .select(`
          *,
          requester:profiles!shift_swap_requests_requester_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          target_employee:profiles!shift_swap_requests_target_employee_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          original_shift:shifts!shift_swap_requests_original_shift_id_fkey (
            id,
            date,
            planned_start,
            planned_end,
            functions (
              name,
              color
            )
          ),
          target_shift:shifts!shift_swap_requests_target_shift_id_fkey (
            id,
            date,
            planned_start,
            planned_end,
            functions (
              name,
              color
            )
          )
        `)
        .in("status", ["pending_colleague", "pending_manager"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ShiftSwapRequest[];
    },
  });
}

// Get my swap requests
export function useMySwapRequests() {
  return useQuery({
    queryKey: ["my_swap_requests"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from("shift_swap_requests")
        .select(`
          *,
          requester:profiles!shift_swap_requests_requester_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          target_employee:profiles!shift_swap_requests_target_employee_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          original_shift:shifts!shift_swap_requests_original_shift_id_fkey (
            id,
            date,
            planned_start,
            planned_end,
            functions (
              name,
              color
            )
          ),
          target_shift:shifts!shift_swap_requests_target_shift_id_fkey (
            id,
            date,
            planned_start,
            planned_end,
            functions (
              name,
              color
            )
          )
        `)
        .or(`requester_id.eq.${userData.user.id},target_employee_id.eq.${userData.user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ShiftSwapRequest[];
    },
  });
}

// Create a swap request
export function useCreateSwapRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      originalShiftId,
      swapType,
      targetShiftId,
      targetEmployeeId,
      reason,
    }: {
      originalShiftId: string;
      swapType: SwapType;
      targetShiftId?: string;
      targetEmployeeId?: string;
      reason?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Ikke innlogget");

      // For giveaway, go directly to pending_manager
      const status: SwapStatus = swapType === "giveaway" ? "pending_manager" : "pending_colleague";

      const { data, error } = await supabase
        .from("shift_swap_requests")
        .insert({
          requester_id: userData.user.id,
          original_shift_id: originalShiftId,
          swap_type: swapType,
          target_shift_id: targetShiftId || null,
          target_employee_id: targetEmployeeId || null,
          status,
          reason,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shift_swap_requests"] });
      queryClient.invalidateQueries({ queryKey: ["my_swap_requests"] });
      const message = variables.swapType === "swap" 
        ? "Bytteforespørsel sendt!" 
        : variables.swapType === "giveaway"
        ? "Forespørsel om å gi bort vakt sendt!"
        : "Forespørsel om dekning sendt!";
      toast.success(message);
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette forespørsel: " + error.message);
    },
  });
}

// Colleague approves swap
export function useColleagueApproveSwap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (swapId: string) => {
      const { error } = await supabase
        .from("shift_swap_requests")
        .update({
          status: "pending_manager",
          colleague_approved_at: new Date().toISOString(),
        })
        .eq("id", swapId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift_swap_requests"] });
      queryClient.invalidateQueries({ queryKey: ["my_swap_requests"] });
      toast.success("Du godkjente byttet!");
    },
    onError: (error) => {
      toast.error("Kunne ikke godkjenne: " + error.message);
    },
  });
}

// Colleague or requester rejects swap
export function useRejectSwap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (swapId: string) => {
      const { error } = await supabase
        .from("shift_swap_requests")
        .update({ status: "rejected" })
        .eq("id", swapId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift_swap_requests"] });
      queryClient.invalidateQueries({ queryKey: ["my_swap_requests"] });
      toast.success("Forespørsel avslått");
    },
    onError: (error) => {
      toast.error("Kunne ikke avslå: " + error.message);
    },
  });
}

// Cancel own request
export function useCancelSwapRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (swapId: string) => {
      const { error } = await supabase
        .from("shift_swap_requests")
        .update({ status: "cancelled" })
        .eq("id", swapId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift_swap_requests"] });
      queryClient.invalidateQueries({ queryKey: ["my_swap_requests"] });
      toast.success("Forespørsel kansellert");
    },
    onError: (error) => {
      toast.error("Kunne ikke kansellere: " + error.message);
    },
  });
}

// Manager approves swap (executes the swap)
export function useManagerApproveSwap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (swap: ShiftSwapRequest) => {
      const { data: userData } = await supabase.auth.getUser();

      // Update swap request status
      const { error: updateError } = await supabase
        .from("shift_swap_requests")
        .update({
          status: "approved",
          manager_approved_at: new Date().toISOString(),
          manager_approved_by: userData.user?.id,
        })
        .eq("id", swap.id);

      if (updateError) throw updateError;

      // Execute the swap
      if (swap.swap_type === "swap" && swap.target_shift_id) {
        // Swap employees between two shifts
        const { error: shift1Error } = await supabase
          .from("shifts")
          .update({ employee_id: swap.target_employee_id })
          .eq("id", swap.original_shift_id);

        if (shift1Error) throw shift1Error;

        const { error: shift2Error } = await supabase
          .from("shifts")
          .update({ employee_id: swap.requester_id })
          .eq("id", swap.target_shift_id);

        if (shift2Error) throw shift2Error;
      } else if (swap.swap_type === "giveaway") {
        // Remove employee from shift (make it open)
        const { error: giveawayError } = await supabase
          .from("shifts")
          .update({ employee_id: null })
          .eq("id", swap.original_shift_id);

        if (giveawayError) throw giveawayError;
      } else if (swap.swap_type === "cover" && swap.target_employee_id) {
        // Transfer shift to target employee
        const { error: coverError } = await supabase
          .from("shifts")
          .update({ employee_id: swap.target_employee_id })
          .eq("id", swap.original_shift_id);

        if (coverError) throw coverError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift_swap_requests"] });
      queryClient.invalidateQueries({ queryKey: ["my_swap_requests"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Bytte godkjent og utført!");
    },
    onError: (error) => {
      toast.error("Kunne ikke godkjenne bytte: " + error.message);
    },
  });
}

// Manager rejects swap
export function useManagerRejectSwap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (swapId: string) => {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("shift_swap_requests")
        .update({
          status: "rejected",
          manager_approved_by: userData.user?.id,
        })
        .eq("id", swapId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift_swap_requests"] });
      queryClient.invalidateQueries({ queryKey: ["my_swap_requests"] });
      toast.success("Bytte avslått");
    },
    onError: (error) => {
      toast.error("Kunne ikke avslå bytte: " + error.message);
    },
  });
}

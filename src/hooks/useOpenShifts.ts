import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ShiftApplicant {
  id: string;
  shift_id: string;
  employee_id: string;
  applied_at: string;
  status: "pending" | "approved" | "rejected";
  note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  profiles?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface OpenShiftWithApplicants {
  id: string;
  date: string;
  planned_start: string;
  planned_end: string;
  planned_break_minutes: number | null;
  functions: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  applicants: ShiftApplicant[];
}

// Get all open shifts (shifts without an employee)
export function useOpenShifts(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["open_shifts", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select(`
          id,
          date,
          planned_start,
          planned_end,
          planned_break_minutes,
          functions (
            id,
            name,
            color
          )
        `)
        .is("employee_id", null)
        .gte("date", startDate)
        .lte("date", endDate)
        .neq("status", "cancelled")
        .order("date", { ascending: true });

      if (error) throw error;

      // Fetch applicants for each open shift
      const shiftIds = data.map((s) => s.id);
      
      if (shiftIds.length === 0) {
        return data.map((shift) => ({ ...shift, applicants: [] }));
      }

      const { data: applicants, error: appError } = await supabase
        .from("shift_applicants")
        .select(`
          *,
          profiles:profiles!shift_applicants_employee_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .in("shift_id", shiftIds);

      if (appError) throw appError;

      // Merge applicants into shifts
      const shiftsWithApplicants: OpenShiftWithApplicants[] = data.map((shift) => ({
        ...shift,
        applicants: (applicants || []).filter((a) => a.shift_id === shift.id) as ShiftApplicant[],
      }));

      return shiftsWithApplicants;
    },
    enabled: !!startDate && !!endDate,
  });
}

// Get applicants for a specific shift
export function useShiftApplicants(shiftId: string) {
  return useQuery({
    queryKey: ["shift_applicants", shiftId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shift_applicants")
        .select(`
          *,
          profiles:profiles!shift_applicants_employee_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("shift_id", shiftId)
        .order("applied_at", { ascending: true });

      if (error) throw error;
      return data as ShiftApplicant[];
    },
    enabled: !!shiftId,
  });
}

// Apply for an open shift
export function useApplyForShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shiftId, note }: { shiftId: string; note?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Ikke innlogget");

      const { data, error } = await supabase
        .from("shift_applicants")
        .insert({
          shift_id: shiftId,
          employee_id: userData.user.id,
          note,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["open_shifts"] });
      queryClient.invalidateQueries({ queryKey: ["shift_applicants"] });
      queryClient.invalidateQueries({ queryKey: ["my_applications"] });
      toast.success("Søknad sendt!");
    },
    onError: (error) => {
      toast.error("Kunne ikke søke: " + error.message);
    },
  });
}

// Withdraw application
export function useWithdrawApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from("shift_applicants")
        .delete()
        .eq("id", applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["open_shifts"] });
      queryClient.invalidateQueries({ queryKey: ["shift_applicants"] });
      queryClient.invalidateQueries({ queryKey: ["my_applications"] });
      toast.success("Søknad trukket tilbake");
    },
    onError: (error) => {
      toast.error("Kunne ikke trekke tilbake: " + error.message);
    },
  });
}

// Approve/reject application (manager)
export function useReviewApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      shiftId,
      employeeId,
      status,
    }: {
      applicationId: string;
      shiftId: string;
      employeeId: string;
      status: "approved" | "rejected";
    }) => {
      const { data: userData } = await supabase.auth.getUser();

      // Update application status
      const { error: updateError } = await supabase
        .from("shift_applicants")
        .update({
          status,
          reviewed_by: userData.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (updateError) throw updateError;

      // If approved, assign employee to shift and reject other applications
      if (status === "approved") {
        const { error: shiftError } = await supabase
          .from("shifts")
          .update({ employee_id: employeeId })
          .eq("id", shiftId);

        if (shiftError) throw shiftError;

        // Reject other pending applications for this shift
        await supabase
          .from("shift_applicants")
          .update({
            status: "rejected",
            reviewed_by: userData.user?.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq("shift_id", shiftId)
          .neq("id", applicationId)
          .eq("status", "pending");
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["open_shifts"] });
      queryClient.invalidateQueries({ queryKey: ["shift_applicants"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["my_applications"] });
      toast.success(
        variables.status === "approved" ? "Søknad godkjent!" : "Søknad avslått"
      );
    },
    onError: (error) => {
      toast.error("Kunne ikke behandle søknad: " + error.message);
    },
  });
}

// Get my applications
export function useMyApplications() {
  return useQuery({
    queryKey: ["my_applications"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from("shift_applicants")
        .select(`
          *,
          shifts (
            id,
            date,
            planned_start,
            planned_end,
            functions (
              id,
              name,
              color
            )
          )
        `)
        .eq("employee_id", userData.user.id)
        .order("applied_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

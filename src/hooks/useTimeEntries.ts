import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TimeEntryData {
  id: string;
  employee_id: string;
  shift_id: string | null;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  break_minutes: number;
  clock_in_location: Record<string, unknown> | null;
  clock_out_location: Record<string, unknown> | null;
  status: "draft" | "submitted" | "approved" | "rejected";
  deviation_minutes: number;
  deviation_reason: string | null;
  manager_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  profiles?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  shifts?: {
    id: string;
    planned_start: string;
    planned_end: string;
    planned_break_minutes: number | null;
    functions?: {
      id: string;
      name: string;
      color: string | null;
    } | null;
  } | null;
}

// Fetch time entries for a user within a date range
export function useTimeEntries(userId: string | undefined, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["time_entries", userId, startDate, endDate],
    queryFn: async () => {
      const query = supabase
        .from("time_entries")
        .select(`
          *,
          profiles!time_entries_employee_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          shifts (
            id,
            planned_start,
            planned_end,
            planned_break_minutes,
            functions (
              id,
              name,
              color
            )
          )
        `)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false })
        .order("clock_in", { ascending: false });

      if (userId) {
        query.eq("employee_id", userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TimeEntryData[];
    },
    enabled: !!startDate && !!endDate,
  });
}

// Fetch all time entries for managers (department-wide)
export function useAllTimeEntries(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["time_entries", "all", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select(`
          *,
          profiles!time_entries_employee_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          shifts (
            id,
            planned_start,
            planned_end,
            planned_break_minutes,
            functions (
              id,
              name,
              color
            )
          )
        `)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false })
        .order("clock_in", { ascending: false });

      if (error) throw error;
      return data as TimeEntryData[];
    },
    enabled: !!startDate && !!endDate,
  });
}

// Fetch active (ongoing) time entry for a user
export function useActiveTimeEntry(userId: string | undefined) {
  return useQuery({
    queryKey: ["time_entries", "active", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select(`
          *,
          shifts (
            id,
            planned_start,
            planned_end,
            planned_break_minutes,
            functions (
              id,
              name,
              color
            )
          )
        `)
        .eq("employee_id", userId!)
        .is("clock_out", null)
        .not("clock_in", "is", null)
        .order("clock_in", { ascending: false })
        .maybeSingle();

      if (error) throw error;
      return data as TimeEntryData | null;
    },
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Get today's shift for the user
export function useTodayShift(userId: string | undefined) {
  const today = new Date().toISOString().split("T")[0];
  
  return useQuery({
    queryKey: ["shifts", "today", userId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select(`
          *,
          functions (
            id,
            name,
            color,
            category
          )
        `)
        .eq("employee_id", userId!)
        .eq("date", today)
        .neq("status", "cancelled")
        .order("planned_start", { ascending: true })
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

// Clock in mutation
export function useClockIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      employeeId, 
      shiftId, 
      location 
    }: { 
      employeeId: string; 
      shiftId?: string | null;
      location?: { latitude: number; longitude: number } | null;
    }) => {
      const now = new Date();
      const date = now.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("time_entries")
        .insert({
          employee_id: employeeId,
          shift_id: shiftId || null,
          date,
          clock_in: now.toISOString(),
          clock_in_location: location || null,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      toast.success("Du er stemplet inn!");
    },
    onError: (error) => {
      toast.error("Kunne ikke stemple inn: " + error.message);
    },
  });
}

// Clock out mutation
export function useClockOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      timeEntryId, 
      breakMinutes,
      location,
      deviationReason 
    }: { 
      timeEntryId: string;
      breakMinutes?: number;
      location?: { latitude: number; longitude: number } | null;
      deviationReason?: string;
    }) => {
      const now = new Date();

      // First get the time entry to calculate deviation
      const { data: entry, error: fetchError } = await supabase
        .from("time_entries")
        .select(`
          *,
          shifts (
            planned_start,
            planned_end,
            planned_break_minutes
          )
        `)
        .eq("id", timeEntryId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate deviation in minutes
      let deviationMinutes = 0;
      if (entry.shifts && entry.clock_in) {
        const clockIn = new Date(entry.clock_in);
        const clockOut = now;
        const actualMinutes = (clockOut.getTime() - clockIn.getTime()) / 60000 - (breakMinutes || entry.break_minutes || 0);

        const plannedStart = new Date(`${entry.date}T${entry.shifts.planned_start}`);
        const plannedEnd = new Date(`${entry.date}T${entry.shifts.planned_end}`);
        // Handle overnight shifts
        if (plannedEnd < plannedStart) {
          plannedEnd.setDate(plannedEnd.getDate() + 1);
        }
        const plannedMinutes = (plannedEnd.getTime() - plannedStart.getTime()) / 60000 - (entry.shifts.planned_break_minutes || 0);

        deviationMinutes = Math.round(actualMinutes - plannedMinutes);
      }

      const { data, error } = await supabase
        .from("time_entries")
        .update({
          clock_out: now.toISOString(),
          clock_out_location: location || null,
          break_minutes: breakMinutes ?? entry.break_minutes,
          deviation_minutes: deviationMinutes,
          deviation_reason: deviationReason || null,
        })
        .eq("id", timeEntryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      toast.success("Du er stemplet ut!");
    },
    onError: (error) => {
      toast.error("Kunne ikke stemple ut: " + error.message);
    },
  });
}

// Update time entry (for corrections)
export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: { 
      id: string;
      clock_in?: string;
      clock_out?: string;
      break_minutes?: number;
      deviation_reason?: string;
    }) => {
      const { data, error } = await supabase
        .from("time_entries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      toast.success("Timeliste oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere: " + error.message);
    },
  });
}

// Submit timesheet for approval
export function useSubmitTimesheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (timeEntryIds: string[]) => {
      const { error } = await supabase
        .from("time_entries")
        .update({ status: "submitted" })
        .in("id", timeEntryIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      toast.success("Timeliste sendt til godkjenning");
    },
    onError: (error) => {
      toast.error("Kunne ikke sende timeliste: " + error.message);
    },
  });
}

// Approve time entries (managers only)
export function useApproveTimeEntries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      timeEntryIds, 
      approverId 
    }: { 
      timeEntryIds: string[];
      approverId: string;
    }) => {
      const { error } = await supabase
        .from("time_entries")
        .update({ 
          status: "approved",
          approved_by: approverId,
          approved_at: new Date().toISOString(),
        })
        .in("id", timeEntryIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      toast.success("Timelister godkjent");
    },
    onError: (error) => {
      toast.error("Kunne ikke godkjenne: " + error.message);
    },
  });
}

// Reject time entry (managers only)
export function useRejectTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      timeEntryId, 
      managerNotes 
    }: { 
      timeEntryId: string;
      managerNotes: string;
    }) => {
      const { error } = await supabase
        .from("time_entries")
        .update({ 
          status: "rejected",
          manager_notes: managerNotes,
        })
        .eq("id", timeEntryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      toast.success("Timeliste avvist");
    },
    onError: (error) => {
      toast.error("Kunne ikke avvise: " + error.message);
    },
  });
}

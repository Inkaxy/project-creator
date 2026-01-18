import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ShiftData {
  id: string;
  date: string;
  function_id: string | null;
  employee_id: string | null;
  planned_start: string;
  planned_end: string;
  planned_break_minutes: number | null;
  actual_start: string | null;
  actual_end: string | null;
  actual_break_minutes: number | null;
  status: string;
  shift_type: string;
  is_night_shift: boolean | null;
  is_weekend: boolean | null;
  is_holiday: boolean | null;
  notes: string | null;
  internal_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  published_by: string | null;
  // Joined data
  functions?: {
    id: string;
    name: string;
    color: string | null;
    category: string | null;
  } | null;
  profiles?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export interface CreateShiftInput {
  date: string;
  function_id: string;
  employee_id?: string | null;
  planned_start: string;
  planned_end: string;
  planned_break_minutes?: number;
  status?: string;
  shift_type?: string;
  notes?: string;
  internal_notes?: string;
}

export interface UpdateShiftInput extends Partial<CreateShiftInput> {
  id: string;
}

function calculateShiftFlags(date: string, plannedStart: string) {
  const shiftDate = new Date(date);
  const dayOfWeek = shiftDate.getDay();
  const [hour] = plannedStart.split(":").map(Number);
  
  return {
    is_weekend: dayOfWeek === 0 || dayOfWeek === 6,
    is_night_shift: hour >= 21 || hour < 6,
    is_holiday: false, // TODO: Check against holiday calendar
  };
}

export function useShifts(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["shifts", startDate, endDate],
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
          ),
          profiles!shifts_employee_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .gte("date", startDate)
        .lte("date", endDate)
        .neq("status", "cancelled")
        .order("date", { ascending: true })
        .order("planned_start", { ascending: true });

      if (error) throw error;
      return data as ShiftData[];
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useShiftsByDate(date: string) {
  return useQuery({
    queryKey: ["shifts", "date", date],
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
          ),
          profiles!shifts_employee_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("date", date)
        .neq("status", "cancelled")
        .order("planned_start", { ascending: true });

      if (error) throw error;
      return data as ShiftData[];
    },
    enabled: !!date,
  });
}

export function useShiftsByFunction(functionId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["shifts", "function", functionId, startDate, endDate],
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
          ),
          profiles!shifts_employee_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("function_id", functionId)
        .gte("date", startDate)
        .lte("date", endDate)
        .neq("status", "cancelled")
        .order("date", { ascending: true });

      if (error) throw error;
      return data as ShiftData[];
    },
    enabled: !!functionId && !!startDate && !!endDate,
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateShiftInput) => {
      const flags = calculateShiftFlags(input.date, input.planned_start);
      
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("shifts")
        .insert({
          ...input,
          ...flags,
          created_by: userData.user?.id,
        })
        .select(`
          *,
          functions (
            id,
            name,
            color,
            category
          ),
          profiles!shifts_employee_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Vakt opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette vakt: " + error.message);
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateShiftInput) => {
      const updateData: Record<string, unknown> = { ...input };
      
      // Recalculate flags if date or time changed
      if (input.date && input.planned_start) {
        const flags = calculateShiftFlags(input.date, input.planned_start);
        Object.assign(updateData, flags);
      }

      const { data, error } = await supabase
        .from("shifts")
        .update(updateData)
        .eq("id", id)
        .select(`
          *,
          functions (
            id,
            name,
            color,
            category
          ),
          profiles!shifts_employee_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Vakt oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere vakt: " + error.message);
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("shifts")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Vakt slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette vakt: " + error.message);
    },
  });
}

export function usePublishShifts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shiftIds: string[]) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("shifts")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          published_by: userData.user?.id,
        })
        .in("id", shiftIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Vakter publisert");
    },
    onError: (error) => {
      toast.error("Kunne ikke publisere vakter: " + error.message);
    },
  });
}

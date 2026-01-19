import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  DisciplinaryCase,
  DisciplinaryCategory,
  DisciplinaryRule,
  DisciplinaryIncident,
  DisciplinaryCaseFilter,
  DisciplinaryMeeting,
  DisciplinaryAuditLog,
  CreateDisciplinaryCaseInput,
  CreateDisciplinaryMeetingInput,
} from "@/types/disciplinary";

// Kategorier
export function useDisciplinaryCategories() {
  return useQuery({
    queryKey: ["disciplinary_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disciplinary_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      
      if (error) throw error;
      return data as DisciplinaryCategory[];
    },
  });
}

// Saker med filtrering
export function useDisciplinaryCases(filter?: DisciplinaryCaseFilter) {
  return useQuery({
    queryKey: ["disciplinary_cases", filter],
    queryFn: async () => {
      let query = supabase
        .from("disciplinary_cases")
        .select(`
          *,
          employee:profiles!disciplinary_cases_employee_id_fkey(id, full_name, avatar_url, email),
          category:disciplinary_categories(*),
          created_by_user:profiles!disciplinary_cases_created_by_fkey(id, full_name),
          responses:disciplinary_responses(*)
        `)
        .order("created_at", { ascending: false });

      if (filter?.status?.length) {
        query = query.in("status", filter.status);
      }
      if (filter?.severity?.length) {
        query = query.in("severity", filter.severity);
      }
      if (filter?.category_id) {
        query = query.eq("category_id", filter.category_id);
      }
      if (filter?.employee_id) {
        query = query.eq("employee_id", filter.employee_id);
      }
      if (filter?.date_from) {
        query = query.gte("incident_date", filter.date_from);
      }
      if (filter?.date_to) {
        query = query.lte("incident_date", filter.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as DisciplinaryCase[];
    },
  });
}

// Enkelt sak med alle detaljer
export function useDisciplinaryCase(caseId: string | null) {
  return useQuery({
    queryKey: ["disciplinary_case", caseId],
    queryFn: async () => {
      if (!caseId) return null;

      const { data, error } = await supabase
        .from("disciplinary_cases")
        .select(`
          *,
          employee:profiles!disciplinary_cases_employee_id_fkey(id, full_name, avatar_url, email, phone),
          category:disciplinary_categories(*),
          created_by_user:profiles!disciplinary_cases_created_by_fkey(id, full_name),
          reviewed_by_user:profiles!disciplinary_cases_reviewed_by_fkey(id, full_name),
          witnesses:disciplinary_witnesses(
            *,
            employee:profiles(id, full_name)
          ),
          attachments:disciplinary_attachments(*),
          responses:disciplinary_responses(*),
          meetings:disciplinary_meetings(
            *,
            employee:profiles!disciplinary_meetings_employee_id_fkey(id, full_name),
            manager:profiles!disciplinary_meetings_manager_id_fkey(id, full_name)
          )
        `)
        .eq("id", caseId)
        .single();

      if (error) throw error;
      return data as unknown as DisciplinaryCase;
    },
    enabled: !!caseId,
  });
}

// Opprett ny sak
export function useCreateDisciplinaryCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDisciplinaryCaseInput) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("disciplinary_cases")
        .insert({
          ...input,
          status: "draft",
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disciplinary_cases"] });
      toast.success("Disiplinærsak opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette sak: " + error.message);
    },
  });
}

// Oppdater sak
export function useUpdateDisciplinaryCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string } & Partial<DisciplinaryCase>) => {
      const { id, ...updates } = input;
      
      // Remove joined fields that shouldn't be sent to update
      const cleanUpdates = { ...updates };
      delete cleanUpdates.employee;
      delete cleanUpdates.category;
      delete cleanUpdates.created_by_user;
      delete cleanUpdates.reviewed_by_user;
      delete cleanUpdates.witnesses;
      delete cleanUpdates.attachments;
      delete cleanUpdates.responses;
      delete cleanUpdates.meetings;
      
      const { data, error } = await supabase
        .from("disciplinary_cases")
        .update(cleanUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["disciplinary_cases"] });
      queryClient.invalidateQueries({ queryKey: ["disciplinary_case", variables.id] });
      toast.success("Sak oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere sak: " + error.message);
    },
  });
}

// Send sak til ansatt
export function useSendDisciplinaryCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (caseId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("disciplinary_cases")
        .update({
          status: "pending_acknowledgment",
          sent_at: new Date().toISOString(),
          reviewed_by: userData.user?.id,
        })
        .eq("id", caseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, caseId) => {
      queryClient.invalidateQueries({ queryKey: ["disciplinary_cases"] });
      queryClient.invalidateQueries({ queryKey: ["disciplinary_case", caseId] });
      toast.success("Sak sendt til ansatt");
    },
    onError: (error) => {
      toast.error("Kunne ikke sende sak: " + error.message);
    },
  });
}

// Ansatt kvitterer på sak
export function useRespondToDisciplinaryCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      case_id: string;
      response_type: string;
      comment?: string;
      signature_data?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      // Opprett respons
      const { error: responseError } = await supabase
        .from("disciplinary_responses")
        .insert({
          case_id: input.case_id,
          employee_id: userData.user?.id,
          response_type: input.response_type,
          comment: input.comment,
          signature_data: input.signature_data,
        });

      if (responseError) throw responseError;

      // Oppdater saksstatus
      const newStatus = input.response_type === 'disputed' ? 'disputed' : 'acknowledged';
      
      const { data, error } = await supabase
        .from("disciplinary_cases")
        .update({
          status: newStatus,
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", input.case_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["disciplinary_cases"] });
      queryClient.invalidateQueries({ queryKey: ["disciplinary_case", variables.case_id] });
      queryClient.invalidateQueries({ queryKey: ["employee_blocks"] });
      toast.success(
        variables.response_type === 'disputed' 
          ? "Innsigelse registrert" 
          : "Advarsel kvittert"
      );
    },
    onError: (error) => {
      toast.error("Kunne ikke registrere respons: " + error.message);
    },
  });
}

// Trekk tilbake sak
export function useWithdrawDisciplinaryCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (caseId: string) => {
      const { data, error } = await supabase
        .from("disciplinary_cases")
        .update({ status: "withdrawn" })
        .eq("id", caseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, caseId) => {
      queryClient.invalidateQueries({ queryKey: ["disciplinary_cases"] });
      queryClient.invalidateQueries({ queryKey: ["disciplinary_case", caseId] });
      toast.success("Sak trukket tilbake");
    },
    onError: (error) => {
      toast.error("Kunne ikke trekke tilbake sak: " + error.message);
    },
  });
}

// Regler
export function useDisciplinaryRules(categoryId?: string) {
  return useQuery({
    queryKey: ["disciplinary_rules", categoryId],
    queryFn: async () => {
      let query = supabase
        .from("disciplinary_rules")
        .select(`
          *,
          category:disciplinary_categories(*)
        `)
        .order("sort_order");

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as DisciplinaryRule[];
    },
  });
}

// Oppdater regel
export function useUpdateDisciplinaryRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string } & Partial<DisciplinaryRule>) => {
      const { id, category, ...updates } = input;
      
      const { data, error } = await supabase
        .from("disciplinary_rules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disciplinary_rules"] });
      toast.success("Regel oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere regel: " + error.message);
    },
  });
}

// Hendelser (ubehandlede)
export function useDisciplinaryIncidents(employeeId?: string) {
  return useQuery({
    queryKey: ["disciplinary_incidents", employeeId],
    queryFn: async () => {
      let query = supabase
        .from("disciplinary_incidents")
        .select(`
          *,
          employee:profiles(id, full_name),
          category:disciplinary_categories(*)
        `)
        .eq("processed", false)
        .order("incident_date", { ascending: false });

      if (employeeId) {
        query = query.eq("employee_id", employeeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as DisciplinaryIncident[];
    },
  });
}

// Møter
export function useCreateDisciplinaryMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDisciplinaryMeetingInput) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("disciplinary_meetings")
        .insert({
          ...input,
          status: 'scheduled',
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["disciplinary_case", variables.case_id] });
      toast.success("Møte planlagt");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette møte: " + error.message);
    },
  });
}

// Oppdater møte
export function useUpdateDisciplinaryMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; case_id: string } & Partial<DisciplinaryMeeting>) => {
      const { id, case_id, ...updates } = input;
      
      const { data, error } = await supabase
        .from("disciplinary_meetings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, case_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["disciplinary_case", data.case_id] });
      toast.success("Møte oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere møte: " + error.message);
    },
  });
}

// Audit log
export function useDisciplinaryAuditLog(caseId: string | null) {
  return useQuery({
    queryKey: ["disciplinary_audit_log", caseId],
    queryFn: async () => {
      if (!caseId) return [];

      const { data, error } = await supabase
        .from("disciplinary_audit_log")
        .select(`
          *,
          performed_by_user:profiles(id, full_name)
        `)
        .eq("case_id", caseId)
        .order("performed_at", { ascending: false });

      if (error) throw error;
      return data as unknown as DisciplinaryAuditLog[];
    },
    enabled: !!caseId,
  });
}

// Statistikk
export function useDisciplinaryStats() {
  return useQuery({
    queryKey: ["disciplinary_stats"],
    queryFn: async () => {
      const { data: cases, error } = await supabase
        .from("disciplinary_cases")
        .select("status, severity, category_id, created_at");

      if (error) throw error;

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      return {
        total: cases.length,
        pending: cases.filter(c => c.status === 'pending_acknowledgment').length,
        disputed: cases.filter(c => c.status === 'disputed').length,
        thisMonth: cases.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length,
        bySeverity: {
          low: cases.filter(c => c.severity === 'low').length,
          medium: cases.filter(c => c.severity === 'medium').length,
          high: cases.filter(c => c.severity === 'high').length,
        },
      };
    },
  });
}

// Sjekk om ansatt har aktive blokkeringer
export function useEmployeeBlocks(employeeId: string | null) {
  return useQuery({
    queryKey: ["employee_blocks", employeeId],
    queryFn: async () => {
      if (!employeeId) return { blocks_clock_in: false, blocks_timesheet: false, pending_cases: [] };

      const { data, error } = await supabase
        .from("disciplinary_cases")
        .select("id, case_number, blocks_clock_in, blocks_timesheet, block_until_acknowledged")
        .eq("employee_id", employeeId)
        .eq("status", "pending_acknowledgment")
        .or("blocks_clock_in.eq.true,blocks_timesheet.eq.true");

      if (error) throw error;

      return {
        blocks_clock_in: data.some(c => c.blocks_clock_in && c.block_until_acknowledged),
        blocks_timesheet: data.some(c => c.blocks_timesheet && c.block_until_acknowledged),
        pending_cases: data,
      };
    },
    enabled: !!employeeId,
  });
}

// Antall åpne saker (for badge)
export function useOpenDisciplinaryCasesCount() {
  return useQuery({
    queryKey: ["disciplinary_cases_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("disciplinary_cases")
        .select("*", { count: 'exact', head: true })
        .in("status", ["pending_acknowledgment", "disputed"]);

      if (error) throw error;
      return count || 0;
    },
  });
}

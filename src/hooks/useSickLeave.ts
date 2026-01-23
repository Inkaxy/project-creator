import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays, format, differenceInDays } from 'date-fns';

// ============================================================
// TYPER
// ============================================================

export type SickLeaveType = 
  | 'egenmelding' 
  | 'sykemelding' 
  | 'gradert_sykemelding' 
  | 'arbeidsrelatert_sykdom';

export type SickLeaveStatus = 'active' | 'completed' | 'extended' | 'cancelled';

export interface SickLeave {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string | null;
  expected_return_date: string | null;
  actual_return_date: string | null;
  leave_type: SickLeaveType;
  sick_leave_percentage: number;
  diagnosis_code: string | null;
  diagnosis_category: string | null;
  employer_period_start: string;
  employer_period_end: string;
  employer_period_days_used: number;
  employer_period_completed: boolean;
  nav_takeover_date: string | null;
  nav_case_number: string | null;
  income_report_sent_at: string | null;
  follow_up_plan_due: string;
  follow_up_plan_completed_at: string | null;
  dialogue_meeting_1_due: string;
  dialogue_meeting_1_completed_at: string | null;
  activity_requirement_due: string;
  activity_requirement_met: boolean | null;
  dialogue_meeting_2_due: string;
  dialogue_meeting_2_completed_at: string | null;
  max_date: string;
  status: SickLeaveStatus;
  notes: string | null;
  internal_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    department_id?: string | null;
    departments?: { name: string } | null;
  };
}

export interface SelfCertQuota {
  id: string;
  employee_id: string;
  quota_type: 'standard' | 'ia';
  period_start: string;
  period_end: string;
  days_used: number;
  occurrences_used: number;
  max_days_per_occurrence: number;
  max_days_per_period: number;
  max_occurrences_per_period: number | null;
  is_active: boolean;
}

export interface FollowUpEvent {
  id: string;
  sick_leave_id: string;
  event_type: string;
  event_date: string;
  event_time: string | null;
  description: string | null;
  participants: any;
  document_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface SickLeaveSettings {
  id: string;
  has_ia_agreement: boolean;
  ia_agreement_start_date: string | null;
  ia_agreement_end_date: string | null;
  self_cert_quota_type: 'standard' | 'ia' | 'custom';
  self_cert_max_days_per_occurrence: number;
  self_cert_max_days_per_year: number;
  self_cert_max_occurrences: number;
  notify_hr_on_sick_leave: boolean;
  notify_manager_on_sick_leave: boolean;
  notify_days_before_deadline: number;
  require_return_conversation: boolean;
  auto_create_follow_up_plan: boolean;
  use_actual_hourly_rate: boolean;
  default_hourly_rate: number;
  allow_employee_quota_view: boolean;
}

export interface UpcomingDeadline {
  sickLeaveId: string;
  employeeId: string;
  employeeName: string;
  deadlineType: string;
  deadlineDate: string;
  isOverdue: boolean;
  daysUntil: number;
}

// ============================================================
// HOOKS
// ============================================================

// Hent alle aktive sykefravær
export function useActiveSickLeaves() {
  return useQuery({
    queryKey: ['sick_leaves', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sick_leaves')
        .select(`
          *,
          profiles!sick_leaves_employee_id_fkey (
            id,
            full_name,
            avatar_url,
            department_id,
            departments (name)
          )
        `)
        .eq('status', 'active')
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as unknown as SickLeave[];
    },
  });
}

// Hent alle sykefravær (med filtrering)
export function useSickLeaves(filters?: { status?: string; employeeId?: string }) {
  return useQuery({
    queryKey: ['sick_leaves', filters],
    queryFn: async () => {
      let query = supabase
        .from('sick_leaves')
        .select(`
          *,
          profiles!sick_leaves_employee_id_fkey (
            id,
            full_name,
            avatar_url,
            department_id,
            departments (name)
          )
        `)
        .order('start_date', { ascending: false });
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as SickLeave[];
    },
  });
}

// Hent aktive sykefravær for datoperiode (for vaktplan)
export function useActiveSickLeavesForPeriod(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['sick_leaves', 'period', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sick_leaves')
        .select('id, employee_id, start_date, end_date, leave_type, sick_leave_percentage, status')
        .eq('status', 'active')
        .or(`end_date.is.null,end_date.gte.${startDate}`)
        .lte('start_date', endDate);
      
      if (error) throw error;
      return data as Pick<SickLeave, 'id' | 'employee_id' | 'start_date' | 'end_date' | 'leave_type' | 'sick_leave_percentage' | 'status'>[];
    },
    enabled: !!startDate && !!endDate,
  });
}

// Hent sykefravær for én ansatt
export function useEmployeeSickLeaves(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['sick_leaves', 'employee', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sick_leaves')
        .select('*')
        .eq('employee_id', employeeId!)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as SickLeave[];
    },
    enabled: !!employeeId,
  });
}

// Hent enkelt sykefravær
export function useSickLeave(sickLeaveId: string | undefined) {
  return useQuery({
    queryKey: ['sick_leaves', sickLeaveId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sick_leaves')
        .select(`
          *,
          profiles!sick_leaves_employee_id_fkey (
            id,
            full_name,
            avatar_url,
            department_id,
            departments (name)
          )
        `)
        .eq('id', sickLeaveId!)
        .single();
      
      if (error) throw error;
      return data as unknown as SickLeave;
    },
    enabled: !!sickLeaveId,
  });
}

// Hent egenmeldingskvote for ansatt
export function useSelfCertQuota(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['self_cert_quota', employeeId],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('self_certification_quotas')
        .select('*')
        .eq('employee_id', employeeId!)
        .lte('period_start', today)
        .gte('period_end', today)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data as SelfCertQuota | null;
    },
    enabled: !!employeeId,
  });
}

// Hent sykefraværsinnstillinger
export function useSickLeaveSettings() {
  return useQuery({
    queryKey: ['sick_leave_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sick_leave_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as SickLeaveSettings | null;
    },
  });
}

// Hent oppfølgingshendelser
export function useFollowUpEvents(sickLeaveId: string | undefined) {
  return useQuery({
    queryKey: ['follow_up_events', sickLeaveId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follow_up_events')
        .select(`
          *,
          created_by_profile:created_by (full_name)
        `)
        .eq('sick_leave_id', sickLeaveId!)
        .order('event_date', { ascending: false });
      
      if (error) throw error;
      return data as FollowUpEvent[];
    },
    enabled: !!sickLeaveId,
  });
}

// Hent kommende frister på tvers av alle sykefravær
export function useUpcomingDeadlines(daysAhead: number = 14) {
  return useQuery({
    queryKey: ['upcoming_deadlines', daysAhead],
    queryFn: async () => {
      const today = new Date();
      const cutoffDate = format(addDays(today, daysAhead), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('sick_leaves')
        .select(`
          id,
          employee_id,
          start_date,
          follow_up_plan_due,
          follow_up_plan_completed_at,
          dialogue_meeting_1_due,
          dialogue_meeting_1_completed_at,
          activity_requirement_due,
          activity_requirement_met,
          dialogue_meeting_2_due,
          dialogue_meeting_2_completed_at,
          profiles:employee_id (
            full_name
          )
        `)
        .eq('status', 'active');
      
      if (error) throw error;
      
      const deadlines: UpcomingDeadline[] = [];
      
      data?.forEach(sl => {
        const profile = sl.profiles as any;
        const employeeName = profile?.full_name || 'Ukjent';
        
        // Oppfølgingsplan
        if (sl.follow_up_plan_due && !sl.follow_up_plan_completed_at) {
          const dueDate = new Date(sl.follow_up_plan_due);
          const daysUntil = differenceInDays(dueDate, today);
          if (daysUntil <= daysAhead) {
            deadlines.push({
              sickLeaveId: sl.id,
              employeeId: sl.employee_id,
              employeeName,
              deadlineType: 'Oppfølgingsplan',
              deadlineDate: sl.follow_up_plan_due,
              isOverdue: daysUntil < 0,
              daysUntil,
            });
          }
        }
        
        // Dialogmøte 1
        if (sl.dialogue_meeting_1_due && !sl.dialogue_meeting_1_completed_at) {
          const dueDate = new Date(sl.dialogue_meeting_1_due);
          const daysUntil = differenceInDays(dueDate, today);
          if (daysUntil <= daysAhead) {
            deadlines.push({
              sickLeaveId: sl.id,
              employeeId: sl.employee_id,
              employeeName,
              deadlineType: 'Dialogmøte 1',
              deadlineDate: sl.dialogue_meeting_1_due,
              isOverdue: daysUntil < 0,
              daysUntil,
            });
          }
        }
        
        // Aktivitetsplikt
        if (sl.activity_requirement_due && sl.activity_requirement_met === null) {
          const dueDate = new Date(sl.activity_requirement_due);
          const daysUntil = differenceInDays(dueDate, today);
          if (daysUntil <= daysAhead) {
            deadlines.push({
              sickLeaveId: sl.id,
              employeeId: sl.employee_id,
              employeeName,
              deadlineType: 'Aktivitetsplikt',
              deadlineDate: sl.activity_requirement_due,
              isOverdue: daysUntil < 0,
              daysUntil,
            });
          }
        }
        
        // Dialogmøte 2
        if (sl.dialogue_meeting_2_due && !sl.dialogue_meeting_2_completed_at) {
          const dueDate = new Date(sl.dialogue_meeting_2_due);
          const daysUntil = differenceInDays(dueDate, today);
          if (daysUntil <= daysAhead) {
            deadlines.push({
              sickLeaveId: sl.id,
              employeeId: sl.employee_id,
              employeeName,
              deadlineType: 'Dialogmøte 2',
              deadlineDate: sl.dialogue_meeting_2_due,
              isOverdue: daysUntil < 0,
              daysUntil,
            });
          }
        }
      });
      
      return deadlines.sort((a, b) => a.daysUntil - b.daysUntil);
    },
  });
}

// Beregn arbeidsgiverperiode-status
export function calculateEmployerPeriodStatus(sickLeave: SickLeave) {
  const today = new Date();
  const startDate = new Date(sickLeave.employer_period_start);
  const endDate = new Date(sickLeave.employer_period_end);
  
  const totalDays = 16;
  const daysPassed = Math.min(differenceInDays(today, startDate) + 1, totalDays);
  const daysRemaining = Math.max(totalDays - daysPassed, 0);
  const isComplete = daysPassed >= totalDays || sickLeave.employer_period_completed;
  const progress = Math.min((daysPassed / totalDays) * 100, 100);
  
  return {
    daysPassed,
    daysRemaining,
    isComplete,
    progress,
    startDate: sickLeave.employer_period_start,
    endDate: sickLeave.employer_period_end,
    navTakeoverDate: sickLeave.nav_takeover_date,
  };
}

// ============================================================
// MUTATIONS
// ============================================================

// Registrer nytt sykefravær
export function useCreateSickLeave() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: {
      employee_id: string;
      start_date: string;
      end_date?: string;
      leave_type: SickLeaveType;
      sick_leave_percentage?: number;
      expected_return_date?: string;
      notes?: string;
    }) => {
      const startDate = new Date(input.start_date);
      
      const sickLeave = {
        ...input,
        sick_leave_percentage: input.sick_leave_percentage || 100,
        employer_period_start: input.start_date,
        employer_period_end: format(addDays(startDate, 15), 'yyyy-MM-dd'),
        nav_takeover_date: format(addDays(startDate, 16), 'yyyy-MM-dd'),
        follow_up_plan_due: format(addDays(startDate, 28), 'yyyy-MM-dd'),
        dialogue_meeting_1_due: format(addDays(startDate, 49), 'yyyy-MM-dd'),
        activity_requirement_due: format(addDays(startDate, 56), 'yyyy-MM-dd'),
        dialogue_meeting_2_due: format(addDays(startDate, 182), 'yyyy-MM-dd'),
        max_date: format(addDays(startDate, 364), 'yyyy-MM-dd'),
        status: 'active' as const,
      };
      
      const { data, error } = await supabase
        .from('sick_leaves')
        .insert(sickLeave)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sick_leaves'] });
      queryClient.invalidateQueries({ queryKey: ['self_cert_quota', data.employee_id] });
      queryClient.invalidateQueries({ queryKey: ['upcoming_deadlines'] });
    },
  });
}

// Oppdater sykefravær
export function useUpdateSickLeave() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      end_date?: string;
      expected_return_date?: string;
      status?: SickLeaveStatus;
      notes?: string;
      internal_notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('sick_leaves')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sick_leaves'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming_deadlines'] });
    },
  });
}

// Avslutt sykefravær (friskmelding)
export function useEndSickLeave() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      sickLeaveId,
      endDate,
      actualReturnDate,
    }: {
      sickLeaveId: string;
      endDate: string;
      actualReturnDate: string;
    }) => {
      const { data, error } = await supabase
        .from('sick_leaves')
        .update({
          end_date: endDate,
          actual_return_date: actualReturnDate,
          status: 'completed',
        })
        .eq('id', sickLeaveId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Logg hendelse
      await supabase.from('follow_up_events').insert({
        sick_leave_id: sickLeaveId,
        event_type: 'return_to_work',
        event_date: actualReturnDate,
        description: 'Sykefravær avsluttet - tilbake i jobb',
      });
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sick_leaves'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming_deadlines'] });
    },
  });
}

// Marker oppfølgingsaktivitet som fullført
export function useCompleteFollowUp() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      sickLeaveId,
      activityType,
      notes,
    }: {
      sickLeaveId: string;
      activityType: 'follow_up_plan' | 'dialogue_meeting_1' | 'activity_requirement' | 'dialogue_meeting_2';
      notes?: string;
    }) => {
      const updateField = {
        follow_up_plan: 'follow_up_plan_completed_at',
        dialogue_meeting_1: 'dialogue_meeting_1_completed_at',
        activity_requirement: 'activity_requirement_met',
        dialogue_meeting_2: 'dialogue_meeting_2_completed_at',
      }[activityType];
      
      const updateValue = activityType === 'activity_requirement' 
        ? true 
        : new Date().toISOString();
      
      const { data, error } = await supabase
        .from('sick_leaves')
        .update({ [updateField]: updateValue })
        .eq('id', sickLeaveId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Logg hendelse
      const eventType = {
        follow_up_plan: 'follow_up_plan_created',
        dialogue_meeting_1: 'dialogue_meeting_1_held',
        activity_requirement: 'activity_requirement_checked',
        dialogue_meeting_2: 'dialogue_meeting_2_held',
      }[activityType];
      
      await supabase.from('follow_up_events').insert({
        sick_leave_id: sickLeaveId,
        event_type: eventType,
        event_date: format(new Date(), 'yyyy-MM-dd'),
        description: notes,
      });
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sick_leaves'] });
      queryClient.invalidateQueries({ queryKey: ['follow_up_events', data.id] });
      queryClient.invalidateQueries({ queryKey: ['upcoming_deadlines'] });
    },
  });
}

// Legg til oppfølgingshendelse
export function useCreateFollowUpEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: {
      sick_leave_id: string;
      event_type: string;
      event_date: string;
      description?: string;
      participants?: any;
    }) => {
      const { data, error } = await supabase
        .from('follow_up_events')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['follow_up_events', data.sick_leave_id] });
    },
  });
}

// Opprett eller oppdater egenmeldingskvote
export function useEnsureSelfCertQuota() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (employeeId: string) => {
      const today = new Date();
      const periodStart = format(addDays(today, -365), 'yyyy-MM-dd');
      const periodEnd = format(today, 'yyyy-MM-dd');
      
      // Sjekk om kvote finnes
      const { data: existing } = await supabase
        .from('self_certification_quotas')
        .select('*')
        .eq('employee_id', employeeId)
        .lte('period_start', format(today, 'yyyy-MM-dd'))
        .gte('period_end', format(today, 'yyyy-MM-dd'))
        .maybeSingle();
      
      if (existing) return existing;
      
      // Hent innstillinger
      const { data: settings } = await supabase
        .from('sick_leave_settings')
        .select('*')
        .limit(1)
        .single();
      
      // Opprett ny kvote
      const { data, error } = await supabase
        .from('self_certification_quotas')
        .insert({
          employee_id: employeeId,
          quota_type: settings?.self_cert_quota_type === 'ia' ? 'ia' : 'standard',
          period_start: periodStart,
          period_end: format(addDays(today, 365), 'yyyy-MM-dd'),
          max_days_per_occurrence: settings?.self_cert_max_days_per_occurrence || 3,
          max_days_per_period: settings?.self_cert_max_days_per_year || 12,
          max_occurrences_per_period: settings?.self_cert_max_occurrences || 4,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['self_cert_quota', data.employee_id] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Types
export interface PartnerOrganization {
  id: string;
  name: string;
  org_number: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  is_staffing_agency: boolean;
  staffing_agency_approval_id: string | null;
  default_hourly_markup: number;
  is_active: boolean;
  created_at: string;
}

export interface EmployeePoolSettings {
  id: string;
  employee_id: string;
  is_available_for_pooling: boolean;
  pooling_consent_given_at: string | null;
  max_pool_percentage: number;
  min_notice_hours: number;
  max_travel_distance_km: number | null;
  preferred_partner_ids: string[];
  blocked_partner_ids: string[];
  external_hourly_rate: number | null;
  available_weekdays: boolean[];
  available_from_time: string;
  available_to_time: string;
  bio: string | null;
}

export interface PoolMembership {
  id: string;
  employee_id: string;
  partner_organization_id: string;
  status: 'pending' | 'active' | 'suspended' | 'rejected' | 'expired';
  employer_approved_at: string | null;
  employer_approved_by: string | null;
  employee_consented_at: string | null;
  partner_approved_at: string | null;
  valid_from: string | null;
  valid_until: string | null;
  notes: string | null;
  partner_organization?: PartnerOrganization;
  employee?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export interface PoolShift {
  id: string;
  partner_organization_id: string;
  title: string;
  description: string | null;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  function_id: string | null;
  required_certifications: string[];
  hourly_rate: number;
  location_address: string | null;
  location_notes: string | null;
  dress_code: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  status: 'draft' | 'open' | 'offered' | 'assigned' | 'completed' | 'cancelled';
  max_applicants: number;
  application_deadline: string | null;
  assigned_employee_id: string | null;
  assigned_at: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  hours_worked: number | null;
  employer_rating: number | null;
  employee_rating: number | null;
  partner_organization?: PartnerOrganization;
  function?: {
    id: string;
    name: string;
    color: string | null;
  };
  assigned_employee?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface CreatePoolShiftInput {
  partner_organization_id: string;
  title: string;
  description?: string | null;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes?: number;
  function_id?: string | null;
  required_certifications?: string[];
  hourly_rate: number;
  location_address?: string | null;
  location_notes?: string | null;
  dress_code?: string | null;
  contact_person?: string | null;
  contact_phone?: string | null;
  status?: 'draft' | 'open' | 'offered' | 'assigned' | 'completed' | 'cancelled';
  max_applicants?: number;
  application_deadline?: string | null;
}

export interface PoolShiftRequest {
  id: string;
  pool_shift_id: string;
  employee_id: string;
  status: 'pending_employer' | 'pending_employee' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  employee_note: string | null;
  employer_response_note: string | null;
  employer_approved_at: string | null;
  employee_accepted_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  response_deadline: string | null;
  pool_shift?: PoolShift;
  employee?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export interface EmployeePoolRating {
  id: string;
  employee_id: string;
  total_ratings: number;
  average_rating: number;
  total_pool_shifts: number;
  no_show_count: number;
  late_count: number;
  reliability_score: number;
}

// ==========================================
// Partner Organizations
// ==========================================
export function usePartnerOrganizations() {
  return useQuery({
    queryKey: ["partner-organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_organizations")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as PartnerOrganization[];
    },
  });
}

export function useCreatePartnerOrganization() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (org: Omit<PartnerOrganization, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from("partner_organizations")
        .insert([org])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-organizations"] });
      toast.success("Partnerorganisasjon opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette partner: " + error.message);
    },
  });
}

export function useUpdatePartnerOrganization() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PartnerOrganization> & { id: string }) => {
      const { data, error } = await supabase
        .from("partner_organizations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-organizations"] });
      toast.success("Partner oppdatert");
    },
  });
}

// ==========================================
// Employee Pool Settings
// ==========================================
export function useMyPoolSettings() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["my-pool-settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("employee_pool_settings")
        .select("*")
        .eq("employee_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as EmployeePoolSettings | null;
    },
    enabled: !!user,
  });
}

export function useUpsertPoolSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (settings: Partial<EmployeePoolSettings>) => {
      if (!user) throw new Error("Ikke innlogget");
      
      const { data, error } = await supabase
        .from("employee_pool_settings")
        .upsert({
          employee_id: user.id,
          ...settings,
        }, { onConflict: 'employee_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-pool-settings"] });
      toast.success("Innstillinger lagret");
    },
    onError: (error) => {
      toast.error("Kunne ikke lagre innstillinger: " + error.message);
    },
  });
}

// ==========================================
// Pool Memberships
// ==========================================
export function useMyPoolMemberships() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["my-pool-memberships", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("pool_memberships")
        .select(`
          *,
          partner_organization:partner_organizations(*)
        `)
        .eq("employee_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PoolMembership[];
    },
    enabled: !!user,
  });
}

export function useAllPoolMemberships() {
  return useQuery({
    queryKey: ["all-pool-memberships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pool_memberships")
        .select(`
          *,
          partner_organization:partner_organizations(*),
          employee:profiles!pool_memberships_employee_id_fkey(id, full_name, email, avatar_url)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PoolMembership[];
    },
  });
}

export function useCreatePoolMembership() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ employee_id, partner_organization_id }: { 
      employee_id: string; 
      partner_organization_id: string;
    }) => {
      const { data, error } = await supabase
        .from("pool_memberships")
        .insert([{
          employee_id,
          partner_organization_id,
          status: 'pending',
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pool-memberships"] });
      queryClient.invalidateQueries({ queryKey: ["my-pool-memberships"] });
      queryClient.invalidateQueries({ queryKey: ["all-pool-memberships"] });
      toast.success("Medlemskap opprettet");
    },
  });
}

export function useApprovePoolMembership() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
      if (!user) throw new Error("Ikke innlogget");
      
      const updates = action === 'approve' 
        ? { 
            status: 'active' as const,
            employer_approved_at: new Date().toISOString(),
            employer_approved_by: user.id,
          }
        : { status: 'rejected' as const };
      
      const { data, error } = await supabase
        .from("pool_memberships")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["pool-memberships"] });
      queryClient.invalidateQueries({ queryKey: ["all-pool-memberships"] });
      toast.success(action === 'approve' ? "Medlemskap godkjent" : "Medlemskap avvist");
    },
  });
}

export function useConsentToPoolMembership() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("pool_memberships")
        .update({
          employee_consented_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-pool-memberships"] });
      toast.success("Samtykke registrert");
    },
  });
}

// ==========================================
// Pool Shifts
// ==========================================
export function useAvailablePoolShifts() {
  return useQuery({
    queryKey: ["available-pool-shifts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pool_shifts")
        .select(`
          *,
          partner_organization:partner_organizations(*),
          function:functions(id, name, color)
        `)
        .eq("status", "open")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date")
        .order("start_time");
      if (error) throw error;
      return data as PoolShift[];
    },
  });
}

export function useMyPoolShifts() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["my-pool-shifts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("pool_shifts")
        .select(`
          *,
          partner_organization:partner_organizations(*),
          function:functions(id, name, color)
        `)
        .eq("assigned_employee_id", user.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as PoolShift[];
    },
    enabled: !!user,
  });
}

export function useAllPoolShifts() {
  return useQuery({
    queryKey: ["all-pool-shifts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pool_shifts")
        .select(`
          *,
          partner_organization:partner_organizations(*),
          function:functions(id, name, color),
          assigned_employee:profiles!pool_shifts_assigned_employee_id_fkey(id, full_name, avatar_url)
        `)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as PoolShift[];
    },
  });
}

export function useCreatePoolShift() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (shift: CreatePoolShiftInput) => {
      const { data, error } = await supabase
        .from("pool_shifts")
        .insert([{
          ...shift,
          created_by: user?.id,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pool-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["all-pool-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["available-pool-shifts"] });
      toast.success("Vakt opprettet");
    },
  });
}

export function useUpdatePoolShift() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PoolShift> & { id: string }) => {
      const { data, error } = await supabase
        .from("pool_shifts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pool-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["all-pool-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["available-pool-shifts"] });
      toast.success("Vakt oppdatert");
    },
  });
}

// ==========================================
// Pool Shift Requests
// ==========================================
export function useMyPoolShiftRequests() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["my-pool-shift-requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("pool_shift_requests")
        .select(`
          *,
          pool_shift:pool_shifts(
            *,
            partner_organization:partner_organizations(*),
            function:functions(id, name, color)
          )
        `)
        .eq("employee_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PoolShiftRequest[];
    },
    enabled: !!user,
  });
}

export function useAllPoolShiftRequests() {
  return useQuery({
    queryKey: ["all-pool-shift-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pool_shift_requests")
        .select(`
          *,
          pool_shift:pool_shifts(
            *,
            partner_organization:partner_organizations(*),
            function:functions(id, name, color)
          ),
          employee:profiles!pool_shift_requests_employee_id_fkey(id, full_name, email, avatar_url)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PoolShiftRequest[];
    },
  });
}

export function useApplyForPoolShift() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ pool_shift_id, note }: { pool_shift_id: string; note?: string }) => {
      if (!user) throw new Error("Ikke innlogget");
      
      const { data, error } = await supabase
        .from("pool_shift_requests")
        .insert([{
          pool_shift_id,
          employee_id: user.id,
          employee_note: note,
          status: 'pending_employer',
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-pool-shift-requests"] });
      queryClient.invalidateQueries({ queryKey: ["all-pool-shift-requests"] });
      toast.success("Søknad sendt!");
    },
    onError: (error) => {
      toast.error("Kunne ikke søke: " + error.message);
    },
  });
}

export function useReviewPoolShiftRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      request_id, 
      action, 
      note 
    }: { 
      request_id: string; 
      action: 'approve' | 'reject'; 
      note?: string;
    }) => {
      if (!user) throw new Error("Ikke innlogget");
      
      if (action === 'approve') {
        // First get the request to find the shift
        const { data: request, error: fetchError } = await supabase
          .from("pool_shift_requests")
          .select("pool_shift_id, employee_id")
          .eq("id", request_id)
          .single();
        if (fetchError) throw fetchError;
        
        // Update request status
        const { error: requestError } = await supabase
          .from("pool_shift_requests")
          .update({
            status: 'pending_employee',
            employer_approved_at: new Date().toISOString(),
            employer_approved_by: user.id,
            employer_response_note: note,
            response_deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hour deadline
          })
          .eq("id", request_id);
        if (requestError) throw requestError;
        
        return { success: true };
      } else {
        const { error } = await supabase
          .from("pool_shift_requests")
          .update({
            status: 'rejected',
            rejected_at: new Date().toISOString(),
            rejected_by: user.id,
            rejection_reason: note,
          })
          .eq("id", request_id);
        if (error) throw error;
        return { success: true };
      }
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["pool-shift-requests"] });
      queryClient.invalidateQueries({ queryKey: ["all-pool-shift-requests"] });
      toast.success(action === 'approve' ? "Forespørsel godkjent og sendt til ansatt" : "Forespørsel avvist");
    },
  });
}

export function useAcceptPoolShiftRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ request_id, accept }: { request_id: string; accept: boolean }) => {
      if (!user) throw new Error("Ikke innlogget");
      
      // Get the request details
      const { data: request, error: fetchError } = await supabase
        .from("pool_shift_requests")
        .select("pool_shift_id, employee_id")
        .eq("id", request_id)
        .single();
      if (fetchError) throw fetchError;
      
      if (accept) {
        // Accept the shift and assign employee
        const { error: requestError } = await supabase
          .from("pool_shift_requests")
          .update({
            status: 'approved',
            employee_accepted_at: new Date().toISOString(),
          })
          .eq("id", request_id);
        if (requestError) throw requestError;
        
        // Assign employee to shift
        const { error: shiftError } = await supabase
          .from("pool_shifts")
          .update({
            status: 'assigned',
            assigned_employee_id: request.employee_id,
            assigned_at: new Date().toISOString(),
          })
          .eq("id", request.pool_shift_id);
        if (shiftError) throw shiftError;
        
        // Reject other pending requests for this shift
        await supabase
          .from("pool_shift_requests")
          .update({
            status: 'rejected',
            rejection_reason: 'Vakten ble tildelt en annen',
          })
          .eq("pool_shift_id", request.pool_shift_id)
          .neq("id", request_id)
          .in("status", ['pending_employer', 'pending_employee']);
        
        return { success: true };
      } else {
        const { error } = await supabase
          .from("pool_shift_requests")
          .update({
            status: 'cancelled',
          })
          .eq("id", request_id);
        if (error) throw error;
        return { success: true };
      }
    },
    onSuccess: (_, { accept }) => {
      queryClient.invalidateQueries({ queryKey: ["pool-shift-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-pool-shift-requests"] });
      queryClient.invalidateQueries({ queryKey: ["all-pool-shift-requests"] });
      queryClient.invalidateQueries({ queryKey: ["pool-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["my-pool-shifts"] });
      toast.success(accept ? "Vakt akseptert!" : "Vakt avslått");
    },
  });
}

// ==========================================
// Employee Pool Ratings
// ==========================================
export function useEmployeePoolRating(employeeId?: string) {
  return useQuery({
    queryKey: ["employee-pool-rating", employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      const { data, error } = await supabase
        .from("employee_pool_ratings")
        .select("*")
        .eq("employee_id", employeeId)
        .maybeSingle();
      if (error) throw error;
      return data as EmployeePoolRating | null;
    },
    enabled: !!employeeId,
  });
}

// ==========================================
// Pooled Employees (for browsing available workers)
// ==========================================
export function usePooledEmployees() {
  return useQuery({
    queryKey: ["pooled-employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_pool_settings")
        .select(`
          *,
          employee:profiles!employee_pool_settings_employee_id_fkey(
            id, 
            full_name, 
            avatar_url,
            function:functions(id, name, color)
          )
        `)
        .eq("is_available_for_pooling", true);
      if (error) throw error;
      return data;
    },
  });
}

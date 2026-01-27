import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AMUMember, AMUMeeting, AMUAgendaTemplate, AMUMeetingParticipant, AMUAgendaItem, AMUMemberType, AMUAttendanceStatus, AMUMeetingRole, AMUAgendaItemStatus, AMUMeetingStatus } from "@/types/amu";

// ============================================
// AMU Members Hooks
// ============================================

export function useAMUMembers() {
  return useQuery({
    queryKey: ["amu-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("amu_members")
        .select(`
          *,
          profile:profiles(
            id, full_name, email, phone, department_id,
            departments(name)
          )
        `)
        .eq("is_active", true)
        .order("member_type");

      if (error) throw error;
      return data as unknown as AMUMember[];
    },
  });
}

export function useAddAMUMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (member: {
      profile_id: string;
      member_type: AMUMemberType;
      title?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("amu_members")
        .insert(member)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amu-members"] });
      toast.success("AMU-medlem lagt til");
    },
    onError: (error) => {
      console.error("Error adding AMU member:", error);
      toast.error("Kunne ikke legge til AMU-medlem");
    },
  });
}

export function useUpdateAMUMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<AMUMember> & { id: string }) => {
      const { data, error } = await supabase
        .from("amu_members")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amu-members"] });
      toast.success("AMU-medlem oppdatert");
    },
    onError: (error) => {
      console.error("Error updating AMU member:", error);
      toast.error("Kunne ikke oppdatere AMU-medlem");
    },
  });
}

export function useRemoveAMUMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("amu_members")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amu-members"] });
      toast.success("AMU-medlem fjernet");
    },
    onError: (error) => {
      console.error("Error removing AMU member:", error);
      toast.error("Kunne ikke fjerne AMU-medlem");
    },
  });
}

// ============================================
// AMU Meetings Hooks
// ============================================

export function useAMUMeetings() {
  return useQuery({
    queryKey: ["amu-meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("amu_meetings")
        .select(`
          *,
          participants:amu_meeting_participants(
            *,
            profile:profiles(id, full_name, email)
          ),
          agenda_items:amu_meeting_agenda_items(*)
        `)
        .order("meeting_date", { ascending: false });

      if (error) throw error;
      return data as unknown as AMUMeeting[];
    },
  });
}

export function useAMUMeeting(meetingId: string | undefined) {
  return useQuery({
    queryKey: ["amu-meeting", meetingId],
    queryFn: async () => {
      if (!meetingId) return null;
      
      const { data, error } = await supabase
        .from("amu_meetings")
        .select(`
          *,
          participants:amu_meeting_participants(
            *,
            profile:profiles(id, full_name, email)
          ),
          agenda_items:amu_meeting_agenda_items(
            *,
            responsible:profiles(id, full_name)
          )
        `)
        .eq("id", meetingId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as AMUMeeting | null;
    },
    enabled: !!meetingId,
  });
}

export function useCreateAMUMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meeting: {
      title: string;
      description?: string;
      meeting_date: string;
      meeting_time?: string;
      location?: string;
      template_id?: string;
      created_by: string;
    }) => {
      // Get next meeting number for the year
      const year = new Date(meeting.meeting_date).getFullYear();
      const { count } = await supabase
        .from("amu_meetings")
        .select("*", { count: "exact", head: true })
        .gte("meeting_date", `${year}-01-01`)
        .lte("meeting_date", `${year}-12-31`);

      const { data, error } = await supabase
        .from("amu_meetings")
        .insert({
          ...meeting,
          meeting_number: (count || 0) + 1,
          status: "draft" as AMUMeetingStatus,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amu-meetings"] });
      toast.success("AMU-møte opprettet");
    },
    onError: (error) => {
      console.error("Error creating AMU meeting:", error);
      toast.error("Kunne ikke opprette AMU-møte");
    },
  });
}

export function useUpdateAMUMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<AMUMeeting> & { id: string }) => {
      const { data, error } = await supabase
        .from("amu_meetings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["amu-meetings"] });
      queryClient.invalidateQueries({ queryKey: ["amu-meeting", variables.id] });
    },
    onError: (error) => {
      console.error("Error updating AMU meeting:", error);
      toast.error("Kunne ikke oppdatere AMU-møte");
    },
  });
}

// ============================================
// Meeting Participants Hooks
// ============================================

export function useAddMeetingParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (participant: {
      meeting_id: string;
      profile_id: string;
      attendance_status?: AMUAttendanceStatus;
      role_in_meeting?: AMUMeetingRole;
    }) => {
      const { data, error } = await supabase
        .from("amu_meeting_participants")
        .insert({
          ...participant,
          attendance_status: participant.attendance_status || "invited",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["amu-meeting", data.meeting_id] });
    },
  });
}

export function useUpdateMeetingParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      meeting_id,
      ...updates
    }: Partial<AMUMeetingParticipant> & { id: string; meeting_id: string }) => {
      const { data, error } = await supabase
        .from("amu_meeting_participants")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, meeting_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["amu-meeting", data.meeting_id] });
    },
  });
}

export function useRemoveMeetingParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, meeting_id }: { id: string; meeting_id: string }) => {
      const { error } = await supabase
        .from("amu_meeting_participants")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return meeting_id;
    },
    onSuccess: (meeting_id) => {
      queryClient.invalidateQueries({ queryKey: ["amu-meeting", meeting_id] });
    },
  });
}

// ============================================
// Agenda Items Hooks
// ============================================

export function useAddAgendaItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: {
      meeting_id: string;
      sort_order: number;
      title: string;
      description?: string;
      responsible_id?: string;
      estimated_minutes?: number;
    }) => {
      const { data, error } = await supabase
        .from("amu_meeting_agenda_items")
        .insert({
          ...item,
          status: "pending" as AMUAgendaItemStatus,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["amu-meeting", data.meeting_id] });
    },
  });
}

export function useUpdateAgendaItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      meeting_id,
      ...updates
    }: Partial<AMUAgendaItem> & { id: string; meeting_id: string }) => {
      const { data, error } = await supabase
        .from("amu_meeting_agenda_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, meeting_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["amu-meeting", data.meeting_id] });
    },
  });
}

export function useDeleteAgendaItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, meeting_id }: { id: string; meeting_id: string }) => {
      const { error } = await supabase
        .from("amu_meeting_agenda_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return meeting_id;
    },
    onSuccess: (meeting_id) => {
      queryClient.invalidateQueries({ queryKey: ["amu-meeting", meeting_id] });
    },
  });
}

export function useBulkUpdateAgendaItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      meeting_id,
      items,
    }: {
      meeting_id: string;
      items: Partial<AMUAgendaItem>[];
    }) => {
      // Delete existing items
      await supabase
        .from("amu_meeting_agenda_items")
        .delete()
        .eq("meeting_id", meeting_id);

      // Insert new items
      if (items.length > 0) {
        const { error } = await supabase
          .from("amu_meeting_agenda_items")
          .insert(
            items.map((item, index) => ({
              meeting_id,
              sort_order: index + 1,
              title: item.title || "",
              description: item.description,
              responsible_id: item.responsible_id,
              notes: item.notes,
              decision: item.decision,
              status: item.status || "pending",
              estimated_minutes: item.estimated_minutes,
            }))
          );

        if (error) throw error;
      }

      return meeting_id;
    },
    onSuccess: (meeting_id) => {
      queryClient.invalidateQueries({ queryKey: ["amu-meeting", meeting_id] });
    },
  });
}

// ============================================
// Agenda Templates Hooks
// ============================================

export function useAMUAgendaTemplates() {
  return useQuery({
    queryKey: ["amu-agenda-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("amu_agenda_templates")
        .select(`
          *,
          items:amu_agenda_template_items(*)
        `)
        .eq("is_active", true)
        .order("is_default", { ascending: false });

      if (error) throw error;
      return data as unknown as AMUAgendaTemplate[];
    },
  });
}

export function useApplyAgendaTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      meeting_id,
      template_id,
    }: {
      meeting_id: string;
      template_id: string;
    }) => {
      // Get template items
      const { data: template, error: templateError } = await supabase
        .from("amu_agenda_templates")
        .select(`
          *,
          items:amu_agenda_template_items(*)
        `)
        .eq("id", template_id)
        .single();

      if (templateError) throw templateError;

      // Insert agenda items from template
      const items = (template as unknown as AMUAgendaTemplate).items || [];
      if (items.length > 0) {
        const { error: insertError } = await supabase
          .from("amu_meeting_agenda_items")
          .insert(
            items.map((item) => ({
              meeting_id,
              sort_order: item.sort_order,
              title: item.title,
              description: item.description,
              status: "pending" as AMUAgendaItemStatus,
              estimated_minutes: item.estimated_minutes,
            }))
          );

        if (insertError) throw insertError;
      }

      // Update meeting with template reference
      await supabase
        .from("amu_meetings")
        .update({ template_id })
        .eq("id", meeting_id);

      return meeting_id;
    },
    onSuccess: (meeting_id) => {
      queryClient.invalidateQueries({ queryKey: ["amu-meeting", meeting_id] });
      toast.success("Agenda-mal anvendt");
    },
  });
}

// ============================================
// Check if current user is AMU member
// ============================================

export function useIsAMUMember() {
  return useQuery({
    queryKey: ["is-amu-member"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from("amu_members")
        .select("id")
        .eq("profile_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
  });
}

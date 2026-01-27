import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type {
  Conversation,
  ConversationFilters,
  CreateConversationInput,
  UpdateConversationInput,
  ConversationResponse,
  CreateResponseInput,
  NotificationSettings,
} from '@/types/conversations';

// Fetch all conversations with filters
export function useConversations(filters?: ConversationFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', filters],
    queryFn: async () => {
      let query = supabase
        .from('conversations')
        .select(`
          *,
          employee:profiles!conversations_employee_id_fkey(id, full_name, email, avatar_url),
          manager:profiles!conversations_manager_id_fkey(id, full_name, email),
          template:conversation_templates(id, name)
        `)
        .order('scheduled_date', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.employee_id) {
        query = query.eq('employee_id', filters.employee_id);
      }
      if (filters?.manager_id) {
        query = query.eq('manager_id', filters.manager_id);
      }
      if (filters?.from_date) {
        query = query.gte('scheduled_date', filters.from_date);
      }
      if (filters?.to_date) {
        query = query.lte('scheduled_date', filters.to_date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((item: any) => ({
        ...item,
        notification_settings: item.notification_settings as NotificationSettings,
      })) as Conversation[];
    },
    enabled: !!user,
  });
}

// Fetch single conversation with all related data
export function useConversation(id: string) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          employee:profiles!conversations_employee_id_fkey(id, full_name, email, avatar_url),
          manager:profiles!conversations_manager_id_fkey(id, full_name, email),
          template:conversation_templates(id, name),
          responses:conversation_responses(
            *,
            question:conversation_questions(*, category:conversation_categories(*))
          ),
          actions:conversation_actions(*, responsible:profiles(id, full_name))
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return {
        ...data,
        notification_settings: data.notification_settings as unknown as NotificationSettings,
      } as Conversation;
    },
    enabled: !!id,
  });
}

// Create conversation(s)
export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateConversationInput) => {
      const conversations = [];

      for (const employeeId of input.employee_ids) {
        // Create conversation
        const insertData: any = {
          employee_id: employeeId,
          manager_id: user!.id,
          scheduled_date: input.scheduled_date,
          scheduled_time: input.scheduled_time || null,
          duration_minutes: input.duration_minutes,
          location: input.location || null,
          location_type: input.location_type,
          template_id: input.template_id || null,
          notification_settings: input.notification_settings,
          allow_employee_preparation: input.allow_employee_preparation,
          status: 'scheduled',
        };

        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .insert([insertData])
          .select()
          .single();

        if (convError) throw convError;

        // Create responses for selected questions
        if (input.question_ids.length > 0) {
          const responses = input.question_ids.map((questionId, index) => ({
            conversation_id: conversation.id,
            question_id: questionId,
            sort_order: index,
          }));

          const { error: respError } = await supabase
            .from('conversation_responses')
            .insert(responses);

          if (respError) throw respError;
        }

        conversations.push(conversation);
      }

      return conversations;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        title: 'Samtale planlagt',
        description: 'Invitasjon er sendt til den ansatte.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke opprette samtale: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update conversation
export function useUpdateConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateConversationInput & { id: string }) => {
      const { data, error } = await supabase
        .from('conversations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', data.id] });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke oppdatere samtale: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

// Start conversation
export function useStartConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('conversations')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', data.id] });
    },
  });
}

// Complete conversation
export function useCompleteConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, summary, overall_rating }: { id: string; summary?: string; overall_rating?: number }) => {
      const { data, error } = await supabase
        .from('conversations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          summary,
          overall_rating,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', data.id] });
      toast({
        title: 'Samtale fullført',
        description: 'Referatet er lagret.',
      });
    },
  });
}

// Cancel conversation
export function useCancelConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('conversations')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        title: 'Samtale kansellert',
        description: 'Den ansatte har blitt varslet.',
      });
    },
  });
}

// Update/upsert response
export function useUpdateResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateResponseInput) => {
      const { data, error } = await supabase
        .from('conversation_responses')
        .upsert(input, {
          onConflict: 'conversation_id,question_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', data.conversation_id] });
    },
  });
}

// Get conversation statistics
export function useConversationStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversation-stats'],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      // Get this month's conversations
      const { data: monthConversations, error: monthError } = await supabase
        .from('conversations')
        .select('id, status, overall_rating')
        .gte('scheduled_date', startOfMonth)
        .lte('scheduled_date', endOfMonth);

      if (monthError) throw monthError;

      // Get pending actions
      const { data: pendingActions, error: actionsError } = await supabase
        .from('conversation_actions')
        .select('id')
        .eq('status', 'pending');

      if (actionsError) throw actionsError;

      const completed = monthConversations?.filter(c => c.status === 'completed') || [];
      const ratings = completed.filter(c => c.overall_rating).map(c => c.overall_rating!);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      return {
        thisMonth: monthConversations?.length || 0,
        completed: completed.length,
        avgRating: Math.round(avgRating * 10) / 10,
        pendingActions: pendingActions?.length || 0,
      };
    },
    enabled: !!user,
  });
}

// Get last conversation date for an employee
export function useLastConversationDate(employeeId: string) {
  return useQuery({
    queryKey: ['last-conversation', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('completed_at')
        .eq('employee_id', employeeId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data?.completed_at || null;
    },
    enabled: !!employeeId,
  });
}

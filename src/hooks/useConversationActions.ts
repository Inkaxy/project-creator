import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { ConversationAction, CreateActionInput, ActionStatus } from '@/types/conversations';

// Fetch actions for a conversation
export function useConversationActions(conversationId: string) {
  return useQuery({
    queryKey: ['conversation-actions', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_actions')
        .select('*, responsible:profiles(id, full_name)')
        .eq('conversation_id', conversationId)
        .order('created_at');

      if (error) throw error;
      return data as ConversationAction[];
    },
    enabled: !!conversationId,
  });
}

// Fetch my pending actions (for employee view)
export function useMyActions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_actions')
        .select(`
          *,
          responsible:profiles(id, full_name),
          conversation:conversations(
            id, 
            scheduled_date,
            manager:profiles!conversations_manager_id_fkey(id, full_name)
          )
        `)
        .eq('responsible_id', user!.id)
        .neq('status', 'completed')
        .order('due_date', { nullsFirst: false });

      if (error) throw error;
      return data as (ConversationAction & { conversation: any })[];
    },
    enabled: !!user,
  });
}

// Create action
export function useCreateAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateActionInput) => {
      const { data, error } = await supabase
        .from('conversation_actions')
        .insert(input)
        .select('*, responsible:profiles(id, full_name)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversation-actions', data.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ['conversation', data.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ['my-actions'] });
      queryClient.invalidateQueries({ queryKey: ['conversation-stats'] });
      toast({ title: 'Handlingspunkt opprettet' });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update action status
export function useUpdateActionStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ActionStatus }) => {
      const updates: any = { status };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      } else {
        updates.completed_at = null;
      }

      const { data, error } = await supabase
        .from('conversation_actions')
        .update(updates)
        .eq('id', id)
        .select('*, responsible:profiles(id, full_name)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversation-actions', data.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ['conversation', data.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ['my-actions'] });
      queryClient.invalidateQueries({ queryKey: ['conversation-stats'] });
      toast({ title: 'Status oppdatert' });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update action
export function useUpdateAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ConversationAction> & { id: string }) => {
      const { data, error } = await supabase
        .from('conversation_actions')
        .update(updates)
        .eq('id', id)
        .select('*, responsible:profiles(id, full_name)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversation-actions', data.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ['conversation', data.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ['my-actions'] });
      toast({ title: 'Handlingspunkt oppdatert' });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Delete action
export function useDeleteAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, conversationId }: { id: string; conversationId: string }) => {
      const { error } = await supabase
        .from('conversation_actions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { conversationId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversation-actions', data.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversation', data.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['my-actions'] });
      queryClient.invalidateQueries({ queryKey: ['conversation-stats'] });
      toast({ title: 'Handlingspunkt slettet' });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

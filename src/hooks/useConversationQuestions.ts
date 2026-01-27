import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ConversationCategory, ConversationQuestion, QuestionType } from '@/types/conversations';

// Fetch all categories
export function useCategories() {
  return useQuery({
    queryKey: ['conversation-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as ConversationCategory[];
    },
  });
}

// Fetch all questions, optionally by category
export function useQuestions(categoryId?: string) {
  return useQuery({
    queryKey: ['conversation-questions', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('conversation_questions')
        .select('*, category:conversation_categories(*)')
        .eq('is_active', true)
        .order('sort_order');

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ConversationQuestion[];
    },
  });
}

// Fetch default questions
export function useDefaultQuestions() {
  return useQuery({
    queryKey: ['conversation-default-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_questions')
        .select('*, category:conversation_categories(*)')
        .eq('is_active', true)
        .eq('is_default', true)
        .order('sort_order');

      if (error) throw error;
      return data as ConversationQuestion[];
    },
  });
}

// Create category
export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: { name: string; description?: string; icon?: string; color?: string; sort_order?: number }) => {
      const { data, error } = await supabase
        .from('conversation_categories')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-categories'] });
      toast({ title: 'Kategori opprettet' });
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

// Update category
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ConversationCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('conversation_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-categories'] });
      toast({ title: 'Kategori oppdatert' });
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

// Delete category
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('conversation_categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-categories'] });
      toast({ title: 'Kategori slettet' });
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

// Create question
export function useCreateQuestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      category_id: string;
      question_text: string;
      description?: string;
      question_type: QuestionType;
      is_default?: boolean;
      tags?: string[];
    }) => {
      const { data, error } = await supabase
        .from('conversation_questions')
        .insert(input)
        .select('*, category:conversation_categories(*)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-questions'] });
      queryClient.invalidateQueries({ queryKey: ['conversation-default-questions'] });
      toast({ title: 'Spørsmål opprettet' });
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

// Update question
export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ConversationQuestion> & { id: string }) => {
      const { data, error } = await supabase
        .from('conversation_questions')
        .update(updates)
        .eq('id', id)
        .select('*, category:conversation_categories(*)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-questions'] });
      queryClient.invalidateQueries({ queryKey: ['conversation-default-questions'] });
      toast({ title: 'Spørsmål oppdatert' });
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

// Delete question
export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('conversation_questions')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-questions'] });
      queryClient.invalidateQueries({ queryKey: ['conversation-default-questions'] });
      toast({ title: 'Spørsmål slettet' });
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

// Reorder questions
export function useReorderQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questions: { id: string; sort_order: number }[]) => {
      for (const q of questions) {
        const { error } = await supabase
          .from('conversation_questions')
          .update({ sort_order: q.sort_order })
          .eq('id', q.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-questions'] });
    },
  });
}

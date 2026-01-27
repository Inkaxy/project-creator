import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { ConversationTemplate, ConversationTemplateQuestion } from '@/types/conversations';

// Fetch all templates
export function useTemplates() {
  return useQuery({
    queryKey: ['conversation-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_templates')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw error;
      return data as ConversationTemplate[];
    },
  });
}

// Fetch single template with questions
export function useTemplate(id: string) {
  return useQuery({
    queryKey: ['conversation-template', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_templates')
        .select(`
          *,
          questions:conversation_template_questions(
            *,
            question:conversation_questions(*, category:conversation_categories(*))
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Sort questions by sort_order
      if (data.questions) {
        data.questions.sort((a: any, b: any) => a.sort_order - b.sort_order);
      }
      
      return data as ConversationTemplate;
    },
    enabled: !!id,
  });
}

// Create template
export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      template_type?: string;
      estimated_duration_minutes?: number;
      question_ids: string[];
    }) => {
      // Create template
      const { data: template, error: templateError } = await supabase
        .from('conversation_templates')
        .insert({
          name: input.name,
          description: input.description,
          template_type: input.template_type || 'standard',
          estimated_duration_minutes: input.estimated_duration_minutes || 60,
          created_by: user!.id,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Add questions to template
      if (input.question_ids.length > 0) {
        const templateQuestions = input.question_ids.map((questionId, index) => ({
          template_id: template.id,
          question_id: questionId,
          sort_order: index,
        }));

        const { error: questionsError } = await supabase
          .from('conversation_template_questions')
          .insert(templateQuestions);

        if (questionsError) throw questionsError;
      }

      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-templates'] });
      toast({ title: 'Mal opprettet' });
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

// Update template
export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, question_ids, ...updates }: {
      id: string;
      name?: string;
      description?: string;
      estimated_duration_minutes?: number;
      question_ids?: string[];
    }) => {
      // Update template
      const { data: template, error: templateError } = await supabase
        .from('conversation_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (templateError) throw templateError;

      // Update questions if provided
      if (question_ids) {
        // Delete existing questions
        const { error: deleteError } = await supabase
          .from('conversation_template_questions')
          .delete()
          .eq('template_id', id);

        if (deleteError) throw deleteError;

        // Add new questions
        if (question_ids.length > 0) {
          const templateQuestions = question_ids.map((questionId, index) => ({
            template_id: id,
            question_id: questionId,
            sort_order: index,
          }));

          const { error: insertError } = await supabase
            .from('conversation_template_questions')
            .insert(templateQuestions);

          if (insertError) throw insertError;
        }
      }

      return template;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversation-templates'] });
      queryClient.invalidateQueries({ queryKey: ['conversation-template', data.id] });
      toast({ title: 'Mal oppdatert' });
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

// Delete template
export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('conversation_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-templates'] });
      toast({ title: 'Mal slettet' });
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

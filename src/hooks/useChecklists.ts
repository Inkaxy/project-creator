import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  department_id: string | null;
  function_id: string | null;
  frequency: string | null;
  is_required_for_clock_out: boolean | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
  departments?: { id: string; name: string } | null;
  functions?: { id: string; name: string } | null;
}

export interface ChecklistItem {
  id: string;
  template_id: string;
  title: string;
  description: string | null;
  item_type: string | null;
  min_value: number | null;
  max_value: number | null;
  unit: string | null;
  is_critical: boolean | null;
  sort_order: number | null;
  is_active: boolean | null;
  created_at: string;
}

export interface ChecklistCompletion {
  id: string;
  template_id: string;
  employee_id: string;
  shift_id: string | null;
  completed_at: string;
  notes: string | null;
  status: string | null;
  created_at: string;
  checklist_templates?: ChecklistTemplate;
  profiles?: { id: string; full_name: string };
}

export interface ChecklistResponse {
  id: string;
  completion_id: string;
  item_id: string;
  checked: boolean | null;
  value: string | null;
  photo_url: string | null;
  notes: string | null;
  is_flagged: boolean | null;
  created_at: string;
  checklist_items?: ChecklistItem;
}

// Fetch all active checklist templates
export function useChecklistTemplates() {
  return useQuery({
    queryKey: ["checklist-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_templates")
        .select(`
          *,
          departments (id, name),
          functions (id, name)
        `)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as ChecklistTemplate[];
    },
  });
}

// Fetch templates that are required for clock-out
export function useRequiredChecklistsForClockOut(shiftId?: string | null) {
  return useQuery({
    queryKey: ["required-checklists", shiftId],
    queryFn: async () => {
      // Get templates required for clock-out
      const { data: templates, error: templatesError } = await supabase
        .from("checklist_templates")
        .select("*")
        .eq("is_active", true)
        .eq("is_required_for_clock_out", true);

      if (templatesError) throw templatesError;

      if (!shiftId || !templates?.length) {
        return { templates: templates || [], completedIds: [] };
      }

      // Check which have been completed for this shift
      const { data: completions, error: completionsError } = await supabase
        .from("checklist_completions")
        .select("template_id")
        .eq("shift_id", shiftId)
        .eq("status", "completed");

      if (completionsError) throw completionsError;

      const completedIds = completions?.map(c => c.template_id) || [];

      return {
        templates: templates as ChecklistTemplate[],
        completedIds,
        pendingCount: templates.length - completedIds.length,
      };
    },
    enabled: !!shiftId,
  });
}

// Fetch items for a specific template
export function useChecklistItems(templateId: string | null) {
  return useQuery({
    queryKey: ["checklist-items", templateId],
    queryFn: async () => {
      if (!templateId) return [];

      const { data, error } = await supabase
        .from("checklist_items")
        .select("*")
        .eq("template_id", templateId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: !!templateId,
  });
}

// Fetch completions for a specific employee
export function useChecklistCompletions(employeeId?: string, date?: string) {
  return useQuery({
    queryKey: ["checklist-completions", employeeId, date],
    queryFn: async () => {
      if (!employeeId) return [];

      let query = supabase
        .from("checklist_completions")
        .select(`
          *,
          checklist_templates (id, name, category),
          profiles (id, full_name)
        `)
        .eq("employee_id", employeeId)
        .order("completed_at", { ascending: false });

      if (date) {
        query = query.gte("completed_at", `${date}T00:00:00`)
          .lt("completed_at", `${date}T23:59:59`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as ChecklistCompletion[];
    },
    enabled: !!employeeId,
  });
}

// Create a new checklist completion
export function useCreateChecklistCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      employeeId,
      shiftId,
      responses,
      notes,
    }: {
      templateId: string;
      employeeId: string;
      shiftId?: string | null;
      responses: { itemId: string; checked?: boolean; value?: string; notes?: string; isFlagged?: boolean }[];
      notes?: string;
    }) => {
      // Check if any responses are flagged
      const hasFlagged = responses.some(r => r.isFlagged);
      const allCriticalCompleted = true; // TODO: Validate critical items

      // Create completion
      const { data: completion, error: completionError } = await supabase
        .from("checklist_completions")
        .insert({
          template_id: templateId,
          employee_id: employeeId,
          shift_id: shiftId || null,
          notes,
          status: hasFlagged ? "flagged" : "completed",
        })
        .select()
        .single();

      if (completionError) throw completionError;

      // Create responses
      const responsesData = responses.map(r => ({
        completion_id: completion.id,
        item_id: r.itemId,
        checked: r.checked ?? false,
        value: r.value ?? null,
        notes: r.notes ?? null,
        is_flagged: r.isFlagged ?? false,
      }));

      const { error: responsesError } = await supabase
        .from("checklist_responses")
        .insert(responsesData);

      if (responsesError) throw responsesError;

      return completion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-completions"] });
      queryClient.invalidateQueries({ queryKey: ["required-checklists"] });
      toast.success("Sjekkliste fullført");
    },
    onError: (error) => {
      toast.error("Kunne ikke lagre sjekkliste: " + error.message);
    },
  });
}

// Admin: Create template
export function useCreateChecklistTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string } & Partial<Omit<ChecklistTemplate, 'id' | 'created_at' | 'updated_at'>>) => {
      const { data: template, error } = await supabase
        .from("checklist_templates")
        .insert({
          name: data.name,
          description: data.description,
          category: data.category,
          department_id: data.department_id,
          function_id: data.function_id,
          frequency: data.frequency,
          is_required_for_clock_out: data.is_required_for_clock_out,
          is_active: data.is_active,
          sort_order: data.sort_order,
        })
        .select()
        .single();

      if (error) throw error;
      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
      toast.success("Sjekklistemal opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette mal: " + error.message);
    },
  });
}

// Admin: Update template
export function useUpdateChecklistTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ChecklistTemplate> & { id: string }) => {
      const { error } = await supabase
        .from("checklist_templates")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
      toast.success("Sjekklistemal oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere mal: " + error.message);
    },
  });
}

// Admin: Delete template (soft delete)
export function useDeleteChecklistTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("checklist_templates")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
      toast.success("Sjekklistemal slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette mal: " + error.message);
    },
  });
}

// Admin: Create/Update items
export function useManageChecklistItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      items,
    }: {
      templateId: string;
      items: (Partial<ChecklistItem> & { title: string })[];
    }) => {
      // Update existing and create new items
      for (const item of items) {
        if (item.id) {
          const { id, ...updateData } = item;
          const { error } = await supabase
            .from("checklist_items")
            .update({
              title: updateData.title,
              description: updateData.description,
              item_type: updateData.item_type,
              min_value: updateData.min_value,
              max_value: updateData.max_value,
              unit: updateData.unit,
              is_critical: updateData.is_critical,
              sort_order: updateData.sort_order,
              is_active: updateData.is_active,
            })
            .eq("id", id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("checklist_items")
            .insert({
              template_id: templateId,
              title: item.title,
              description: item.description,
              item_type: item.item_type,
              min_value: item.min_value,
              max_value: item.max_value,
              unit: item.unit,
              is_critical: item.is_critical,
              sort_order: item.sort_order,
              is_active: item.is_active,
            });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-items"] });
      toast.success("Sjekklistepunkter oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere punkter: " + error.message);
    },
  });
}

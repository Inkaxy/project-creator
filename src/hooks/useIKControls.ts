import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface IKControlTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  department_id: string | null;
  frequency: string;
  time_of_day: string | null;
  is_active: boolean;
  is_critical: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  departments?: { id: string; name: string; color: string | null } | null;
}

export interface IKControlItem {
  id: string;
  template_id: string;
  title: string;
  description: string | null;
  item_type: string;
  min_value: number | null;
  max_value: number | null;
  unit: string | null;
  is_critical: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface IKControlLog {
  id: string;
  template_id: string;
  logged_by: string;
  logged_at: string;
  scheduled_date: string;
  status: string;
  notes: string | null;
  has_deviations: boolean;
  created_at: string;
  ik_control_templates?: IKControlTemplate;
  profiles?: { id: string; full_name: string };
}

export interface IKControlResponse {
  id: string;
  log_id: string;
  item_id: string;
  checked: boolean;
  value: string | null;
  numeric_value: number | null;
  photo_url: string | null;
  notes: string | null;
  is_deviation: boolean;
  deviation_action: string | null;
  created_at: string;
  ik_control_items?: IKControlItem;
}

// Fetch all active control templates
export function useIKControlTemplates(departmentId?: string | null) {
  return useQuery({
    queryKey: ["ik-control-templates", departmentId],
    queryFn: async () => {
      let query = supabase
        .from("ik_control_templates")
        .select(`
          *,
          departments (id, name, color)
        `)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (departmentId) {
        query = query.eq("department_id", departmentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as IKControlTemplate[];
    },
  });
}

// Fetch items for a specific template
export function useIKControlItems(templateId: string | null) {
  return useQuery({
    queryKey: ["ik-control-items", templateId],
    queryFn: async () => {
      if (!templateId) return [];

      const { data, error } = await supabase
        .from("ik_control_items")
        .select("*")
        .eq("template_id", templateId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as IKControlItem[];
    },
    enabled: !!templateId,
  });
}

// Fetch today's control logs
export function useTodayControlLogs(departmentId?: string | null) {
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["ik-control-logs-today", departmentId],
    queryFn: async () => {
      let query = supabase
        .from("ik_control_logs")
        .select(`
          *,
          ik_control_templates (
            id, name, category, department_id,
            departments (id, name, color)
          ),
          profiles (id, full_name)
        `)
        .eq("scheduled_date", today)
        .order("logged_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Filter by department if specified
      if (departmentId) {
        return (data as unknown as IKControlLog[]).filter(
          (log) => log.ik_control_templates?.department_id === departmentId
        );
      }

      return data as unknown as IKControlLog[];
    },
  });
}

// Fetch control logs for a date range
export function useControlLogs(dateFrom?: string, dateTo?: string, departmentId?: string | null) {
  return useQuery({
    queryKey: ["ik-control-logs", dateFrom, dateTo, departmentId],
    queryFn: async () => {
      let query = supabase
        .from("ik_control_logs")
        .select(`
          *,
          ik_control_templates (
            id, name, category, department_id,
            departments (id, name, color)
          ),
          profiles (id, full_name)
        `)
        .order("logged_at", { ascending: false });

      if (dateFrom) {
        query = query.gte("scheduled_date", dateFrom);
      }
      if (dateTo) {
        query = query.lte("scheduled_date", dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (departmentId) {
        return (data as unknown as IKControlLog[]).filter(
          (log) => log.ik_control_templates?.department_id === departmentId
        );
      }

      return data as unknown as IKControlLog[];
    },
  });
}

// Fetch pending controls for today
export function usePendingControls(departmentId?: string | null) {
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["ik-pending-controls", departmentId],
    queryFn: async () => {
      // Get all active templates
      let templatesQuery = supabase
        .from("ik_control_templates")
        .select(`*, departments (id, name, color)`)
        .eq("is_active", true);

      if (departmentId) {
        templatesQuery = templatesQuery.eq("department_id", departmentId);
      }

      const { data: templates, error: templatesError } = await templatesQuery;
      if (templatesError) throw templatesError;

      // Get today's completed logs
      const { data: logs, error: logsError } = await supabase
        .from("ik_control_logs")
        .select("template_id")
        .eq("scheduled_date", today);

      if (logsError) throw logsError;

      const completedTemplateIds = new Set(logs?.map((l) => l.template_id) || []);

      // Return templates that haven't been completed today
      const pending = (templates || []).filter(
        (t) => !completedTemplateIds.has(t.id)
      );

      return {
        templates: templates as IKControlTemplate[],
        pending: pending as IKControlTemplate[],
        completed: (templates || []).filter((t) =>
          completedTemplateIds.has(t.id)
        ) as IKControlTemplate[],
        completedCount: completedTemplateIds.size,
        totalCount: templates?.length || 0,
      };
    },
  });
}

// Create a control log
export function useCreateControlLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      responses,
      notes,
    }: {
      templateId: string;
      responses: {
        itemId: string;
        checked?: boolean;
        value?: string;
        numericValue?: number;
        notes?: string;
        isDeviation?: boolean;
        deviationAction?: string;
      }[];
      notes?: string;
    }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const hasDeviations = responses.some((r) => r.isDeviation);

      // Create log
      const { data: log, error: logError } = await supabase
        .from("ik_control_logs")
        .insert({
          template_id: templateId,
          logged_by: userId,
          notes,
          status: hasDeviations ? "flagged" : "completed",
          has_deviations: hasDeviations,
        })
        .select()
        .single();

      if (logError) throw logError;

      // Create responses
      const responsesData = responses.map((r) => ({
        log_id: log.id,
        item_id: r.itemId,
        checked: r.checked ?? false,
        value: r.value ?? null,
        numeric_value: r.numericValue ?? null,
        notes: r.notes ?? null,
        is_deviation: r.isDeviation ?? false,
        deviation_action: r.deviationAction ?? null,
      }));

      const { error: responsesError } = await supabase
        .from("ik_control_responses")
        .insert(responsesData);

      if (responsesError) throw responsesError;

      return log;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-control-logs"] });
      queryClient.invalidateQueries({ queryKey: ["ik-control-logs-today"] });
      queryClient.invalidateQueries({ queryKey: ["ik-pending-controls"] });
      toast.success("Kontroll registrert");
    },
    onError: (error) => {
      toast.error("Kunne ikke lagre kontroll: " + error.message);
    },
  });
}

// Create a control template
export function useCreateControlTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: Omit<IKControlTemplate, "id" | "created_at" | "updated_at" | "departments">
    ) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;

      const { data: template, error } = await supabase
        .from("ik_control_templates")
        .insert({
          ...data,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-control-templates"] });
      queryClient.invalidateQueries({ queryKey: ["ik-pending-controls"] });
      toast.success("Kontrollpunkt opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette kontrollpunkt: " + error.message);
    },
  });
}

// Update a control template
export function useUpdateControlTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<IKControlTemplate> & { id: string }) => {
      const { error } = await supabase
        .from("ik_control_templates")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-control-templates"] });
      queryClient.invalidateQueries({ queryKey: ["ik-pending-controls"] });
      toast.success("Kontrollpunkt oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere kontrollpunkt: " + error.message);
    },
  });
}

// Delete a control template (soft delete)
export function useDeleteControlTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ik_control_templates")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-control-templates"] });
      queryClient.invalidateQueries({ queryKey: ["ik-pending-controls"] });
      toast.success("Kontrollpunkt slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette kontrollpunkt: " + error.message);
    },
  });
}

// Manage control items
export function useManageControlItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      items,
    }: {
      templateId: string;
      items: (Partial<IKControlItem> & { title: string })[];
    }) => {
      for (const item of items) {
        if (item.id) {
          const { id, ...updateData } = item;
          const { error } = await supabase
            .from("ik_control_items")
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
          const { error } = await supabase.from("ik_control_items").insert({
            template_id: templateId,
            title: item.title,
            description: item.description,
            item_type: item.item_type || "checkbox",
            min_value: item.min_value,
            max_value: item.max_value,
            unit: item.unit,
            is_critical: item.is_critical,
            sort_order: item.sort_order,
            is_active: item.is_active ?? true,
          });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-control-items"] });
      toast.success("Kontrollpunkter oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere punkter: " + error.message);
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, startOfWeek, getDay, addWeeks } from "date-fns";
import { nb } from "date-fns/locale";
import { isNorwegianHoliday } from "@/lib/norwegian-holidays";
export interface TemplateShift {
  id: string;
  template_id: string;
  day_of_week: number;
  function_id: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  employee_id: string | null;
  functions?: {
    id: string;
    name: string;
    color: string | null;
  };
  profiles?: {
    id: string;
    full_name: string | null;
  };
}

export interface ShiftTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  is_default: boolean;
  department_id: string | null;
  is_rotating: boolean;
  rotation_group_id: string | null;
  rotation_sequence: number | null;
  rotation_name: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  template_shifts?: TemplateShift[];
  shift_count?: number;
  department?: {
    id: string;
    name: string;
  } | null;
  rotation_group?: RotationGroup | null;
}

export interface RotationGroup {
  id: string;
  name: string;
  description: string | null;
  rotation_length: number;
  department_id: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  templates?: ShiftTemplate[];
  department?: {
    id: string;
    name: string;
  } | null;
}

export interface RolloutRotationInput {
  rotationGroupId: string;
  startWeekDate: Date;
  numberOfCycles: number;
  startingSequence?: number;
  keepEmployeeAssignments?: boolean;
  skipHolidays?: boolean;
  overwriteExisting?: boolean;
}

export interface RotationRolloutPreview {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  templateId: string;
  templateName: string;
  rotationName: string;
  shiftCount: number;
  totalHours: number;
  estimatedCost: number;
  hasHoliday: boolean;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  category?: string;
  is_default?: boolean;
}

export interface SaveWeekAsTemplateInput {
  name: string;
  description?: string;
  category?: string;
  is_default?: boolean;
  weekStartDate: Date;
  includeEmployees?: boolean;
  department_id?: string | null;
}

export interface RolloutTemplateInput {
  templateId: string;
  startWeekDate: Date;
  numberOfWeeks: number;
  keepEmployeeAssignments?: boolean;
  skipHolidays?: boolean;
  overwriteExisting?: boolean;
}

export interface WeekCostPreview {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  shiftCount: number;
  totalHours: number;
  estimatedCost: number;
  hasHoliday: boolean;
}

export interface CopyWeekInput {
  sourceWeekStart: Date;
  targetWeekStart: Date;
  keepEmployees: boolean;
  skipHolidays: boolean;
  overwrite: boolean;
}

// Fetch all shift templates with shift count
export function useShiftTemplates(departmentId?: string | null) {
  return useQuery({
    queryKey: ["shift_templates", departmentId],
    queryFn: async () => {
      let query = supabase
        .from("shift_templates")
        .select(`
          *,
          template_shifts(count),
          departments(id, name)
        `)
        .order("is_default", { ascending: false })
        .order("name");

      // Filter: show global templates + templates for specific department
      if (departmentId) {
        query = query.or(`department_id.eq.${departmentId},department_id.is.null`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((template: any) => ({
        ...template,
        shift_count: template.template_shifts?.[0]?.count || 0,
        department: template.departments,
      })) as ShiftTemplate[];
    },
  });
}

// Fetch single template with all shifts
export function useShiftTemplate(templateId: string | null) {
  return useQuery({
    queryKey: ["shift_template", templateId],
    queryFn: async () => {
      if (!templateId) return null;

      const { data, error } = await supabase
        .from("shift_templates")
        .select(`
          *,
          template_shifts(
            *,
            functions(id, name, color),
            profiles(id, full_name)
          )
        `)
        .eq("id", templateId)
        .single();

      if (error) throw error;
      return data as ShiftTemplate;
    },
    enabled: !!templateId,
  });
}

// Create a new template
export function useCreateShiftTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      const { data: userData } = await supabase.auth.getUser();
      
      // If setting as default, unset other defaults first
      if (input.is_default) {
        await supabase
          .from("shift_templates")
          .update({ is_default: false })
          .eq("is_default", true);
      }

      const { data, error } = await supabase
        .from("shift_templates")
        .insert({
          ...input,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift_templates"] });
      toast.success("Mal opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette mal: " + error.message);
    },
  });
}

// Update a template
export function useUpdateShiftTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: CreateTemplateInput & { id: string }) => {
      // If setting as default, unset other defaults first
      if (input.is_default) {
        await supabase
          .from("shift_templates")
          .update({ is_default: false })
          .neq("id", id)
          .eq("is_default", true);
      }

      const { data, error } = await supabase
        .from("shift_templates")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift_templates"] });
      toast.success("Mal oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere mal: " + error.message);
    },
  });
}

// Delete a template
export function useDeleteShiftTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("shift_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift_templates"] });
      toast.success("Mal slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette mal: " + error.message);
    },
  });
}

// Save current week as template
export function useSaveCurrentWeekAsTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveWeekAsTemplateInput) => {
      const { data: userData } = await supabase.auth.getUser();
      
      // Get the week's date range
      const weekStart = startOfWeek(input.weekStartDate, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      
      // Fetch shifts for this week
      const { data: shifts, error: shiftsError } = await supabase
        .from("shifts")
        .select("*")
        .gte("date", format(weekStart, "yyyy-MM-dd"))
        .lte("date", format(weekEnd, "yyyy-MM-dd"))
        .neq("status", "cancelled");

      if (shiftsError) throw shiftsError;
      
      if (!shifts || shifts.length === 0) {
        throw new Error("Ingen vakter funnet i denne uken");
      }

      // If setting as default, unset other defaults first
      if (input.is_default) {
        await supabase
          .from("shift_templates")
          .update({ is_default: false })
          .eq("is_default", true);
      }

      // Create the template
      const { data: template, error: templateError } = await supabase
        .from("shift_templates")
        .insert({
          name: input.name,
          description: input.description,
          category: input.category,
          is_default: input.is_default || false,
          department_id: input.department_id || null,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Create template shifts from actual shifts
      const templateShifts = shifts.map((shift) => {
        const shiftDate = new Date(shift.date);
        const dayOfWeek = getDay(shiftDate); // 0 = Sunday, 1 = Monday, etc.
        
        return {
          template_id: template.id,
          day_of_week: dayOfWeek,
          function_id: shift.function_id,
          start_time: shift.planned_start,
          end_time: shift.planned_end,
          break_minutes: shift.planned_break_minutes || 30,
          employee_id: input.includeEmployees ? shift.employee_id : null,
        };
      });

      const { error: shiftsInsertError } = await supabase
        .from("template_shifts")
        .insert(templateShifts);

      if (shiftsInsertError) throw shiftsInsertError;

      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift_templates"] });
      toast.success("Uke lagret som mal");
    },
    onError: (error) => {
      toast.error("Kunne ikke lagre mal: " + error.message);
    },
  });
}

// Helper to get date from day of week relative to a week start
function getDateFromDayOfWeek(weekStart: Date, dayOfWeek: number): Date {
  // weekStart is Monday (dayOfWeek = 1)
  // We need to calculate the offset
  // dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return addDays(weekStart, mondayOffset);
}

// isNorwegianHoliday is now imported from @/lib/norwegian-holidays

// Calculate hours for a shift
function calculateShiftHours(startTime: string, endTime: string, breakMinutes: number): number {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  
  let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  
  // Handle overnight shifts
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }
  
  totalMinutes -= breakMinutes;
  return totalMinutes / 60;
}

// Preview rollout costs
export function previewRolloutCost(
  templateShifts: TemplateShift[],
  startWeekDate: Date,
  numberOfWeeks: number,
  baseHourlyRate: number = 200 // Default hourly rate
): WeekCostPreview[] {
  const previews: WeekCostPreview[] = [];
  
  for (let week = 0; week < numberOfWeeks; week++) {
    const weekStart = addDays(startOfWeek(startWeekDate, { weekStartsOn: 1 }), week * 7);
    const weekEnd = addDays(weekStart, 6);
    
    let shiftCount = 0;
    let totalHours = 0;
    let hasHoliday = false;
    
    for (const templateShift of templateShifts) {
      const shiftDate = getDateFromDayOfWeek(weekStart, templateShift.day_of_week);
      
      if (isNorwegianHoliday(shiftDate)) {
        hasHoliday = true;
      }
      
      shiftCount++;
      const hours = calculateShiftHours(
        templateShift.start_time,
        templateShift.end_time,
        templateShift.break_minutes
      );
      totalHours += hours;
    }
    
    // Estimate cost (simplified - actual would use calculateShiftCost)
    const estimatedCost = totalHours * baseHourlyRate * (hasHoliday ? 1.5 : 1);
    
    previews.push({
      weekNumber: week + 1,
      weekStart,
      weekEnd,
      shiftCount,
      totalHours,
      estimatedCost,
      hasHoliday,
    });
  }
  
  return previews;
}

// Rollout template to weeks
export function useRolloutTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RolloutTemplateInput) => {
      const { data: userData } = await supabase.auth.getUser();
      
      // Fetch template with shifts
      const { data: template, error: templateError } = await supabase
        .from("shift_templates")
        .select(`
          *,
          template_shifts(*)
        `)
        .eq("id", input.templateId)
        .single();

      if (templateError) throw templateError;
      if (!template.template_shifts || template.template_shifts.length === 0) {
        throw new Error("Malen har ingen vakter");
      }

      const shiftsToCreate: any[] = [];
      const weekStart = startOfWeek(input.startWeekDate, { weekStartsOn: 1 });

      for (let week = 0; week < input.numberOfWeeks; week++) {
        const currentWeekStart = addDays(weekStart, week * 7);

        for (const templateShift of template.template_shifts) {
          const shiftDate = getDateFromDayOfWeek(currentWeekStart, templateShift.day_of_week);
          const dateStr = format(shiftDate, "yyyy-MM-dd");
          
          // Skip holidays if option is set
          if (input.skipHolidays && isNorwegianHoliday(shiftDate)) {
            continue;
          }

          // Check if shift already exists
          if (!input.overwriteExisting) {
            const { data: existing } = await supabase
              .from("shifts")
              .select("id")
              .eq("date", dateStr)
              .eq("function_id", templateShift.function_id)
              .eq("planned_start", templateShift.start_time)
              .neq("status", "cancelled")
              .maybeSingle();

            if (existing) continue;
          }

          // Calculate flags
          const dayOfWeek = getDay(shiftDate);
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const [startHour] = templateShift.start_time.split(":").map(Number);
          const isNightShift = startHour >= 21 || startHour < 6;
          const isHoliday = isNorwegianHoliday(shiftDate);

          shiftsToCreate.push({
            date: dateStr,
            function_id: templateShift.function_id,
            employee_id: input.keepEmployeeAssignments ? templateShift.employee_id : null,
            planned_start: templateShift.start_time,
            planned_end: templateShift.end_time,
            planned_break_minutes: templateShift.break_minutes,
            status: "draft",
            shift_type: "normal",
            is_weekend: isWeekend,
            is_night_shift: isNightShift,
            is_holiday: isHoliday,
            created_by: userData.user?.id,
          });
        }
      }

      if (shiftsToCreate.length === 0) {
        throw new Error("Ingen vakter å opprette");
      }

      // If overwriting, delete existing shifts first
      if (input.overwriteExisting) {
        const endWeekStart = addDays(weekStart, (input.numberOfWeeks - 1) * 7);
        const endDate = addDays(endWeekStart, 6);
        
        await supabase
          .from("shifts")
          .update({ status: "cancelled" })
          .gte("date", format(weekStart, "yyyy-MM-dd"))
          .lte("date", format(endDate, "yyyy-MM-dd"))
          .eq("status", "draft");
      }

      // Insert all shifts in batch
      const { error: insertError } = await supabase
        .from("shifts")
        .insert(shiftsToCreate);

      if (insertError) throw insertError;

      return { count: shiftsToCreate.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success(`${data.count} vakter opprettet fra mal`);
    },
    onError: (error) => {
      toast.error("Kunne ikke rulle ut mal: " + error.message);
    },
  });
}

// Get week number
export function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Add single shift to template
export function useAddTemplateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      template_id: string;
      day_of_week: number;
      function_id: string;
      start_time: string;
      end_time: string;
      break_minutes?: number;
      employee_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("template_shifts")
        .insert({
          template_id: input.template_id,
          day_of_week: input.day_of_week,
          function_id: input.function_id,
          start_time: input.start_time,
          end_time: input.end_time,
          break_minutes: input.break_minutes || 30,
          employee_id: input.employee_id || null,
        })
        .select(`
          *,
          functions(id, name, color),
          profiles(id, full_name)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["shift_template", variables.template_id] 
      });
      queryClient.invalidateQueries({ queryKey: ["shift_templates"] });
      toast.success("Vakt lagt til i mal");
    },
    onError: (error) => {
      toast.error("Kunne ikke legge til vakt: " + error.message);
    },
  });
}

// Update single shift in template
export function useUpdateTemplateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      template_id: string;
      day_of_week?: number;
      function_id?: string;
      start_time?: string;
      end_time?: string;
      break_minutes?: number;
      employee_id?: string | null;
    }) => {
      const { id, template_id, ...updates } = input;
      
      const { data, error } = await supabase
        .from("template_shifts")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          functions(id, name, color),
          profiles(id, full_name)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["shift_template", variables.template_id] 
      });
      toast.success("Vakt oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere vakt: " + error.message);
    },
  });
}

// Delete single shift from template
export function useDeleteTemplateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; template_id: string }) => {
      const { error } = await supabase
        .from("template_shifts")
        .delete()
        .eq("id", input.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["shift_template", variables.template_id] 
      });
      queryClient.invalidateQueries({ queryKey: ["shift_templates"] });
      toast.success("Vakt fjernet fra mal");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette vakt: " + error.message);
    },
  });
}

// Duplicate template
export function useDuplicateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { 
      templateId: string; 
      newName: string;
      newDescription?: string;
    }) => {
      // Fetch original template with shifts
      const { data: original, error: fetchError } = await supabase
        .from("shift_templates")
        .select(`
          *,
          template_shifts(*)
        `)
        .eq("id", input.templateId)
        .single();

      if (fetchError) throw fetchError;

      // Get current user
      const { data: userData } = await supabase.auth.getUser();

      // Create new template
      const { data: newTemplate, error: createError } = await supabase
        .from("shift_templates")
        .insert({
          name: input.newName,
          description: input.newDescription || original.description,
          category: original.category,
          is_default: false, // Never duplicate as default
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Duplicate all shifts
      if (original.template_shifts?.length) {
        const newShifts = original.template_shifts.map((shift: any) => ({
          template_id: newTemplate.id,
          day_of_week: shift.day_of_week,
          function_id: shift.function_id,
          start_time: shift.start_time,
          end_time: shift.end_time,
          break_minutes: shift.break_minutes,
          employee_id: shift.employee_id,
        }));

        const { error: shiftsError } = await supabase
          .from("template_shifts")
          .insert(newShifts);

        if (shiftsError) throw shiftsError;
      }

      return newTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift_templates"] });
      toast.success("Mal duplisert");
    },
    onError: (error) => {
      toast.error("Kunne ikke duplisere mal: " + error.message);
    },
  });
}

// Preview rollout with conflict detection
export interface PreviewShift {
  date: string;
  dayOfWeek: number;
  function_id: string;
  function_name: string;
  function_color: string | null;
  start_time: string;
  end_time: string;
  break_minutes: number;
  employee_id: string | null;
  employee_name: string | null;
  status: 'new' | 'conflict' | 'existing';
  conflictReason?: string;
  isHoliday: boolean;
  isWeekend: boolean;
}

export interface RolloutPreview {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  shifts: PreviewShift[];
  shiftCount: number;
  conflictCount: number;
  totalHours: number;
  estimatedCost: number;
  hasHoliday: boolean;
}

export function useRolloutPreview(
  templateId: string | null,
  startWeekDate: Date,
  numberOfWeeks: number,
  options: {
    skipHolidays: boolean;
    overwriteExisting: boolean;
  }
) {
  return useQuery({
    queryKey: [
      "rollout_preview", 
      templateId, 
      format(startWeekDate, "yyyy-MM-dd"), 
      numberOfWeeks,
      options.skipHolidays,
      options.overwriteExisting
    ],
    queryFn: async (): Promise<RolloutPreview[]> => {
      if (!templateId) return [];

      // Fetch template with shifts
      const { data: template, error: templateError } = await supabase
        .from("shift_templates")
        .select(`
          *,
          template_shifts(
            *,
            functions(id, name, color),
            profiles(id, full_name)
          )
        `)
        .eq("id", templateId)
        .single();

      if (templateError) throw templateError;
      if (!template.template_shifts?.length) return [];

      const previews: RolloutPreview[] = [];
      const weekStart = startOfWeek(startWeekDate, { weekStartsOn: 1 });

      for (let week = 0; week < numberOfWeeks; week++) {
        const currentWeekStart = addDays(weekStart, week * 7);
        const currentWeekEnd = addDays(currentWeekStart, 6);
        const shifts: PreviewShift[] = [];
        let conflictCount = 0;

        // Fetch existing shifts for this week
        const { data: existingShifts } = await supabase
          .from("shifts")
          .select("*")
          .gte("date", format(currentWeekStart, "yyyy-MM-dd"))
          .lte("date", format(currentWeekEnd, "yyyy-MM-dd"))
          .neq("status", "cancelled");

        for (const templateShift of template.template_shifts) {
          const shiftDate = getDateFromDayOfWeek(
            currentWeekStart, 
            templateShift.day_of_week
          );
          const dateStr = format(shiftDate, "yyyy-MM-dd");
          const isHoliday = isNorwegianHoliday(shiftDate);
          const dayOfWeek = getDay(shiftDate);
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          // Skip holidays if option set
          if (options.skipHolidays && isHoliday) continue;

          // Check for conflicts
          const conflict = existingShifts?.find(
            (s) =>
              s.date === dateStr &&
              s.function_id === templateShift.function_id &&
              s.planned_start === templateShift.start_time
          );

          let status: PreviewShift['status'] = 'new';
          let conflictReason: string | undefined;

          if (conflict && !options.overwriteExisting) {
            status = 'conflict';
            conflictReason = 'Vakt eksisterer allerede';
            conflictCount++;
          } else if (conflict && options.overwriteExisting) {
            status = 'existing';
          }

          shifts.push({
            date: dateStr,
            dayOfWeek: templateShift.day_of_week,
            function_id: templateShift.function_id,
            function_name: templateShift.functions?.name || 'Ukjent',
            function_color: templateShift.functions?.color || null,
            start_time: templateShift.start_time,
            end_time: templateShift.end_time,
            break_minutes: templateShift.break_minutes,
            employee_id: templateShift.employee_id,
            employee_name: templateShift.profiles?.full_name || null,
            status,
            conflictReason,
            isHoliday,
            isWeekend,
          });
        }

        // Calculate totals
        const validShifts = shifts.filter(s => s.status !== 'conflict');
        const totalHours = validShifts.reduce((sum, s) => {
          const [startH, startM] = s.start_time.split(":").map(Number);
          const [endH, endM] = s.end_time.split(":").map(Number);
          let hours = (endH * 60 + endM - startH * 60 - startM) / 60;
          if (hours < 0) hours += 24;
          return sum + hours - s.break_minutes / 60;
        }, 0);

        const hasHoliday = shifts.some(s => s.isHoliday);
        const estimatedCost = totalHours * 220 * (hasHoliday ? 1.3 : 1);

        previews.push({
          weekNumber: getWeekNumber(currentWeekStart),
          weekStart: currentWeekStart,
          weekEnd: currentWeekEnd,
          shifts,
          shiftCount: validShifts.length,
          conflictCount,
          totalHours: Math.round(totalHours),
          estimatedCost: Math.round(estimatedCost),
          hasHoliday,
        });
      }

      return previews;
    },
    enabled: !!templateId,
    staleTime: 30000,
  });
}

// Copy week to another week
export function useCopyWeek() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CopyWeekInput) => {
      const { data: userData } = await supabase.auth.getUser();

      // Hent vakter fra kildeuken
      const sourceEnd = addDays(input.sourceWeekStart, 6);
      const { data: sourceShifts, error: fetchError } = await supabase
        .from("shifts")
        .select("*")
        .gte("date", format(input.sourceWeekStart, "yyyy-MM-dd"))
        .lte("date", format(sourceEnd, "yyyy-MM-dd"))
        .neq("status", "cancelled");

      if (fetchError) throw fetchError;
      if (!sourceShifts || sourceShifts.length === 0) {
        throw new Error("Ingen vakter å kopiere i denne uken");
      }

      // Beregn offset i dager
      const dayOffset = Math.round(
        (input.targetWeekStart.getTime() - input.sourceWeekStart.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // Slett eksisterende vakter hvis overwrite
      if (input.overwrite) {
        const targetEnd = addDays(input.targetWeekStart, 6);
        await supabase
          .from("shifts")
          .update({ status: "cancelled" })
          .gte("date", format(input.targetWeekStart, "yyyy-MM-dd"))
          .lte("date", format(targetEnd, "yyyy-MM-dd"))
          .eq("status", "draft");
      }

      // Forbered nye vakter
      const newShifts: any[] = [];
      let skippedCount = 0;

      for (const shift of sourceShifts) {
        const sourceDate = new Date(shift.date);
        const targetDate = addDays(sourceDate, dayOffset);
        const targetDateStr = format(targetDate, "yyyy-MM-dd");

        // Hopp over helligdager
        if (input.skipHolidays && isNorwegianHoliday(targetDate)) {
          skippedCount++;
          continue;
        }

        // Sjekk for eksisterende vakt hvis ikke overwrite
        if (!input.overwrite) {
          const { data: existing } = await supabase
            .from("shifts")
            .select("id")
            .eq("date", targetDateStr)
            .eq("function_id", shift.function_id)
            .eq("planned_start", shift.planned_start)
            .neq("status", "cancelled")
            .maybeSingle();

          if (existing) {
            skippedCount++;
            continue;
          }
        }

        const dayOfWeek = getDay(targetDate);

        newShifts.push({
          date: targetDateStr,
          function_id: shift.function_id,
          employee_id: input.keepEmployees ? shift.employee_id : null,
          planned_start: shift.planned_start,
          planned_end: shift.planned_end,
          planned_break_minutes: shift.planned_break_minutes,
          status: "draft",
          shift_type: shift.shift_type || "normal",
          is_weekend: dayOfWeek === 0 || dayOfWeek === 6,
          is_night_shift: shift.is_night_shift,
          is_holiday: isNorwegianHoliday(targetDate),
          notes: shift.notes,
          created_by: userData.user?.id,
        });
      }

      if (newShifts.length === 0) {
        throw new Error(
          "Ingen nye vakter å opprette (alle eksisterer allerede eller er helligdager)"
        );
      }

      // Opprett nye vakter i batch
      const { error: insertError } = await supabase
        .from("shifts")
        .insert(newShifts);

      if (insertError) throw insertError;

      return { count: newShifts.length, skipped: skippedCount };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      if (data.skipped > 0) {
        toast.success(
          `${data.count} vakter kopiert (${data.skipped} hoppet over)`
        );
      } else {
        toast.success(`${data.count} vakter kopiert`);
      }
    },
    onError: (error) => {
      toast.error("Kunne ikke kopiere: " + error.message);
    },
  });
}

// Hent alle rotasjonsgrupper
export function useRotationGroups(departmentId?: string | null) {
  return useQuery({
    queryKey: ["rotation_groups", departmentId],
    queryFn: async () => {
      let query = supabase
        .from("template_rotation_groups")
        .select(`
          *,
          departments(id, name),
          shift_templates(
            id, 
            name, 
            rotation_sequence, 
            rotation_name,
            template_shifts(count)
          )
        `)
        .eq("is_active", true)
        .order("name");

      if (departmentId) {
        query = query.or(`department_id.eq.${departmentId},department_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((group: any) => ({
        ...group,
        department: group.departments,
        templates: (group.shift_templates || [])
          .sort((a: any, b: any) => (a.rotation_sequence || 0) - (b.rotation_sequence || 0))
          .map((t: any) => ({
            ...t,
            shift_count: t.template_shifts?.[0]?.count || 0,
          })),
      })) as RotationGroup[];
    },
  });
}

// Hent enkelt rotasjonsgruppe med alle detaljer
export function useRotationGroup(groupId: string | null) {
  return useQuery({
    queryKey: ["rotation_group", groupId],
    queryFn: async () => {
      if (!groupId) return null;

      const { data, error } = await supabase
        .from("template_rotation_groups")
        .select(`
          *,
          departments(id, name),
          shift_templates(
            *,
            template_shifts(
              *,
              functions(id, name, color),
              profiles(id, full_name)
            )
          )
        `)
        .eq("id", groupId)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        department: data.departments,
        templates: (data.shift_templates || [])
          .sort((a: any, b: any) => (a.rotation_sequence || 0) - (b.rotation_sequence || 0)),
      } as RotationGroup;
    },
    enabled: !!groupId,
  });
}

// Opprett rotasjonsgruppe
export function useCreateRotationGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      rotation_length: number;
      department_id?: string | null;
    }) => {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("template_rotation_groups")
        .insert({
          name: input.name,
          description: input.description,
          rotation_length: input.rotation_length,
          department_id: input.department_id,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rotation_groups"] });
      toast.success("Rotasjonsgruppe opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette rotasjonsgruppe: " + error.message);
    },
  });
}

// Oppdater rotasjonsgruppe
export function useUpdateRotationGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      description?: string;
      is_active?: boolean;
    }) => {
      const { id, ...updates } = input;
      
      const { data, error } = await supabase
        .from("template_rotation_groups")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rotation_groups"] });
      toast.success("Rotasjonsgruppe oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere: " + error.message);
    },
  });
}

// Slett rotasjonsgruppe
export function useDeleteRotationGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      // First, unlink all templates from this group
      await supabase
        .from("shift_templates")
        .update({
          is_rotating: false,
          rotation_group_id: null,
          rotation_sequence: null,
          rotation_name: null,
        })
        .eq("rotation_group_id", groupId);

      // Then delete the group
      const { error } = await supabase
        .from("template_rotation_groups")
        .delete()
        .eq("id", groupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rotation_groups"] });
      queryClient.invalidateQueries({ queryKey: ["shift_templates"] });
      toast.success("Rotasjonsgruppe slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette: " + error.message);
    },
  });
}

// Koble mal til rotasjonsgruppe
export function useLinkTemplateToRotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      templateId: string;
      rotationGroupId: string;
      sequence: number;
      rotationName: string;
    }) => {
      const { data, error } = await supabase
        .from("shift_templates")
        .update({
          is_rotating: true,
          rotation_group_id: input.rotationGroupId,
          rotation_sequence: input.sequence,
          rotation_name: input.rotationName,
        })
        .eq("id", input.templateId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rotation_groups"] });
      queryClient.invalidateQueries({ queryKey: ["shift_templates"] });
      toast.success("Mal koblet til rotasjon");
    },
    onError: (error) => {
      toast.error("Kunne ikke koble mal: " + error.message);
    },
  });
}

// Fjern mal fra rotasjonsgruppe
export function useUnlinkTemplateFromRotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { data, error } = await supabase
        .from("shift_templates")
        .update({
          is_rotating: false,
          rotation_group_id: null,
          rotation_sequence: null,
          rotation_name: null,
        })
        .eq("id", templateId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rotation_groups"] });
      queryClient.invalidateQueries({ queryKey: ["shift_templates"] });
      toast.success("Mal fjernet fra rotasjon");
    },
    onError: (error) => {
      toast.error("Kunne ikke fjerne mal: " + error.message);
    },
  });
}

// Forhåndsvis rotasjons-rollout
export function previewRotationRollout(
  group: RotationGroup,
  startWeekDate: Date,
  numberOfCycles: number,
  startingSequence: number = 1
): RotationRolloutPreview[] {
  if (!group.templates?.length) return [];

  const previews: RotationRolloutPreview[] = [];
  const weekStart = startOfWeek(startWeekDate, { weekStartsOn: 1 });
  const totalWeeks = numberOfCycles * group.rotation_length;
  const startSeq = startingSequence - 1;

  for (let week = 0; week < totalWeeks; week++) {
    const currentWeekStart = addDays(weekStart, week * 7);
    const currentWeekEnd = addDays(currentWeekStart, 6);
    
    // Determine which template to use
    const templateIndex = (week + startSeq) % group.templates.length;
    const template = group.templates[templateIndex];

    if (!template) continue;

    // Calculate hours and cost (simplified)
    const shiftCount = template.shift_count || 0;
    const avgHoursPerShift = 7;
    const totalHours = shiftCount * avgHoursPerShift;
    const hasHoliday = isNorwegianHoliday(currentWeekStart) || 
                       isNorwegianHoliday(currentWeekEnd);
    const estimatedCost = totalHours * 220 * (hasHoliday ? 1.3 : 1);

    previews.push({
      weekNumber: getWeekNumber(currentWeekStart),
      weekStart: currentWeekStart,
      weekEnd: currentWeekEnd,
      templateId: template.id,
      templateName: template.name,
      rotationName: template.rotation_name || `Uke ${templateIndex + 1}`,
      shiftCount,
      totalHours,
      estimatedCost: Math.round(estimatedCost),
      hasHoliday,
    });
  }

  return previews;
}

// Rull ut rotasjon
export function useRolloutRotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RolloutRotationInput) => {
      const { data: userData } = await supabase.auth.getUser();

      // Fetch rotation group with templates and shifts
      const { data: group, error: groupError } = await supabase
        .from("template_rotation_groups")
        .select(`
          *,
          shift_templates(
            *,
            template_shifts(*)
          )
        `)
        .eq("id", input.rotationGroupId)
        .single();

      if (groupError) throw groupError;

      const templates = (group.shift_templates || [])
        .sort((a: any, b: any) => (a.rotation_sequence || 0) - (b.rotation_sequence || 0));

      if (templates.length === 0) {
        throw new Error("Rotasjonsgruppen har ingen maler");
      }

      const shiftsToCreate: any[] = [];
      const weekStart = startOfWeek(input.startWeekDate, { weekStartsOn: 1 });
      const totalWeeks = input.numberOfCycles * group.rotation_length;
      const startSeq = (input.startingSequence || 1) - 1;

      for (let week = 0; week < totalWeeks; week++) {
        const currentWeekStart = addDays(weekStart, week * 7);
        
        // Determine which template to use for this week
        const templateIndex = (week + startSeq) % templates.length;
        const template = templates[templateIndex];

        if (!template.template_shifts?.length) continue;

        for (const templateShift of template.template_shifts) {
          const shiftDate = getDateFromDayOfWeek(
            currentWeekStart, 
            templateShift.day_of_week
          );
          const dateStr = format(shiftDate, "yyyy-MM-dd");

          // Skip holidays if option set
          if (input.skipHolidays && isNorwegianHoliday(shiftDate)) {
            continue;
          }

          // Check for existing shifts if not overwriting
          if (!input.overwriteExisting) {
            const { data: existing } = await supabase
              .from("shifts")
              .select("id")
              .eq("date", dateStr)
              .eq("function_id", templateShift.function_id)
              .eq("planned_start", templateShift.start_time)
              .neq("status", "cancelled")
              .maybeSingle();

            if (existing) continue;
          }

          const dayOfWeek = getDay(shiftDate);
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const [startHour] = templateShift.start_time.split(":").map(Number);
          const isNightShift = startHour >= 21 || startHour < 6;
          const isHoliday = isNorwegianHoliday(shiftDate);

          shiftsToCreate.push({
            date: dateStr,
            function_id: templateShift.function_id,
            employee_id: input.keepEmployeeAssignments 
              ? templateShift.employee_id 
              : null,
            planned_start: templateShift.start_time,
            planned_end: templateShift.end_time,
            planned_break_minutes: templateShift.break_minutes,
            status: "draft",
            shift_type: "normal",
            is_weekend: isWeekend,
            is_night_shift: isNightShift,
            is_holiday: isHoliday,
            created_by: userData.user?.id,
            internal_notes: `Rotasjon: ${group.name} - ${template.rotation_name}`,
          });
        }
      }

      if (shiftsToCreate.length === 0) {
        throw new Error("Ingen vakter å opprette");
      }

      // If overwriting, cancel existing shifts first
      if (input.overwriteExisting) {
        const endDate = addDays(weekStart, totalWeeks * 7 - 1);
        
        await supabase
          .from("shifts")
          .update({ status: "cancelled" })
          .gte("date", format(weekStart, "yyyy-MM-dd"))
          .lte("date", format(endDate, "yyyy-MM-dd"))
          .eq("status", "draft");
      }

      // Insert all shifts in batches of 100
      const batchSize = 100;
      for (let i = 0; i < shiftsToCreate.length; i += batchSize) {
        const batch = shiftsToCreate.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from("shifts")
          .insert(batch);

        if (insertError) throw insertError;
      }

      return { 
        count: shiftsToCreate.length,
        weeks: totalWeeks,
        cycles: input.numberOfCycles,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success(
        `${data.count} vakter opprettet over ${data.weeks} uker (${data.cycles} rotasjoner)`
      );
    },
    onError: (error) => {
      toast.error("Kunne ikke rulle ut rotasjon: " + error.message);
    },
  });
}

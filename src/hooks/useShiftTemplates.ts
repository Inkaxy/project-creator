import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, startOfWeek, getDay } from "date-fns";
import { nb } from "date-fns/locale";

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
  created_by: string | null;
  created_at: string;
  updated_at: string;
  template_shifts?: TemplateShift[];
  shift_count?: number;
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

// Fetch all shift templates with shift count
export function useShiftTemplates() {
  return useQuery({
    queryKey: ["shift_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shift_templates")
        .select(`
          *,
          template_shifts(count)
        `)
        .order("is_default", { ascending: false })
        .order("name");

      if (error) throw error;

      return (data || []).map((template: any) => ({
        ...template,
        shift_count: template.template_shifts?.[0]?.count || 0,
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

// Norwegian public holidays (simplified - would need more comprehensive list)
function isNorwegianHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const dateStr = format(date, "MM-dd");
  
  const fixedHolidays = [
    "01-01", // Nyttårsdag
    "05-01", // 1. mai
    "05-17", // 17. mai
    "12-25", // 1. juledag
    "12-26", // 2. juledag
  ];
  
  if (fixedHolidays.includes(dateStr)) return true;
  
  // Easter-based holidays would need proper calculation
  // This is a simplified version
  return false;
}

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

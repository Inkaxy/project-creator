import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShiftData } from "./useShifts";

export interface WorkTimeRules {
  id: string;
  name: string;
  max_hours_per_day: number;
  max_hours_per_day_extended: number;
  min_rest_between_shifts: number;
  max_hours_per_week: number;
  max_hours_per_week_average: number;
  averaging_period_weeks: number;
  overtime_threshold_daily: number;
  overtime_threshold_100_daily: number;
  max_overtime_per_week: number;
  max_overtime_per_year: number;
  break_required_after_hours: number;
  min_break_minutes: number;
  break_required_after_hours_long: number;
  min_break_minutes_long: number;
  require_sunday_off: boolean;
  sunday_off_frequency_weeks: number;
  warn_at_percent_of_max: number;
  is_active: boolean;
}

export type ViolationLevel = "critical" | "warning" | "info";

export interface WorkTimeViolation {
  id: string;
  level: ViolationLevel;
  type: string;
  message: string;
  employeeId: string;
  employeeName: string;
  shiftId?: string;
  date?: string;
  details?: {
    actual: number;
    limit: number;
    unit: string;
  };
}

export function useWorkTimeRules() {
  return useQuery({
    queryKey: ["work_time_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_time_rules")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .single();

      if (error) throw error;
      return data as WorkTimeRules;
    },
  });
}

// Helper to calculate shift duration in hours
function calculateShiftHours(shift: ShiftData): number {
  const [startH, startM] = shift.planned_start.split(":").map(Number);
  const [endH, endM] = shift.planned_end.split(":").map(Number);

  let durationMinutes = endH * 60 + endM - (startH * 60 + startM);
  if (durationMinutes < 0) durationMinutes += 24 * 60; // Overnight

  const breakMinutes = shift.planned_break_minutes || 0;
  return (durationMinutes - breakMinutes) / 60;
}

// Helper to calculate rest hours between two shifts
function calculateRestHours(shift1: ShiftData, shift2: ShiftData): number {
  // shift1 ends before shift2 starts
  const date1 = new Date(shift1.date + "T" + shift1.planned_end);
  const date2 = new Date(shift2.date + "T" + shift2.planned_start);

  // Handle overnight shifts
  if (shift1.planned_end < shift1.planned_start) {
    date1.setDate(date1.getDate() + 1);
  }

  const diffMs = date2.getTime() - date1.getTime();
  return diffMs / (1000 * 60 * 60);
}

// Main validation function
export function validateWorkTime(
  shifts: ShiftData[],
  rules: WorkTimeRules
): WorkTimeViolation[] {
  const violations: WorkTimeViolation[] = [];

  // Group shifts by employee
  const shiftsByEmployee = new Map<string, ShiftData[]>();

  shifts.forEach((shift) => {
    if (!shift.employee_id || !shift.profiles) return;

    const empShifts = shiftsByEmployee.get(shift.employee_id) || [];
    empShifts.push(shift);
    shiftsByEmployee.set(shift.employee_id, empShifts);
  });

  shiftsByEmployee.forEach((empShifts, employeeId) => {
    const employeeName = empShifts[0]?.profiles?.full_name || "Ukjent";

    // Sort shifts by date and time
    const sortedShifts = [...empShifts].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.planned_start.localeCompare(b.planned_start);
    });

    // 1. Check daily hours
    const shiftsByDate = new Map<string, ShiftData[]>();
    sortedShifts.forEach((shift) => {
      const dateShifts = shiftsByDate.get(shift.date) || [];
      dateShifts.push(shift);
      shiftsByDate.set(shift.date, dateShifts);
    });

    shiftsByDate.forEach((dayShifts, date) => {
      const totalHours = dayShifts.reduce(
        (sum, s) => sum + calculateShiftHours(s),
        0
      );

      // Critical: exceeds extended limit
      if (totalHours > rules.max_hours_per_day_extended) {
        violations.push({
          id: `daily-critical-${employeeId}-${date}`,
          level: "critical",
          type: "daily_hours_exceeded",
          message: `${totalHours.toFixed(1)} timer på én dag (maks ${rules.max_hours_per_day_extended})`,
          employeeId,
          employeeName,
          date,
          details: {
            actual: totalHours,
            limit: rules.max_hours_per_day_extended,
            unit: "timer",
          },
        });
      } else if (totalHours > rules.max_hours_per_day) {
        // Warning: exceeds normal limit but within extended
        violations.push({
          id: `daily-warning-${employeeId}-${date}`,
          level: "warning",
          type: "daily_hours_warning",
          message: `${totalHours.toFixed(1)} timer på én dag (maks ${rules.max_hours_per_day}, utvidet ${rules.max_hours_per_day_extended})`,
          employeeId,
          employeeName,
          date,
          details: {
            actual: totalHours,
            limit: rules.max_hours_per_day,
            unit: "timer",
          },
        });
      }

      // Check break requirements
      dayShifts.forEach((shift) => {
        const shiftHours = calculateShiftHours(shift);
        const breakMinutes = shift.planned_break_minutes || 0;

        if (
          shiftHours >= rules.break_required_after_hours_long &&
          breakMinutes < rules.min_break_minutes_long
        ) {
          violations.push({
            id: `break-long-${shift.id}`,
            level: "warning",
            type: "insufficient_break",
            message: `Vakt på ${shiftHours.toFixed(1)}t trenger min ${rules.min_break_minutes_long} min pause (har ${breakMinutes} min)`,
            employeeId,
            employeeName,
            shiftId: shift.id,
            date: shift.date,
            details: {
              actual: breakMinutes,
              limit: rules.min_break_minutes_long,
              unit: "minutter",
            },
          });
        } else if (
          shiftHours >= rules.break_required_after_hours &&
          breakMinutes < rules.min_break_minutes
        ) {
          violations.push({
            id: `break-${shift.id}`,
            level: "warning",
            type: "insufficient_break",
            message: `Vakt på ${shiftHours.toFixed(1)}t trenger min ${rules.min_break_minutes} min pause (har ${breakMinutes} min)`,
            employeeId,
            employeeName,
            shiftId: shift.id,
            date: shift.date,
            details: {
              actual: breakMinutes,
              limit: rules.min_break_minutes,
              unit: "minutter",
            },
          });
        }
      });
    });

    // 2. Check rest between shifts
    for (let i = 0; i < sortedShifts.length - 1; i++) {
      const shift1 = sortedShifts[i];
      const shift2 = sortedShifts[i + 1];

      const restHours = calculateRestHours(shift1, shift2);

      if (restHours >= 0 && restHours < rules.min_rest_between_shifts) {
        violations.push({
          id: `rest-${shift1.id}-${shift2.id}`,
          level: "critical",
          type: "insufficient_rest",
          message: `Kun ${restHours.toFixed(1)} timer hvile mellom vakter (min ${rules.min_rest_between_shifts})`,
          employeeId,
          employeeName,
          shiftId: shift2.id,
          date: shift2.date,
          details: {
            actual: restHours,
            limit: rules.min_rest_between_shifts,
            unit: "timer",
          },
        });
      }
    }

    // 3. Check weekly hours
    const weeklyHours = sortedShifts.reduce(
      (sum, s) => sum + calculateShiftHours(s),
      0
    );
    const warnThreshold =
      (rules.max_hours_per_week_average * rules.warn_at_percent_of_max) / 100;

    if (weeklyHours > rules.max_hours_per_week_average) {
      violations.push({
        id: `weekly-critical-${employeeId}`,
        level: "critical",
        type: "weekly_hours_exceeded",
        message: `${weeklyHours.toFixed(1)} timer denne uken (maks ${rules.max_hours_per_week_average})`,
        employeeId,
        employeeName,
        details: {
          actual: weeklyHours,
          limit: rules.max_hours_per_week_average,
          unit: "timer",
        },
      });
    } else if (weeklyHours > rules.max_hours_per_week) {
      violations.push({
        id: `weekly-warning-${employeeId}`,
        level: "warning",
        type: "weekly_hours_warning",
        message: `${weeklyHours.toFixed(1)} timer denne uken (normalt maks ${rules.max_hours_per_week})`,
        employeeId,
        employeeName,
        details: {
          actual: weeklyHours,
          limit: rules.max_hours_per_week,
          unit: "timer",
        },
      });
    } else if (weeklyHours >= warnThreshold) {
      violations.push({
        id: `weekly-info-${employeeId}`,
        level: "info",
        type: "weekly_hours_approaching",
        message: `${weeklyHours.toFixed(1)} timer (nær grensen på ${rules.max_hours_per_week_average})`,
        employeeId,
        employeeName,
        details: {
          actual: weeklyHours,
          limit: rules.max_hours_per_week_average,
          unit: "timer",
        },
      });
    }

    // 4. Check Sunday work (simplified - just check if working on Sundays)
    const sundayShifts = sortedShifts.filter((s) => {
      const d = new Date(s.date);
      return d.getDay() === 0;
    });

    if (sundayShifts.length > 0 && rules.require_sunday_off) {
      violations.push({
        id: `sunday-info-${employeeId}`,
        level: "info",
        type: "sunday_work",
        message: `Jobber ${sundayShifts.length} søndag(er) denne uken`,
        employeeId,
        employeeName,
      });
    }
  });

  // Sort violations: critical first, then warning, then info
  const levelOrder: Record<ViolationLevel, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  return violations.sort(
    (a, b) => levelOrder[a.level] - levelOrder[b.level]
  );
}

// Hook to get violations for current shifts
export function useWorkTimeViolations(shifts: ShiftData[]) {
  const { data: rules } = useWorkTimeRules();

  if (!rules || !shifts.length) {
    return { violations: [], hasViolations: false, criticalCount: 0, warningCount: 0 };
  }

  const violations = validateWorkTime(shifts, rules);
  const criticalCount = violations.filter((v) => v.level === "critical").length;
  const warningCount = violations.filter((v) => v.level === "warning").length;

  return {
    violations,
    hasViolations: violations.length > 0,
    criticalCount,
    warningCount,
  };
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parseISO, isWithinInterval, max, min } from "date-fns";

export interface SickLeaveForPayroll {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string | null;
  expected_return_date: string | null;
  actual_return_date: string | null;
  leave_type: string;
  sick_leave_percentage: number;
  employer_period_completed: boolean;
  nav_takeover_date: string | null;
  status: string;
  profiles?: {
    full_name: string;
  };
}

export interface SickLeavePayrollSummary {
  employeeId: string;
  employeeName: string;
  totalSickDays: number;
  employerPeriodDays: number;
  navPeriodDays: number;
  sickLeavePercentage: number;
  sickLeaves: Array<{
    id: string;
    startDate: string;
    endDate: string;
    leaveType: string;
    daysInPeriod: number;
    percentage: number;
    isEmployerPeriod: boolean;
  }>;
}

/**
 * Calculate sick leave days within a specific payroll period
 */
function calculateSickDaysInPeriod(
  sickLeave: SickLeaveForPayroll,
  periodStart: Date,
  periodEnd: Date
): {
  totalDays: number;
  employerDays: number;
  navDays: number;
  effectiveStart: Date;
  effectiveEnd: Date;
} {
  const slStart = parseISO(sickLeave.start_date);
  const slEnd = sickLeave.actual_return_date 
    ? parseISO(sickLeave.actual_return_date)
    : sickLeave.end_date 
      ? parseISO(sickLeave.end_date)
      : sickLeave.expected_return_date
        ? parseISO(sickLeave.expected_return_date)
        : periodEnd;

  // Find overlap with payroll period
  const effectiveStart = max([slStart, periodStart]);
  const effectiveEnd = min([slEnd, periodEnd]);

  if (effectiveStart > effectiveEnd) {
    return { totalDays: 0, employerDays: 0, navDays: 0, effectiveStart, effectiveEnd };
  }

  const totalDays = differenceInDays(effectiveEnd, effectiveStart) + 1;

  // Determine if in employer period or NAV period
  let employerDays = 0;
  let navDays = 0;

  if (sickLeave.nav_takeover_date) {
    const navDate = parseISO(sickLeave.nav_takeover_date);
    if (navDate > effectiveEnd) {
      // Entire period is in employer period
      employerDays = totalDays;
    } else if (navDate <= effectiveStart) {
      // Entire period is in NAV period
      navDays = totalDays;
    } else {
      // Split between employer and NAV
      employerDays = differenceInDays(navDate, effectiveStart);
      navDays = totalDays - employerDays;
    }
  } else if (sickLeave.employer_period_completed) {
    navDays = totalDays;
  } else {
    employerDays = totalDays;
  }

  return { totalDays, employerDays, navDays, effectiveStart, effectiveEnd };
}

/**
 * Hook to fetch sick leave data for payroll period
 */
export function useSickLeavesForPayroll(periodStart: string, periodEnd: string) {
  return useQuery({
    queryKey: ["sick-leaves-payroll", periodStart, periodEnd],
    queryFn: async () => {
      // Fetch sick leaves that overlap with the period
      const { data, error } = await supabase
        .from("sick_leaves")
        .select(`
          id,
          employee_id,
          start_date,
          end_date,
          expected_return_date,
          actual_return_date,
          leave_type,
          sick_leave_percentage,
          employer_period_completed,
          nav_takeover_date,
          status
        `)
        .or(`and(start_date.lte.${periodEnd},end_date.gte.${periodStart}),and(start_date.lte.${periodEnd},end_date.is.null,status.eq.active)`)
        .in("status", ["active", "completed", "extended"]);

      if (error) throw error;

      // Fetch employee names separately
      const employeeIds = [...new Set((data || []).map(sl => sl.employee_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", employeeIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      if (error) throw error;

      const startDate = parseISO(periodStart);
      const endDate = parseISO(periodEnd);

      // Group by employee and calculate summaries
      const summaryMap = new Map<string, SickLeavePayrollSummary>();

      (data || []).forEach((sl) => {
        const slForCalc: SickLeaveForPayroll = {
          ...sl,
          profiles: { full_name: profileMap.get(sl.employee_id) || "Ukjent" }
        };
        const { totalDays, employerDays, navDays, effectiveStart, effectiveEnd } = 
          calculateSickDaysInPeriod(slForCalc, startDate, endDate);

        if (totalDays === 0) return;

        const existing = summaryMap.get(sl.employee_id);
        const slEntry = {
          id: sl.id,
          startDate: effectiveStart.toISOString(),
          endDate: effectiveEnd.toISOString(),
          leaveType: sl.leave_type,
          daysInPeriod: totalDays,
          percentage: sl.sick_leave_percentage,
          isEmployerPeriod: !sl.employer_period_completed,
        };

        if (existing) {
          existing.totalSickDays += totalDays;
          existing.employerPeriodDays += employerDays;
          existing.navPeriodDays += navDays;
          existing.sickLeaves.push(slEntry);
          // Weighted average for percentage
          if (sl.sick_leave_percentage !== 100) {
            existing.sickLeavePercentage = Math.round(
              (existing.sickLeavePercentage * (existing.sickLeaves.length - 1) + sl.sick_leave_percentage) / 
              existing.sickLeaves.length
            );
          }
        } else {
          summaryMap.set(sl.employee_id, {
            employeeId: sl.employee_id,
            employeeName: profileMap.get(sl.employee_id) || "Ukjent",
            totalSickDays: totalDays,
            employerPeriodDays: employerDays,
            navPeriodDays: navDays,
            sickLeavePercentage: sl.sick_leave_percentage,
            sickLeaves: [slEntry],
          });
        }
      });

      return Array.from(summaryMap.values());
    },
    enabled: !!periodStart && !!periodEnd,
  });
}

/**
 * Calculate sick leave hours based on contracted hours
 * Assumes 7.5 hours per work day
 */
export function calculateSickLeaveHours(
  totalSickDays: number,
  sickLeavePercentage: number = 100,
  hoursPerDay: number = 7.5
): number {
  return totalSickDays * hoursPerDay * (sickLeavePercentage / 100);
}

/**
 * Calculate sick leave pay
 * During employer period: Full salary
 * During NAV period: Employer typically doesn't pay (NAV covers)
 */
export function calculateSickLeavePay(
  employerPeriodDays: number,
  hourlyRate: number,
  sickLeavePercentage: number = 100,
  hoursPerDay: number = 7.5
): number {
  const hours = employerPeriodDays * hoursPerDay * (sickLeavePercentage / 100);
  return hours * hourlyRate;
}

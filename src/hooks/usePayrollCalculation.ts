import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WageSupplement } from "./useWageSupplements";
import { differenceInMinutes, parseISO, format, getDay, getHours, isWithinInterval, startOfDay, endOfDay } from "date-fns";

// =====================================================
// TYPES
// =====================================================

export interface PayrollLineItem {
  date: string;
  type: 'regular' | 'overtime_50' | 'overtime_100' | 'evening' | 'night' | 'saturday' | 'sunday' | 'holiday';
  hours: number;
  rate: number;
  amount: number;
  shift_id?: string;
  time_entry_id?: string;
}

export interface PayrollEntry {
  id: string;
  payroll_id: string;
  employee_id: string;
  employee_name?: string;
  regular_hours: number;
  overtime_50_hours: number;
  overtime_100_hours: number;
  evening_hours: number;
  night_hours: number;
  saturday_hours: number;
  sunday_hours: number;
  holiday_hours: number;
  hourly_rate: number;
  base_pay: number;
  overtime_pay: number;
  supplement_pay: number;
  gross_pay: number;
  sick_leave_hours: number;
  sick_leave_pay: number;
  vacation_hours: number;
  vacation_pay: number;
  line_items: PayrollLineItem[];
  notes?: string;
}

export interface PayrollCalculation {
  id: string;
  period_start: string;
  period_end: string;
  status: 'draft' | 'calculated' | 'approved' | 'exported' | 'paid';
  total_hours: number;
  total_base_pay: number;
  total_supplements: number;
  total_overtime: number;
  total_gross: number;
  exported_at?: string;
  exported_by?: string;
  export_reference?: string;
  calculated_at: string;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  entries?: PayrollEntry[];
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  holiday_type: 'public' | 'bank' | 'observance';
  supplement_percentage: number;
}

export interface CalculatedPayrollEntry {
  employeeId: string;
  employeeName: string;
  salaryType: 'hourly' | 'fixed';
  hourlyRate: number;
  fixedMonthlySalary?: number;
  contractedHoursPerMonth?: number;
  includedNightHours?: number;
  regularHours: number;
  overtime50Hours: number;
  overtime100Hours: number;
  eveningHours: number;
  nightHours: number;
  saturdayHours: number;
  sundayHours: number;
  holidayHours: number;
  basePay: number;
  overtimePay: number;
  supplementPay: number;
  grossPay: number;
  lineItems: PayrollLineItem[];
  employmentPercentage: number;
}

// =====================================================
// HOOKS FOR DATA FETCHING
// =====================================================

export function useHolidays(year?: number) {
  return useQuery({
    queryKey: ["holidays", year],
    queryFn: async () => {
      let query = supabase
        .from("holidays")
        .select("*")
        .eq("holiday_type", "public")
        .order("date");
      
      if (year) {
        query = query
          .gte("date", `${year}-01-01`)
          .lte("date", `${year}-12-31`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Holiday[];
    },
  });
}

export function usePayrollCalculations(status?: string) {
  return useQuery({
    queryKey: ["payroll-calculations", status],
    queryFn: async () => {
      let query = supabase
        .from("payroll_calculations")
        .select(`
          *,
          entries:payroll_entries(*)
        `)
        .order("period_start", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Transform entries to match our types
      return (data || []).map(calc => ({
        ...calc,
        entries: (calc.entries || []).map((e: any) => ({
          ...e,
          line_items: Array.isArray(e.line_items) ? e.line_items : [],
        })),
      })) as PayrollCalculation[];
    },
  });
}

export function usePayrollCalculation(id?: string) {
  return useQuery({
    queryKey: ["payroll-calculation", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("payroll_calculations")
        .select(`
          *,
          entries:payroll_entries(
            *,
            employee:profiles(full_name, email)
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      
      // Transform entries
      return {
        ...data,
        entries: (data.entries || []).map((e: any) => ({
          ...e,
          line_items: Array.isArray(e.line_items) ? e.line_items : [],
        })),
      } as PayrollCalculation;
    },
    enabled: !!id,
  });
}

// =====================================================
// CALCULATION UTILITIES
// =====================================================

/**
 * Beregn overlappende timer mellom en vakt og et tidsrom
 * Håndterer vakter og tidsrom som krysser midnatt
 */
export function calculateOverlapHours(
  shiftStart: Date,
  shiftEnd: Date,
  rangeStartHour: number,
  rangeEndHour: number
): number {
  // Håndter vakter som krysser midnatt
  const shiftStartHour = shiftStart.getHours() + shiftStart.getMinutes() / 60;
  const shiftEndHour = shiftEnd.getHours() + shiftEnd.getMinutes() / 60;
  
  // Hvis shiftet krysser midnatt
  const crossesMidnight = shiftEndHour < shiftStartHour || 
    (shiftStart.getDate() !== shiftEnd.getDate());
  
  // Hvis range krysser midnatt (f.eks. 21:00-06:00)
  const rangeCrossesMidnight = rangeEndHour < rangeStartHour;

  if (!crossesMidnight && !rangeCrossesMidnight) {
    // Enkel overlapp-beregning
    const overlapStart = Math.max(shiftStartHour, rangeStartHour);
    const overlapEnd = Math.min(shiftEndHour, rangeEndHour);
    return Math.max(0, overlapEnd - overlapStart);
  }

  // Håndter komplekse tilfeller
  let totalOverlap = 0;

  if (crossesMidnight) {
    // Splitt vakten i to deler
    const hoursBeforeMidnight = 24 - shiftStartHour;
    const hoursAfterMidnight = shiftEndHour;

    if (rangeCrossesMidnight) {
      // Begge krysser midnatt
      totalOverlap = Math.max(0, 24 - Math.max(shiftStartHour, rangeStartHour));
      totalOverlap += Math.max(0, Math.min(shiftEndHour, rangeEndHour));
    } else {
      // Kun vakten krysser midnatt
      if (rangeStartHour <= 24) {
        totalOverlap += Math.max(0, 24 - Math.max(shiftStartHour, rangeStartHour));
      }
      if (rangeEndHour >= 0) {
        totalOverlap += Math.max(0, Math.min(shiftEndHour, rangeEndHour));
      }
    }
  } else if (rangeCrossesMidnight) {
    // Kun range krysser midnatt
    // Sjekk overlapp med kveldsdelen (rangeStart til 24)
    if (shiftEndHour > rangeStartHour) {
      totalOverlap += Math.max(0, Math.min(shiftEndHour, 24) - Math.max(shiftStartHour, rangeStartHour));
    }
    // Sjekk overlapp med morgendelen (0 til rangeEnd)
    if (shiftStartHour < rangeEndHour) {
      totalOverlap += Math.max(0, Math.min(shiftEndHour, rangeEndHour) - shiftStartHour);
    }
  }

  return totalOverlap;
}

/**
 * Sjekk om en dato er en helligdag
 */
export function isHoliday(date: Date, holidays: Holiday[]): Holiday | undefined {
  const dateStr = format(date, "yyyy-MM-dd");
  return holidays.find(h => h.date === dateStr);
}

/**
 * Beregn overtid basert på daglige og ukentlige grenser
 */
export function calculateOvertime(
  dailyHours: number,
  weeklyHoursBefore: number,
  isSunday: boolean,
  isHolidayDay: boolean,
  hoursAfter21: number = 0
): { regular: number; overtime50: number; overtime100: number } {
  let remaining = dailyHours;
  let overtime50 = 0;
  let overtime100 = 0;

  // Regel 1: Søndager og helligdager = 100% fra første time
  if (isSunday || isHolidayDay) {
    return {
      regular: 0,
      overtime50: 0,
      overtime100: remaining,
    };
  }

  // Regel 2: Timer etter kl. 21:00 = 100%
  if (hoursAfter21 > 0) {
    overtime100 += hoursAfter21;
    remaining -= hoursAfter21;
  }

  // Regel 3: Daglig overtid (>9 timer)
  if (remaining > 9) {
    // Første 2 timer daglig overtid = 50%
    overtime50 = Math.min(remaining - 9, 2);
    remaining -= overtime50;
    
    // Resten = 100%
    if (remaining > 9) {
      overtime100 += remaining - 9;
      remaining = 9;
    }
  }

  // Regel 4: Ukentlig overtid (>40 timer)
  if (weeklyHoursBefore + remaining > 40) {
    const weeklyOvertime = (weeklyHoursBefore + remaining) - 40;
    // Timer som allerede var overtid telles ikke dobbelt
    const additionalOvertime = Math.max(0, weeklyOvertime - overtime50 - overtime100);
    
    if (additionalOvertime > 0) {
      overtime50 += additionalOvertime;
      remaining -= additionalOvertime;
    }
  }

  return {
    regular: Math.max(0, remaining),
    overtime50,
    overtime100,
  };
}

/**
 * Hovedfunksjon for å beregne lønn for en enkelt vakt/timeføring
 */
export function calculateShiftPay(
  clockIn: Date,
  clockOut: Date,
  breakMinutes: number,
  hourlyRate: number,
  supplements: WageSupplement[],
  holidays: Holiday[],
  weeklyHoursBefore: number = 0
): {
  regularHours: number;
  overtime50Hours: number;
  overtime100Hours: number;
  eveningHours: number;
  nightHours: number;
  weekendHours: number;
  holidayHours: number;
  basePay: number;
  overtimePay: number;
  supplementPay: number;
  totalPay: number;
  lineItems: PayrollLineItem[];
} {
  const totalMinutes = differenceInMinutes(clockOut, clockIn) - breakMinutes;
  const totalHours = totalMinutes / 60;
  const dateStr = format(clockIn, "yyyy-MM-dd");
  const dayOfWeek = getDay(clockIn); // 0 = Sunday, 6 = Saturday
  const isSunday = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;
  const holidayInfo = isHoliday(clockIn, holidays);
  const isHolidayDay = !!holidayInfo;

  const lineItems: PayrollLineItem[] = [];

  // Beregn tilleggstimer
  let eveningHours = 0;
  let nightHours = 0;
  let weekendHours = 0;
  let holidayHours = 0;
  let supplementPay = 0;

  // Finn aktive tillegg
  const eveningSupplement = supplements.find(s => s.applies_to === 'evening' && s.is_active);
  const nightSupplement = supplements.find(s => s.applies_to === 'night' && s.is_active);
  const weekendSupplement = supplements.find(s => s.applies_to === 'weekend' && s.is_active);
  const holidaySupplement = supplements.find(s => s.applies_to === 'holiday' && s.is_active);

  // Kveldstillegg (17:00-21:00)
  if (eveningSupplement) {
    eveningHours = calculateOverlapHours(clockIn, clockOut, 17, 21);
    if (eveningHours > 0) {
      const amount = eveningSupplement.supplement_type === 'fixed' 
        ? eveningHours * eveningSupplement.amount
        : eveningHours * hourlyRate * (eveningSupplement.amount / 100);
      supplementPay += amount;
      lineItems.push({
        date: dateStr,
        type: 'evening',
        hours: eveningHours,
        rate: eveningSupplement.amount,
        amount,
      });
    }
  }

  // Nattillegg (21:00-06:00)
  if (nightSupplement) {
    nightHours = calculateOverlapHours(clockIn, clockOut, 21, 6);
    if (nightHours > 0) {
      const amount = nightSupplement.supplement_type === 'fixed'
        ? nightHours * nightSupplement.amount
        : nightHours * hourlyRate * (nightSupplement.amount / 100);
      supplementPay += amount;
      lineItems.push({
        date: dateStr,
        type: 'night',
        hours: nightHours,
        rate: nightSupplement.amount,
        amount,
      });
    }
  }

  // Helgetillegg
  if (weekendSupplement && (isSaturday || isSunday)) {
    weekendHours = totalHours;
    const amount = weekendSupplement.supplement_type === 'fixed'
      ? weekendHours * weekendSupplement.amount
      : weekendHours * hourlyRate * (weekendSupplement.amount / 100);
    supplementPay += amount;
    lineItems.push({
      date: dateStr,
      type: isSunday ? 'sunday' : 'saturday',
      hours: weekendHours,
      rate: weekendSupplement.amount,
      amount,
    });
  }

  // Helligdagstillegg
  if (holidaySupplement && isHolidayDay) {
    holidayHours = totalHours;
    const amount = holidaySupplement.supplement_type === 'fixed'
      ? holidayHours * holidaySupplement.amount
      : holidayHours * hourlyRate * (holidaySupplement.amount / 100);
    supplementPay += amount;
    lineItems.push({
      date: dateStr,
      type: 'holiday',
      hours: holidayHours,
      rate: holidaySupplement.amount,
      amount,
    });
  }

  // Beregn timer etter kl. 21:00 for 100% overtid
  const hoursAfter21 = calculateOverlapHours(clockIn, clockOut, 21, 24);

  // Beregn overtid
  const overtime = calculateOvertime(
    totalHours,
    weeklyHoursBefore,
    isSunday,
    isHolidayDay,
    hoursAfter21
  );

  // Beregn lønn
  const basePay = overtime.regular * hourlyRate;
  const overtimePay = (overtime.overtime50 * hourlyRate * 1.5) + (overtime.overtime100 * hourlyRate * 2);

  // Legg til grunnlønn-linjer
  if (overtime.regular > 0) {
    lineItems.push({
      date: dateStr,
      type: 'regular',
      hours: overtime.regular,
      rate: hourlyRate,
      amount: basePay,
    });
  }

  if (overtime.overtime50 > 0) {
    lineItems.push({
      date: dateStr,
      type: 'overtime_50',
      hours: overtime.overtime50,
      rate: hourlyRate * 1.5,
      amount: overtime.overtime50 * hourlyRate * 1.5,
    });
  }

  if (overtime.overtime100 > 0) {
    lineItems.push({
      date: dateStr,
      type: 'overtime_100',
      hours: overtime.overtime100,
      rate: hourlyRate * 2,
      amount: overtime.overtime100 * hourlyRate * 2,
    });
  }

  return {
    regularHours: overtime.regular,
    overtime50Hours: overtime.overtime50,
    overtime100Hours: overtime.overtime100,
    eveningHours,
    nightHours,
    weekendHours,
    holidayHours,
    basePay,
    overtimePay,
    supplementPay,
    totalPay: basePay + overtimePay + supplementPay,
    lineItems,
  };
}

/**
 * Beregn fastlønn med innbakte tillegg
 */
export function calculateFixedSalary(
  fixedMonthlySalary: number,
  contractedHoursPerMonth: number,
  includedNightHours: number = 0,
  actualNightHours: number,
  nightSupplementRate: number = 65,
  actualHoursWorked: number,
  overtimeHours: { overtime50: number; overtime100: number },
  supplements: { evening: number; saturday: number; sunday: number; holiday: number },
  supplementRates: WageSupplement[]
): {
  basePay: number;
  extraNightPay: number;
  overtimePay: number;
  supplementPay: number;
  totalPay: number;
  effectiveHourlyRate: number;
} {
  // Beregn effektiv timelønn
  const includedNightValue = includedNightHours * nightSupplementRate;
  const restForRegular = fixedMonthlySalary - includedNightValue;
  const effectiveHourlyRate = restForRegular / contractedHoursPerMonth;

  // Grunnlønn er fastlønnen
  const basePay = fixedMonthlySalary;

  // Ekstra nattillegg utover innbakte timer
  const extraNightHours = Math.max(0, actualNightHours - includedNightHours);
  const extraNightPay = extraNightHours * nightSupplementRate;

  // Overtid beregnes på effektiv timelønn
  const overtimePay = 
    (overtimeHours.overtime50 * effectiveHourlyRate * 1.5) +
    (overtimeHours.overtime100 * effectiveHourlyRate * 2);

  // Andre tillegg
  let supplementPay = 0;
  const eveningSupplement = supplementRates.find(s => s.applies_to === 'evening');
  const weekendSupplement = supplementRates.find(s => s.applies_to === 'weekend');
  const holidaySupplement = supplementRates.find(s => s.applies_to === 'holiday');

  if (eveningSupplement && supplements.evening > 0) {
    supplementPay += supplements.evening * eveningSupplement.amount;
  }
  if (weekendSupplement && (supplements.saturday > 0 || supplements.sunday > 0)) {
    supplementPay += (supplements.saturday + supplements.sunday) * weekendSupplement.amount;
  }
  if (holidaySupplement && supplements.holiday > 0) {
    supplementPay += supplements.holiday * (effectiveHourlyRate * (holidaySupplement.amount / 100));
  }

  return {
    basePay,
    extraNightPay,
    overtimePay,
    supplementPay,
    totalPay: basePay + extraNightPay + overtimePay + supplementPay,
    effectiveHourlyRate,
  };
}

// =====================================================
// MUTATIONS
// =====================================================

export function useCreatePayrollCalculation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      periodStart: string;
      periodEnd: string;
      entries: CalculatedPayrollEntry[];
    }) => {
      // Beregn totaler
      const totals = input.entries.reduce((acc, e) => ({
        hours: acc.hours + e.regularHours + e.overtime50Hours + e.overtime100Hours,
        basePay: acc.basePay + e.basePay,
        supplements: acc.supplements + e.supplementPay,
        overtime: acc.overtime + e.overtimePay,
        gross: acc.gross + e.grossPay,
      }), { hours: 0, basePay: 0, supplements: 0, overtime: 0, gross: 0 });

      // Opprett payroll_calculation
      const { data: payroll, error: payrollError } = await supabase
        .from("payroll_calculations")
        .insert({
          period_start: input.periodStart,
          period_end: input.periodEnd,
          status: 'calculated',
          total_hours: totals.hours,
          total_base_pay: totals.basePay,
          total_supplements: totals.supplements,
          total_overtime: totals.overtime,
          total_gross: totals.gross,
        })
        .select()
        .single();

      if (payrollError) throw payrollError;

      // Opprett payroll_entries
      const entries = input.entries.map(e => ({
        payroll_id: payroll.id,
        employee_id: e.employeeId,
        regular_hours: e.regularHours,
        overtime_50_hours: e.overtime50Hours,
        overtime_100_hours: e.overtime100Hours,
        evening_hours: e.eveningHours,
        night_hours: e.nightHours,
        saturday_hours: e.saturdayHours,
        sunday_hours: e.sundayHours,
        holiday_hours: e.holidayHours,
        hourly_rate: e.hourlyRate,
        base_pay: e.basePay,
        overtime_pay: e.overtimePay,
        supplement_pay: e.supplementPay,
        gross_pay: e.grossPay,
        line_items: JSON.stringify(e.lineItems),
      }));

      const { error: entriesError } = await supabase
        .from("payroll_entries")
        .insert(entries as any);

      if (entriesError) throw entriesError;

      return payroll;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-calculations"] });
      toast.success("Lønnsberegning opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette lønnsberegning: " + error.message);
    },
  });
}

export function useUpdatePayrollStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PayrollCalculation['status'] }) => {
      const updates: Record<string, any> = { status };
      
      if (status === 'approved') {
        const { data: { user } } = await supabase.auth.getUser();
        updates.approved_at = new Date().toISOString();
        updates.approved_by = user?.id;
      } else if (status === 'exported') {
        const { data: { user } } = await supabase.auth.getUser();
        updates.exported_at = new Date().toISOString();
        updates.exported_by = user?.id;
      }

      const { data, error } = await supabase
        .from("payroll_calculations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-calculations"] });
      toast.success("Status oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere status: " + error.message);
    },
  });
}

export function useDeletePayrollCalculation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payroll_calculations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-calculations"] });
      toast.success("Lønnsberegning slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette: " + error.message);
    },
  });
}

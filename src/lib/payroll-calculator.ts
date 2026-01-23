import { differenceInMinutes, format, getDay, startOfWeek, endOfWeek, isWithinInterval, parseISO, addDays } from "date-fns";
import { WageSupplement } from "@/hooks/useWageSupplements";
import { Holiday, calculateOverlapHours, isHoliday } from "@/hooks/usePayrollCalculation";

// =====================================================
// TYPES
// =====================================================

export interface TimeEntryForPayroll {
  id: string;
  employee_id: string;
  date: string;
  clock_in: string;
  clock_out: string;
  break_minutes: number;
  status: string;
}

export interface EmployeeDetailsForPayroll {
  id: string;
  full_name: string;
  salary_type: 'hourly' | 'fixed';
  hourly_rate: number;
  fixed_monthly_salary?: number;
  contracted_hours_per_month?: number;
  contracted_hours_per_week?: number;
  included_night_hours?: number;
  employment_percentage: number;
  competence_level?: 'ufaglaert' | 'faglaert' | 'laerling';
}

export interface PayrollResult {
  employeeId: string;
  employeeName: string;
  salaryType: 'hourly' | 'fixed';
  hourlyRate: number;
  employmentPercentage: number;
  
  // Timer
  regularHours: number;
  overtime50Hours: number;
  overtime100Hours: number;
  eveningHours: number;
  nightHours: number;
  saturdayHours: number;
  sundayHours: number;
  holidayHours: number;
  totalHours: number;
  
  // Lønn
  basePay: number;
  overtimePay: number;
  supplementPay: number;
  grossPay: number;
  
  // Detaljer
  lineItems: {
    date: string;
    type: string;
    hours: number;
    rate: number;
    amount: number;
    description?: string;
  }[];
  
  // Fastlønn-spesifikke
  fixedMonthlySalary?: number;
  contractedHoursPerMonth?: number;
  includedNightHours?: number;
  extraNightHours?: number;
}

// =====================================================
// HOVEDBEREGNING
// =====================================================

/**
 * Beregn lønn for alle ansatte i en periode
 */
export function calculatePayrollForPeriod(
  timeEntries: TimeEntryForPayroll[],
  employees: EmployeeDetailsForPayroll[],
  supplements: WageSupplement[],
  holidays: Holiday[],
  periodStart: Date,
  periodEnd: Date
): PayrollResult[] {
  const results: PayrollResult[] = [];

  // Grupper timeføringer per ansatt
  const entriesByEmployee = new Map<string, TimeEntryForPayroll[]>();
  timeEntries.forEach(entry => {
    if (entry.status !== 'approved') return;
    
    const existing = entriesByEmployee.get(entry.employee_id) || [];
    existing.push(entry);
    entriesByEmployee.set(entry.employee_id, existing);
  });

  // Beregn for hver ansatt
  employees.forEach(employee => {
    const employeeEntries = entriesByEmployee.get(employee.id) || [];
    
    if (employee.salary_type === 'hourly') {
      const result = calculateHourlyPayroll(employee, employeeEntries, supplements, holidays);
      results.push(result);
    } else {
      const result = calculateFixedPayroll(employee, employeeEntries, supplements, holidays);
      results.push(result);
    }
  });

  return results.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
}

/**
 * Beregn timelønn for en ansatt
 */
function calculateHourlyPayroll(
  employee: EmployeeDetailsForPayroll,
  entries: TimeEntryForPayroll[],
  supplements: WageSupplement[],
  holidays: Holiday[]
): PayrollResult {
  const lineItems: PayrollResult['lineItems'] = [];
  
  let regularHours = 0;
  let overtime50Hours = 0;
  let overtime100Hours = 0;
  let eveningHours = 0;
  let nightHours = 0;
  let saturdayHours = 0;
  let sundayHours = 0;
  let holidayHours = 0;

  // Sorter entries etter dato for ukentlig overtidsberegning
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.clock_in).getTime() - new Date(b.clock_in).getTime()
  );

  // Spor ukentlige timer for overtidsberegning
  const weeklyHours = new Map<string, number>();

  sortedEntries.forEach(entry => {
    const clockIn = new Date(entry.clock_in);
    const clockOut = new Date(entry.clock_out);
    const dateStr = format(clockIn, "yyyy-MM-dd");
    const weekKey = format(startOfWeek(clockIn, { weekStartsOn: 1 }), "yyyy-'W'ww");
    
    const totalMinutes = differenceInMinutes(clockOut, clockIn) - (entry.break_minutes || 0);
    const totalHours = totalMinutes / 60;
    
    const dayOfWeek = getDay(clockIn);
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;
    const holidayInfo = holidays.find(h => h.date === dateStr);
    const isHolidayDay = !!holidayInfo;

    // Få ukentlige timer før denne dagen
    const weekHoursBefore = weeklyHours.get(weekKey) || 0;
    
    // Finn tillegg
    const eveningSupplement = supplements.find(s => s.applies_to === 'evening' && s.is_active);
    const nightSupplement = supplements.find(s => s.applies_to === 'night' && s.is_active);
    const weekendSupplement = supplements.find(s => s.applies_to === 'weekend' && s.is_active);
    const holidaySupplement = supplements.find(s => s.applies_to === 'holiday' && s.is_active);

    // Beregn tilleggstimer
    const entryEveningHours = calculateOverlapHours(clockIn, clockOut, 17, 21);
    const entryNightHours = calculateOverlapHours(clockIn, clockOut, 21, 6);
    
    if (entryEveningHours > 0) {
      eveningHours += entryEveningHours;
      if (eveningSupplement) {
        lineItems.push({
          date: dateStr,
          type: 'evening',
          hours: entryEveningHours,
          rate: eveningSupplement.amount,
          amount: entryEveningHours * eveningSupplement.amount,
          description: 'Kveldstillegg (17:00-21:00)',
        });
      }
    }

    if (entryNightHours > 0) {
      nightHours += entryNightHours;
      if (nightSupplement) {
        lineItems.push({
          date: dateStr,
          type: 'night',
          hours: entryNightHours,
          rate: nightSupplement.amount,
          amount: entryNightHours * nightSupplement.amount,
          description: 'Nattillegg (21:00-06:00)',
        });
      }
    }

    if ((isSaturday || isSunday) && weekendSupplement) {
      if (isSaturday) saturdayHours += totalHours;
      if (isSunday) sundayHours += totalHours;
      
      lineItems.push({
        date: dateStr,
        type: isSunday ? 'sunday' : 'saturday',
        hours: totalHours,
        rate: weekendSupplement.amount,
        amount: totalHours * weekendSupplement.amount,
        description: isSunday ? 'Søndagstillegg' : 'Lørdagstillegg',
      });
    }

    if (isHolidayDay && holidaySupplement) {
      holidayHours += totalHours;
      const amount = holidaySupplement.supplement_type === 'percentage'
        ? totalHours * employee.hourly_rate * (holidaySupplement.amount / 100)
        : totalHours * holidaySupplement.amount;
      
      lineItems.push({
        date: dateStr,
        type: 'holiday',
        hours: totalHours,
        rate: holidaySupplement.supplement_type === 'percentage' 
          ? employee.hourly_rate * (holidaySupplement.amount / 100)
          : holidaySupplement.amount,
        amount,
        description: `Helligdagstillegg (${holidayInfo?.name})`,
      });
    }

    // Beregn overtid
    const hoursAfter21 = calculateOverlapHours(clockIn, clockOut, 21, 24);
    
    // Daglig og ukentlig overtid
    let entryRegular = totalHours;
    let entryOT50 = 0;
    let entryOT100 = 0;

    // Søndager og helligdager = 100% overtid
    if (isSunday || isHolidayDay) {
      entryOT100 = totalHours;
      entryRegular = 0;
    } else {
      // Timer etter kl. 21:00 = 100%
      if (hoursAfter21 > 0) {
        entryOT100 += hoursAfter21;
        entryRegular -= hoursAfter21;
      }

      // Daglig overtid (>9 timer)
      if (entryRegular > 9) {
        entryOT50 = Math.min(entryRegular - 9, 2);
        entryRegular -= entryOT50;
        
        if (entryRegular > 9) {
          const extraOT100 = entryRegular - 9;
          entryOT100 += extraOT100;
          entryRegular = 9;
        }
      }

      // Ukentlig overtid (>40 timer)
      if (weekHoursBefore + entryRegular > 40) {
        const weeklyOT = (weekHoursBefore + entryRegular) - 40;
        const additionalOT = Math.max(0, weeklyOT);
        entryOT50 += additionalOT;
        entryRegular -= additionalOT;
      }
    }

    regularHours += entryRegular;
    overtime50Hours += entryOT50;
    overtime100Hours += entryOT100;

    // Legg til grunnlønn-linjer
    if (entryRegular > 0) {
      lineItems.push({
        date: dateStr,
        type: 'regular',
        hours: entryRegular,
        rate: employee.hourly_rate,
        amount: entryRegular * employee.hourly_rate,
        description: 'Ordinære timer',
      });
    }

    if (entryOT50 > 0) {
      lineItems.push({
        date: dateStr,
        type: 'overtime_50',
        hours: entryOT50,
        rate: employee.hourly_rate * 1.5,
        amount: entryOT50 * employee.hourly_rate * 1.5,
        description: 'Overtid 50%',
      });
    }

    if (entryOT100 > 0) {
      lineItems.push({
        date: dateStr,
        type: 'overtime_100',
        hours: entryOT100,
        rate: employee.hourly_rate * 2,
        amount: entryOT100 * employee.hourly_rate * 2,
        description: 'Overtid 100%',
      });
    }

    // Oppdater ukentlige timer
    weeklyHours.set(weekKey, weekHoursBefore + totalHours);
  });

  // Beregn totaler
  const basePay = regularHours * employee.hourly_rate;
  const overtimePay = (overtime50Hours * employee.hourly_rate * 1.5) + (overtime100Hours * employee.hourly_rate * 2);
  const supplementPay = lineItems
    .filter(item => ['evening', 'night', 'saturday', 'sunday', 'holiday'].includes(item.type))
    .reduce((sum, item) => sum + item.amount, 0);
  const grossPay = basePay + overtimePay + supplementPay;

  return {
    employeeId: employee.id,
    employeeName: employee.full_name,
    salaryType: 'hourly',
    hourlyRate: employee.hourly_rate,
    employmentPercentage: employee.employment_percentage,
    regularHours,
    overtime50Hours,
    overtime100Hours,
    eveningHours,
    nightHours,
    saturdayHours,
    sundayHours,
    holidayHours,
    totalHours: regularHours + overtime50Hours + overtime100Hours,
    basePay,
    overtimePay,
    supplementPay,
    grossPay,
    lineItems,
  };
}

/**
 * Beregn fastlønn for en ansatt
 */
function calculateFixedPayroll(
  employee: EmployeeDetailsForPayroll,
  entries: TimeEntryForPayroll[],
  supplements: WageSupplement[],
  holidays: Holiday[]
): PayrollResult {
  const lineItems: PayrollResult['lineItems'] = [];
  
  const fixedSalary = employee.fixed_monthly_salary || 0;
  const contractedHours = employee.contracted_hours_per_month || 162.5;
  const includedNight = employee.included_night_hours || 0;
  
  // Beregn effektiv timelønn
  const nightSupplement = supplements.find(s => s.applies_to === 'night' && s.is_active);
  const nightRate = nightSupplement?.amount || 65;
  const includedNightValue = includedNight * nightRate;
  const effectiveHourlyRate = (fixedSalary - includedNightValue) / contractedHours;

  // Teller for tilleggstimer
  let eveningHours = 0;
  let nightHours = 0;
  let saturdayHours = 0;
  let sundayHours = 0;
  let holidayHours = 0;
  let totalHours = 0;
  let overtime50Hours = 0;
  let overtime100Hours = 0;

  // Beregn faktiske timer og tillegg
  entries.forEach(entry => {
    const clockIn = new Date(entry.clock_in);
    const clockOut = new Date(entry.clock_out);
    const dateStr = format(clockIn, "yyyy-MM-dd");
    
    const totalMinutes = differenceInMinutes(clockOut, clockIn) - (entry.break_minutes || 0);
    const entryHours = totalMinutes / 60;
    totalHours += entryHours;

    const dayOfWeek = getDay(clockIn);
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;
    const holidayInfo = holidays.find(h => h.date === dateStr);

    // Beregn tilleggstimer
    const entryNightHours = calculateOverlapHours(clockIn, clockOut, 21, 6);
    const entryEveningHours = calculateOverlapHours(clockIn, clockOut, 17, 21);

    nightHours += entryNightHours;
    eveningHours += entryEveningHours;

    if (isSaturday) saturdayHours += entryHours;
    if (isSunday) sundayHours += entryHours;
    if (holidayInfo) holidayHours += entryHours;
  });

  // Grunnlønn = fastlønn
  const basePay = fixedSalary;
  lineItems.push({
    date: format(new Date(), "yyyy-MM-dd"),
    type: 'fixed_salary',
    hours: contractedHours,
    rate: effectiveHourlyRate,
    amount: fixedSalary,
    description: 'Fastlønn',
  });

  // Ekstra nattillegg utover innbakte timer
  const extraNightHours = Math.max(0, nightHours - includedNight);
  let supplementPay = 0;

  if (extraNightHours > 0 && nightSupplement) {
    const amount = extraNightHours * nightRate;
    supplementPay += amount;
    lineItems.push({
      date: format(new Date(), "yyyy-MM-dd"),
      type: 'extra_night',
      hours: extraNightHours,
      rate: nightRate,
      amount,
      description: `Ekstra nattillegg (utover ${includedNight}t innbakt)`,
    });
  }

  // Legg til andre tillegg
  const eveningSupplement = supplements.find(s => s.applies_to === 'evening' && s.is_active);
  const weekendSupplement = supplements.find(s => s.applies_to === 'weekend' && s.is_active);
  const holidaySupplement = supplements.find(s => s.applies_to === 'holiday' && s.is_active);

  if (eveningHours > 0 && eveningSupplement) {
    const amount = eveningHours * eveningSupplement.amount;
    supplementPay += amount;
    lineItems.push({
      date: format(new Date(), "yyyy-MM-dd"),
      type: 'evening',
      hours: eveningHours,
      rate: eveningSupplement.amount,
      amount,
      description: 'Kveldstillegg',
    });
  }

  if ((saturdayHours > 0 || sundayHours > 0) && weekendSupplement) {
    const weekendTotal = saturdayHours + sundayHours;
    const amount = weekendTotal * weekendSupplement.amount;
    supplementPay += amount;
    lineItems.push({
      date: format(new Date(), "yyyy-MM-dd"),
      type: 'weekend',
      hours: weekendTotal,
      rate: weekendSupplement.amount,
      amount,
      description: 'Helgetillegg',
    });
  }

  if (holidayHours > 0 && holidaySupplement) {
    const amount = holidaySupplement.supplement_type === 'percentage'
      ? holidayHours * effectiveHourlyRate * (holidaySupplement.amount / 100)
      : holidayHours * holidaySupplement.amount;
    supplementPay += amount;
    lineItems.push({
      date: format(new Date(), "yyyy-MM-dd"),
      type: 'holiday',
      hours: holidayHours,
      rate: holidaySupplement.supplement_type === 'percentage'
        ? effectiveHourlyRate * (holidaySupplement.amount / 100)
        : holidaySupplement.amount,
      amount,
      description: 'Helligdagstillegg',
    });
  }

  // Overtid for fastlønn (timer utover avtalt)
  const overtimeHours = Math.max(0, totalHours - contractedHours);
  const overtimePay = overtimeHours * effectiveHourlyRate * 1.5;
  overtime50Hours = overtimeHours;

  if (overtimeHours > 0) {
    lineItems.push({
      date: format(new Date(), "yyyy-MM-dd"),
      type: 'overtime_50',
      hours: overtimeHours,
      rate: effectiveHourlyRate * 1.5,
      amount: overtimePay,
      description: 'Overtid (utover avtalt)',
    });
  }

  const grossPay = basePay + overtimePay + supplementPay;

  return {
    employeeId: employee.id,
    employeeName: employee.full_name,
    salaryType: 'fixed',
    hourlyRate: effectiveHourlyRate,
    employmentPercentage: employee.employment_percentage,
    regularHours: contractedHours,
    overtime50Hours,
    overtime100Hours: 0,
    eveningHours,
    nightHours,
    saturdayHours,
    sundayHours,
    holidayHours,
    totalHours,
    basePay,
    overtimePay,
    supplementPay,
    grossPay,
    lineItems,
    fixedMonthlySalary: fixedSalary,
    contractedHoursPerMonth: contractedHours,
    includedNightHours: includedNight,
    extraNightHours: Math.max(0, nightHours - includedNight),
  };
}

/**
 * Eksporter til CSV for lønnssystem
 */
export function exportPayrollToCSV(results: PayrollResult[]): string {
  const headers = [
    'Ansatt',
    'Lønnstype',
    'Timer totalt',
    'Ordinære timer',
    'Overtid 50%',
    'Overtid 100%',
    'Kveld-timer',
    'Natt-timer',
    'Lørdag-timer',
    'Søndag-timer',
    'Helligdag-timer',
    'Grunnlønn',
    'Overtidstillegg',
    'Andre tillegg',
    'Brutto lønn',
  ];

  const rows = results.map(r => [
    r.employeeName,
    r.salaryType === 'fixed' ? 'Fastlønn' : 'Timelønn',
    r.totalHours.toFixed(2),
    r.regularHours.toFixed(2),
    r.overtime50Hours.toFixed(2),
    r.overtime100Hours.toFixed(2),
    r.eveningHours.toFixed(2),
    r.nightHours.toFixed(2),
    r.saturdayHours.toFixed(2),
    r.sundayHours.toFixed(2),
    r.holidayHours.toFixed(2),
    r.basePay.toFixed(2),
    r.overtimePay.toFixed(2),
    r.supplementPay.toFixed(2),
    r.grossPay.toFixed(2),
  ]);

  return [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
}

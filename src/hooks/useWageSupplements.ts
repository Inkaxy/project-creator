import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WageSupplement {
  id: string;
  name: string;
  description: string | null;
  supplement_type: "percentage" | "fixed";
  amount: number;
  applies_to: "night" | "weekend" | "holiday" | "evening";
  time_start: string | null;
  time_end: string | null;
  is_active: boolean | null;
  priority: number | null;
}

export interface ShiftCostBreakdown {
  baseHours: number;
  baseCost: number;
  nightHours: number;
  nightSupplement: number;
  eveningHours: number;
  eveningSupplement: number;
  weekendSupplement: number;
  holidaySupplement: number;
  totalCost: number;
}

export function useWageSupplements() {
  return useQuery({
    queryKey: ["wage_supplements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wage_supplements")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: true });

      if (error) throw error;
      return data as WageSupplement[];
    },
  });
}

// Helper to parse time string to minutes since midnight
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Calculate overlap between two time ranges (handles overnight)
function calculateOverlapHours(
  shiftStart: string,
  shiftEnd: string,
  rangeStart: string,
  rangeEnd: string
): number {
  const ss = timeToMinutes(shiftStart);
  let se = timeToMinutes(shiftEnd);
  const rs = timeToMinutes(rangeStart);
  const re = timeToMinutes(rangeEnd);

  // Handle overnight shift
  if (se < ss) se += 24 * 60;

  // Handle overnight range (e.g., 21:00 - 06:00)
  if (re < rs) {
    // Split into two ranges: rs-midnight and midnight-re
    const overlap1 = calculateSimpleOverlap(ss, se, rs, 24 * 60);
    const overlap2 = calculateSimpleOverlap(ss, se, 0, re);
    // Also check if shift wraps
    const overlap3 = se > 24 * 60 ? calculateSimpleOverlap(0, se - 24 * 60, rs, 24 * 60) : 0;
    return (overlap1 + overlap2 + overlap3) / 60;
  }

  return calculateSimpleOverlap(ss, se, rs, re) / 60;
}

function calculateSimpleOverlap(s1: number, e1: number, s2: number, e2: number): number {
  const start = Math.max(s1, s2);
  const end = Math.min(e1, e2);
  return Math.max(0, end - start);
}

const BASE_HOURLY_RATE = 250; // Default base rate

export function calculateShiftCost(
  shift: {
    planned_start: string;
    planned_end: string;
    planned_break_minutes: number | null;
    date: string;
    is_night_shift?: boolean | null;
    is_weekend?: boolean | null;
    is_holiday?: boolean | null;
  },
  supplements: WageSupplement[]
): ShiftCostBreakdown {
  const [startH, startM] = shift.planned_start.split(":").map(Number);
  const [endH, endM] = shift.planned_end.split(":").map(Number);
  
  let durationMinutes = endH * 60 + endM - (startH * 60 + startM);
  if (durationMinutes < 0) durationMinutes += 24 * 60; // Overnight
  
  const breakMinutes = shift.planned_break_minutes || 0;
  const baseHours = (durationMinutes - breakMinutes) / 60;
  const baseCost = baseHours * BASE_HOURLY_RATE;

  // Find applicable supplements
  const nightSupplement = supplements.find(s => s.applies_to === "night");
  const eveningSupplement = supplements.find(s => s.applies_to === "evening");
  const weekendSupplements = supplements.filter(s => s.applies_to === "weekend");
  const holidaySupplement = supplements.find(s => s.applies_to === "holiday");

  // Calculate night hours
  let nightHours = 0;
  let nightCost = 0;
  if (nightSupplement && nightSupplement.time_start && nightSupplement.time_end) {
    nightHours = calculateOverlapHours(
      shift.planned_start,
      shift.planned_end,
      nightSupplement.time_start,
      nightSupplement.time_end
    );
    nightCost = nightHours * Number(nightSupplement.amount);
  }

  // Calculate evening hours
  let eveningHours = 0;
  let eveningCost = 0;
  if (eveningSupplement && eveningSupplement.time_start && eveningSupplement.time_end) {
    eveningHours = calculateOverlapHours(
      shift.planned_start,
      shift.planned_end,
      eveningSupplement.time_start,
      eveningSupplement.time_end
    );
    eveningCost = eveningHours * Number(eveningSupplement.amount);
  }

  // Calculate weekend supplement
  let weekendCost = 0;
  if (shift.is_weekend) {
    const shiftDate = new Date(shift.date);
    const dayOfWeek = shiftDate.getDay();
    
    // Saturday = 6, Sunday = 0
    const applicableSupplement = weekendSupplements.find(s => {
      if (dayOfWeek === 6 && s.name.toLowerCase().includes("lørdag")) return true;
      if (dayOfWeek === 0 && s.name.toLowerCase().includes("søndag")) return true;
      return false;
    }) || weekendSupplements[0];

    if (applicableSupplement) {
      weekendCost = baseHours * Number(applicableSupplement.amount);
    }
  }

  // Calculate holiday supplement
  let holidayCost = 0;
  if (shift.is_holiday && holidaySupplement) {
    if (holidaySupplement.supplement_type === "percentage") {
      holidayCost = baseCost * (Number(holidaySupplement.amount) / 100);
    } else {
      holidayCost = baseHours * Number(holidaySupplement.amount);
    }
  }

  return {
    baseHours,
    baseCost,
    nightHours,
    nightSupplement: nightCost,
    eveningHours,
    eveningSupplement: eveningCost,
    weekendSupplement: weekendCost,
    holidaySupplement: holidayCost,
    totalCost: baseCost + nightCost + eveningCost + weekendCost + holidayCost,
  };
}

export function calculateDayCost(
  shifts: Array<{
    planned_start: string;
    planned_end: string;
    planned_break_minutes: number | null;
    date: string;
    is_night_shift?: boolean | null;
    is_weekend?: boolean | null;
    is_holiday?: boolean | null;
  }>,
  supplements: WageSupplement[]
): {
  totalHours: number;
  totalBaseCost: number;
  totalSupplements: number;
  totalCost: number;
  breakdown: {
    night: number;
    evening: number;
    weekend: number;
    holiday: number;
  };
} {
  let totalHours = 0;
  let totalBaseCost = 0;
  let nightTotal = 0;
  let eveningTotal = 0;
  let weekendTotal = 0;
  let holidayTotal = 0;

  shifts.forEach(shift => {
    const cost = calculateShiftCost(shift, supplements);
    totalHours += cost.baseHours;
    totalBaseCost += cost.baseCost;
    nightTotal += cost.nightSupplement;
    eveningTotal += cost.eveningSupplement;
    weekendTotal += cost.weekendSupplement;
    holidayTotal += cost.holidaySupplement;
  });

  const totalSupplements = nightTotal + eveningTotal + weekendTotal + holidayTotal;

  return {
    totalHours,
    totalBaseCost,
    totalSupplements,
    totalCost: totalBaseCost + totalSupplements,
    breakdown: {
      night: nightTotal,
      evening: eveningTotal,
      weekend: weekendTotal,
      holiday: holidayTotal,
    },
  };
}

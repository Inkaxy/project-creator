import { useMemo } from "react";
import { useShifts } from "./useShifts";
import { useApprovedAbsences, ApprovedAbsence } from "./useApprovedAbsences";
import { useFireDrills, FireDrill } from "./useFireSafety";
import { useSafetyRounds, SafetyRound } from "./useSafetyRounds";
import { useInspectionVisits, InspectionVisit } from "./useInspections";
import { useEmployeeBirthdays, EmployeeBirthday, getBirthdaysForDate, calculateAge } from "./useEmployeeBirthdays";
import { format, parseISO, eachDayOfInterval, isWithinInterval, getMonth, getDate } from "date-fns";

export type CalendarEventType = 
  | 'shift' 
  | 'absence' 
  | 'fire_drill' 
  | 'safety_round' 
  | 'inspection'
  | 'birthday';

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  subtitle?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  color: string;
  bgColor: string;
  status?: string;
  raw: unknown;
}

export const EVENT_TYPE_CONFIG: Record<CalendarEventType, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: string;
}> = {
  shift: { 
    label: 'Vakter', 
    color: 'hsl(var(--primary))', 
    bgColor: 'hsl(var(--primary) / 0.15)',
    icon: 'Clock'
  },
  absence: { 
    label: 'Fravær', 
    color: 'hsl(var(--destructive))', 
    bgColor: 'hsl(var(--destructive) / 0.15)',
    icon: 'UserX'
  },
  fire_drill: { 
    label: 'Brannøvelser', 
    color: 'hsl(25 95% 53%)', 
    bgColor: 'hsl(25 95% 53% / 0.15)',
    icon: 'Flame'
  },
  safety_round: { 
    label: 'Vernerunder', 
    color: 'hsl(142 76% 36%)', 
    bgColor: 'hsl(142 76% 36% / 0.15)',
    icon: 'Shield'
  },
  inspection: { 
    label: 'Tilsyn', 
    color: 'hsl(262 83% 58%)', 
    bgColor: 'hsl(262 83% 58% / 0.15)',
    icon: 'ClipboardCheck'
  },
  birthday: { 
    label: 'Bursdager', 
    color: 'hsl(330 80% 60%)', 
    bgColor: 'hsl(330 80% 60% / 0.15)',
    icon: 'Cake'
  },
};

interface UseCalendarEventsOptions {
  startDate: string;
  endDate: string;
  filters?: CalendarEventType[];
}

export function useCalendarEvents({ startDate, endDate, filters }: UseCalendarEventsOptions) {
  // Fetch all data sources
  const { data: shifts = [], isLoading: shiftsLoading } = useShifts(startDate, endDate);
  const { data: absences = [], isLoading: absencesLoading } = useApprovedAbsences(startDate, endDate);
  const { data: fireDrills = [], isLoading: drillsLoading } = useFireDrills();
  const { data: safetyRounds = [], isLoading: roundsLoading } = useSafetyRounds();
  const { data: inspections = [], isLoading: inspectionsLoading } = useInspectionVisits();
  const { data: birthdays = [], isLoading: birthdaysLoading } = useEmployeeBirthdays();

  const isLoading = shiftsLoading || absencesLoading || drillsLoading || roundsLoading || inspectionsLoading || birthdaysLoading;

  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];
    const activeFilters = filters || Object.keys(EVENT_TYPE_CONFIG) as CalendarEventType[];

    // Process shifts
    if (activeFilters.includes('shift')) {
      shifts.forEach((shift) => {
        const isNight = shift.planned_start >= "20:00" || shift.planned_start < "06:00";
        allEvents.push({
          id: `shift-${shift.id}`,
          type: 'shift',
          title: shift.profiles?.full_name || 'Ledig vakt',
          subtitle: shift.functions?.name,
          date: shift.date,
          startTime: shift.planned_start,
          endTime: shift.planned_end,
          color: isNight ? 'hsl(var(--night))' : EVENT_TYPE_CONFIG.shift.color,
          bgColor: isNight ? 'hsl(var(--night) / 0.15)' : EVENT_TYPE_CONFIG.shift.bgColor,
          status: shift.status,
          raw: shift,
        });
      });
    }

    // Process absences - expand to individual days
    if (activeFilters.includes('absence')) {
      absences.forEach((absence: ApprovedAbsence) => {
        try {
          const start = parseISO(absence.start_date);
          const end = parseISO(absence.end_date);
          const days = eachDayOfInterval({ start, end });
          
          days.forEach((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            // Only include if within our range
            if (dateStr >= startDate && dateStr <= endDate) {
              allEvents.push({
                id: `absence-${absence.id}-${dateStr}`,
                type: 'absence',
                title: absence.profiles?.full_name || 'Ukjent',
                subtitle: absence.absence_types?.name,
                date: dateStr,
                color: absence.absence_types?.color 
                  ? `hsl(${absence.absence_types.color})` 
                  : EVENT_TYPE_CONFIG.absence.color,
                bgColor: absence.absence_types?.color 
                  ? `hsl(${absence.absence_types.color} / 0.15)` 
                  : EVENT_TYPE_CONFIG.absence.bgColor,
                raw: absence,
              });
            }
          });
        } catch (e) {
          // Skip invalid dates
        }
      });
    }

    // Process fire drills
    if (activeFilters.includes('fire_drill')) {
      fireDrills.forEach((drill: FireDrill) => {
        const drillDate = drill.scheduled_date;
        if (drillDate >= startDate && drillDate <= endDate) {
          allEvents.push({
            id: `fire_drill-${drill.id}`,
            type: 'fire_drill',
            title: drill.title,
            subtitle: drill.completed_at ? 'Fullført' : 'Planlagt',
            date: drillDate,
            color: EVENT_TYPE_CONFIG.fire_drill.color,
            bgColor: EVENT_TYPE_CONFIG.fire_drill.bgColor,
            status: drill.completed_at ? 'completed' : 'planned',
            raw: drill,
          });
        }
      });
    }

    // Process safety rounds
    if (activeFilters.includes('safety_round')) {
      safetyRounds.forEach((round: SafetyRound) => {
        const roundDate = round.scheduled_date;
        if (roundDate >= startDate && roundDate <= endDate) {
          allEvents.push({
            id: `safety_round-${round.id}`,
            type: 'safety_round',
            title: round.title,
            subtitle: round.status === 'completed' ? 'Fullført' : 'Planlagt',
            date: roundDate,
            color: EVENT_TYPE_CONFIG.safety_round.color,
            bgColor: EVENT_TYPE_CONFIG.safety_round.bgColor,
            status: round.status,
            raw: round,
          });
        }
      });
    }

    // Process inspections
    if (activeFilters.includes('inspection')) {
      inspections.forEach((visit: InspectionVisit) => {
        const visitDate = visit.visit_date;
        if (visitDate >= startDate && visitDate <= endDate) {
          const typeLabels: Record<string, string> = {
            mattilsynet: 'Mattilsynet',
            arbeidstilsynet: 'Arbeidstilsynet',
            branntilsyn: 'Branntilsyn',
            skjenkekontroll: 'Skjenkekontroll',
          };
          allEvents.push({
            id: `inspection-${visit.id}`,
            type: 'inspection',
            title: typeLabels[visit.inspection_type] || visit.inspection_type,
            subtitle: visit.result || 'Planlagt',
            date: visitDate,
            color: EVENT_TYPE_CONFIG.inspection.color,
            bgColor: EVENT_TYPE_CONFIG.inspection.bgColor,
            status: visit.result || 'planned',
            raw: visit,
          });
        }
      });
    }

    // Process birthdays
    if (activeFilters.includes('birthday')) {
      // Get all dates in the range
      try {
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        const datesInRange = eachDayOfInterval({ start, end });
        
        datesInRange.forEach((date) => {
          const dayBirthdays = getBirthdaysForDate(birthdays, date);
          dayBirthdays.forEach((employee) => {
            const age = calculateAge(employee.date_of_birth, date);
            const dateStr = format(date, 'yyyy-MM-dd');
            allEvents.push({
              id: `birthday-${employee.id}-${dateStr}`,
              type: 'birthday',
              title: employee.full_name,
              subtitle: `Fyller ${age} år`,
              date: dateStr,
              color: EVENT_TYPE_CONFIG.birthday.color,
              bgColor: EVENT_TYPE_CONFIG.birthday.bgColor,
              raw: employee,
            });
          });
        });
      } catch {
        // Skip if date parsing fails
      }
    }

    return allEvents;
  }, [shifts, absences, fireDrills, safetyRounds, inspections, birthdays, startDate, endDate, filters]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    events.forEach((event) => {
      if (!grouped[event.date]) {
        grouped[event.date] = [];
      }
      grouped[event.date].push(event);
    });
    return grouped;
  }, [events]);

  // Count birthdays in range
  const birthdayCount = useMemo(() => {
    if (!birthdays.length) return 0;
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const datesInRange = eachDayOfInterval({ start, end });
      let count = 0;
      datesInRange.forEach((date) => {
        count += getBirthdaysForDate(birthdays, date).length;
      });
      return count;
    } catch {
      return 0;
    }
  }, [birthdays, startDate, endDate]);

  return {
    events,
    eventsByDate,
    isLoading,
    counts: {
      shifts: shifts.length,
      absences: absences.length,
      fireDrills: fireDrills.filter(d => {
        const date = d.scheduled_date;
        return date >= startDate && date <= endDate;
      }).length,
      safetyRounds: safetyRounds.filter(r => {
        const date = r.scheduled_date;
        return date >= startDate && date <= endDate;
      }).length,
      inspections: inspections.filter(i => {
        const date = i.visit_date;
        return date >= startDate && date <= endDate;
      }).length,
      birthdays: birthdayCount,
    },
  };
}

export function getEventsForDate(eventsByDate: Record<string, CalendarEvent[]>, date: string): CalendarEvent[] {
  return eventsByDate[date] || [];
}

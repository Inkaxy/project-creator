import { useState, useMemo } from "react";
import { format, getDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday as isDateToday } from "date-fns";
import { nb } from "date-fns/locale";
import { ShiftData } from "@/hooks/useShifts";
import { DroppableScheduleCell } from "./DroppableScheduleCell";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getAbsencesForDate } from "@/hooks/useApprovedAbsences";
import { calculateDayCost } from "@/hooks/useWageSupplements";
import { Clock, DollarSign, Users, ChevronDown, ChevronUp, Palmtree, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthCalendarGridProps {
  currentDate: Date;
  shifts: ShiftData[];
  isAdminOrManager: boolean;
  onCellClick: (date: Date, functionId: string) => void;
  onShiftClick: (shift: ShiftData) => void;
  onShiftDrop: (shiftId: string, newDate: string, newFunctionId: string, isCopy: boolean) => void;
  onMultiShiftDrop?: (shiftIds: string[], targetDate: string, isCopy: boolean) => void;
  approvedAbsences?: any[];
  supplements?: any[];
  selectedShifts?: Set<string>;
  onSelectedShiftsChange?: (selected: Set<string>) => void;
  functions?: { id: string; name: string; color: string | null }[];
}

const dayNames = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];
const MAX_VISIBLE_SHIFTS = 5;

function formatDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function MonthCalendarGrid({
  currentDate,
  shifts,
  isAdminOrManager,
  onCellClick,
  onShiftClick,
  onShiftDrop,
  onMultiShiftDrop,
  approvedAbsences = [],
  supplements = [],
  selectedShifts: externalSelectedShifts,
  onSelectedShiftsChange,
  functions = [],
}: MonthCalendarGridProps) {
  const [internalSelectedShifts, setInternalSelectedShifts] = useState<Set<string>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  
  const selectedShifts = externalSelectedShifts ?? internalSelectedShifts;
  const setSelectedShifts = onSelectedShiftsChange ?? setInternalSelectedShifts;

  // Build calendar grid (6 weeks max)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate]);

  // Group shifts by date for quick lookup
  const shiftsByDate = useMemo(() => {
    const map: Record<string, ShiftData[]> = {};
    shifts.forEach(shift => {
      if (!map[shift.date]) map[shift.date] = [];
      map[shift.date].push(shift);
    });
    // Sort shifts by start time
    Object.values(map).forEach(dayShifts => {
      dayShifts.sort((a, b) => a.planned_start.localeCompare(b.planned_start));
    });
    return map;
  }, [shifts]);

  const getFunctionColor = (functionId: string | null) => {
    const func = functions.find(f => f.id === functionId);
    return func?.color || "#3B82F6";
  };

  const toggleDayExpanded = (dateStr: string) => {
    const next = new Set(expandedDays);
    if (next.has(dateStr)) {
      next.delete(dateStr);
    } else {
      next.add(dateStr);
    }
    setExpandedDays(next);
  };

  const handleShiftSelect = (shiftId: string, selected: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedShifts);
    if (selected) {
      next.add(shiftId);
    } else {
      next.delete(shiftId);
    }
    setSelectedShifts(next);
  };

  const handleCellDrop = (shiftId: string, newDate: string, newFunctionId: string, isCopy: boolean) => {
    if (selectedShifts.size > 1 && selectedShifts.has(shiftId) && onMultiShiftDrop) {
      onMultiShiftDrop(Array.from(selectedShifts), newDate, isCopy);
    } else {
      onShiftDrop(shiftId, newDate, newFunctionId, isCopy);
    }
  };

  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <div className="overflow-x-auto">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/50">
        {dayNames.map((name, i) => (
          <div key={i} className="border-r border-border last:border-r-0 p-2 text-center">
            <span className="text-sm font-medium text-muted-foreground">{name}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {weeks.map((week, weekIdx) => (
        <div key={weekIdx} className="grid grid-cols-7 border-b border-border last:border-b-0">
          {week.map((day, dayIdx) => {
            const dateStr = formatDateStr(day);
            const dayShifts = shiftsByDate[dateStr] || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isExpanded = expandedDays.has(dateStr);
            const dayAbsences = getAbsencesForDate(approvedAbsences, dateStr);
            const costs = calculateDayCost(dayShifts, supplements);
            
            const visibleShifts = isExpanded ? dayShifts : dayShifts.slice(0, MAX_VISIBLE_SHIFTS);
            const hiddenCount = dayShifts.length - MAX_VISIBLE_SHIFTS;

            return (
              <div
                key={dayIdx}
                className={cn(
                  "border-r border-border last:border-r-0 min-h-[140px] flex flex-col",
                  !isCurrentMonth && "bg-muted/30"
                )}
              >
                {/* Day Header */}
                <div 
                  className={cn(
                    "flex items-center justify-between p-1.5 border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors",
                    isDateToday(day) && "bg-primary/10"
                  )}
                  onClick={() => onCellClick(day, functions[0]?.id || "")}
                >
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "text-sm font-bold",
                      isDateToday(day) ? "text-primary" : isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {day.getDate()}
                    </span>
                    {dayAbsences.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-amber-500/10 text-amber-600 border-amber-500/20">
                            <Palmtree className="h-2.5 w-2.5 mr-0.5" />
                            {dayAbsences.length}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium mb-1">Fravær:</p>
                          {dayAbsences.map((a: any) => (
                            <p key={a.id} className="text-xs">{a.profiles?.full_name}</p>
                          ))}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="font-medium">{costs.totalHours.toFixed(0)}t</span>
                    <span>/</span>
                    <span className="text-success font-medium">{costs.totalCost.toLocaleString("nb-NO")} kr</span>
                  </div>
                </div>

                {/* Shifts List */}
                <div className="flex-1 p-0.5 space-y-0.5 overflow-hidden">
                  {visibleShifts.map((shift) => (
                    <ShiftItem
                      key={shift.id}
                      shift={shift}
                      functionColor={getFunctionColor(shift.function_id)}
                      isSelected={selectedShifts.has(shift.id)}
                      onSelect={handleShiftSelect}
                      onClick={(e) => {
                        e.stopPropagation();
                        onShiftClick(shift);
                      }}
                    />
                  ))}
                  
                  {/* More indicator */}
                  {hiddenCount > 0 && !isExpanded && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDayExpanded(dateStr);
                      }}
                      className="w-full text-[10px] text-muted-foreground hover:text-foreground flex items-center justify-center gap-0.5 py-0.5 hover:bg-muted/50 rounded transition-colors"
                    >
                      <ChevronDown className="h-3 w-3" />
                      +{hiddenCount} mer
                    </button>
                  )}
                  
                  {isExpanded && dayShifts.length > MAX_VISIBLE_SHIFTS && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDayExpanded(dateStr);
                      }}
                      className="w-full text-[10px] text-muted-foreground hover:text-foreground flex items-center justify-center gap-0.5 py-0.5 hover:bg-muted/50 rounded transition-colors"
                    >
                      <ChevronUp className="h-3 w-3" />
                      Skjul
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Summary Row */}
      <div className="grid grid-cols-7 bg-muted/50 border-t border-border">
        {weeks[0]?.map((_, dayIdx) => {
          // Calculate totals for each weekday across all weeks
          let totalHours = 0;
          let totalCost = 0;
          let totalShifts = 0;
          
          weeks.forEach(week => {
            const day = week[dayIdx];
            if (day && isSameMonth(day, currentDate)) {
              const dateStr = formatDateStr(day);
              const dayShifts = shiftsByDate[dateStr] || [];
              const costs = calculateDayCost(dayShifts, supplements);
              totalHours += costs.totalHours;
              totalCost += costs.totalCost;
              totalShifts += dayShifts.length;
            }
          });

          return (
            <div key={dayIdx} className="border-r border-border last:border-r-0 p-2 text-center">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">{totalShifts}</span> vakter
              </div>
              <div className="text-xs font-medium text-foreground">
                {totalHours.toFixed(0)}t / {totalCost.toLocaleString("nb-NO")} kr
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact shift item for month view
function ShiftItem({
  shift,
  functionColor,
  isSelected,
  onSelect,
  onClick,
}: {
  shift: ShiftData;
  functionColor: string;
  isSelected: boolean;
  onSelect: (shiftId: string, selected: boolean, e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent) => void;
}) {
  const hasClocked = shift.actual_start || shift.actual_end;
  const isLate = shift.actual_start && shift.planned_start && shift.actual_start > shift.planned_start;
  const isOpen = !shift.employee_id;
  
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-1 px-1 py-0.5 rounded text-[10px] cursor-pointer transition-all",
        "hover:shadow-sm",
        isSelected && "ring-2 ring-primary ring-offset-1"
      )}
      style={{
        backgroundColor: `${functionColor}15`,
        borderLeft: `2px solid ${functionColor}`,
      }}
    >
      {/* Checkbox on hover */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => onSelect(shift.id, e.target.checked, e as any)}
        onClick={(e) => e.stopPropagation()}
        className="absolute left-0.5 top-1/2 -translate-y-1/2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      />
      
      <div className={cn("flex-1 min-w-0 flex items-center gap-1", "group-hover:pl-3")}>
        {/* Time */}
        <span className={cn(
          "font-medium shrink-0",
          isLate ? "text-destructive" : hasClocked ? "text-success" : "text-foreground"
        )}>
          {shift.planned_start.slice(0, 5)}
        </span>
        
        {/* Employee name or "Ledig" */}
        <span className={cn(
          "truncate",
          isOpen ? "text-destructive italic" : "text-muted-foreground"
        )}>
          {isOpen ? "Ledig" : shift.profiles?.full_name ? getInitials(shift.profiles.full_name) + " " + shift.profiles.full_name.split(" ").slice(1).join(" ") : "Ukjent"}
        </span>
      </div>
      
      {/* Status indicators */}
      {isLate && (
        <Tooltip>
          <TooltipTrigger>
            <AlertTriangle className="h-2.5 w-2.5 text-destructive shrink-0" />
          </TooltipTrigger>
          <TooltipContent>Kom for sent</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

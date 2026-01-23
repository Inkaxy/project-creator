import { useState, useMemo } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { ShiftData } from "@/hooks/useShifts";
import { ImprovedShiftCard } from "./ImprovedShiftCard";
import { DroppableScheduleCell } from "./DroppableScheduleCell";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getWeatherForDate, weatherIcons, weatherColors, weatherLabels } from "@/lib/weather-utils";
import { getAbsencesForDate } from "@/hooks/useApprovedAbsences";
import { CostSummaryTooltip } from "./CostSummaryTooltip";
import { calculateDayCost } from "@/hooks/useWageSupplements";
import { Clock, DollarSign, Moon, Palmtree, Users, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FunctionData {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  department_id: string | null;
  departments?: { name: string } | null;
}

interface FunctionBasedScheduleGridProps {
  functions: FunctionData[];
  shifts: ShiftData[];
  weekDays: Date[];
  isAdminOrManager: boolean;
  onCellClick: (date: Date, functionId: string) => void;
  onShiftClick: (shift: ShiftData) => void;
  onShiftDrop: (shiftId: string, newDate: string, newFunctionId: string, isCopy: boolean) => void;
  approvedAbsences?: any[];
  supplements?: any[];
  showWeather?: boolean;
}

const dayNames = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function FunctionBasedScheduleGrid({
  functions,
  shifts,
  weekDays,
  isAdminOrManager,
  onCellClick,
  onShiftClick,
  onShiftDrop,
  approvedAbsences = [],
  supplements = [],
  showWeather = true,
}: FunctionBasedScheduleGridProps) {
  const [selectedShifts, setSelectedShifts] = useState<Set<string>>(new Set());

  const getShiftsForDayAndFunction = (date: Date, functionId: string) => {
    return shifts.filter(
      (shift) => shift.date === formatDate(date) && shift.function_id === functionId
    );
  };

  const handleShiftSelect = (shiftId: string, selected: boolean) => {
    setSelectedShifts(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(shiftId);
      } else {
        next.delete(shiftId);
      }
      return next;
    });
  };

  const calculateDayStats = (date: Date) => {
    const dayShifts = shifts.filter((s) => s.date === formatDate(date));
    const costs = calculateDayCost(dayShifts, supplements);
    return { 
      hours: costs.totalHours.toFixed(1), 
      costs,
      shifts: dayShifts.length 
    };
  };

  // Group functions by department for visual separation
  const groupedFunctions = useMemo(() => {
    const grouped: Record<string, FunctionData[]> = {};
    const noDept: FunctionData[] = [];

    functions.forEach(func => {
      if (func.department_id && func.departments?.name) {
        const deptName = func.departments.name;
        if (!grouped[deptName]) grouped[deptName] = [];
        grouped[deptName].push(func);
      } else {
        noDept.push(func);
      }
    });

    return { grouped, noDept };
  }, [functions]);

  if (functions.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Ingen funksjoner opprettet ennå. Klikk "Funksjoner" for å legge til.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Header Row */}
      <div className="grid min-w-[900px] grid-cols-[220px_repeat(7,1fr)] border-b border-border sticky top-0 bg-background z-10">
        <div className="border-r border-border bg-muted/50 p-3">
          <span className="text-sm font-medium text-muted-foreground">Funksjon</span>
        </div>
        {weekDays.map((day, i) => {
          const isToday = formatDate(day) === "2026-01-19";
          const dayAbsences = getAbsencesForDate(approvedAbsences, formatDate(day));
          const weather = showWeather ? getWeatherForDate(day) : null;
          const WeatherIcon = weather ? weatherIcons[weather.condition] : null;
          const stats = calculateDayStats(day);
          
          return (
            <div 
              key={i} 
              className={cn(
                "border-r border-border p-2 last:border-r-0 text-center",
                isToday && "bg-primary/5"
              )}
            >
              <div className="flex items-center justify-center gap-1">
                <span className="text-xs text-muted-foreground">{dayNames[i]}.</span>
                {/* Weather */}
                {weather && WeatherIcon && (
                  <Tooltip>
                    <TooltipTrigger>
                      <WeatherIcon className={cn("h-3 w-3", weatherColors[weather.condition])} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{weatherLabels[weather.condition]} {weather.temp}°</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className={cn(
                "text-lg font-bold",
                isToday ? "text-primary" : "text-foreground"
              )}>
                {day.getDate()}. {format(day, "MMM", { locale: nb }).slice(0, 3)}.
              </p>
              
              {/* Day summary */}
              <div className="flex items-center justify-center gap-2 mt-1 text-xs text-muted-foreground">
                {dayAbsences.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-0.5">
                        <Palmtree className="h-3 w-3 text-success" />
                        <span className="text-success">{dayAbsences.length}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium mb-1">Fravær:</p>
                      {dayAbsences.map((a: any) => (
                        <p key={a.id} className="text-xs">{a.profiles?.full_name}</p>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                )}
                <span>{stats.shifts} Vakter</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Function Rows */}
      {Object.entries(groupedFunctions.grouped).map(([deptName, deptFunctions]) => (
        <div key={deptName}>
          {/* Department header */}
          <div className="grid min-w-[900px] grid-cols-[220px_repeat(7,1fr)] bg-muted/30 border-b border-border">
            <div className="col-span-8 p-2 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">{deptName}</span>
            </div>
          </div>
          
          {deptFunctions.map((func) => (
            <FunctionRow
              key={func.id}
              func={func}
              weekDays={weekDays}
              shifts={shifts}
              isAdminOrManager={isAdminOrManager}
              onCellClick={onCellClick}
              onShiftClick={onShiftClick}
              onShiftDrop={onShiftDrop}
              selectedShifts={selectedShifts}
              onShiftSelect={handleShiftSelect}
              getShiftsForDayAndFunction={getShiftsForDayAndFunction}
            />
          ))}
        </div>
      ))}

      {/* Functions without department */}
      {groupedFunctions.noDept.length > 0 && (
        <>
          <div className="grid min-w-[900px] grid-cols-[220px_repeat(7,1fr)] bg-muted/30 border-b border-border">
            <div className="col-span-8 p-2 flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">Ingen Kategori</span>
            </div>
          </div>
          {groupedFunctions.noDept.map((func) => (
            <FunctionRow
              key={func.id}
              func={func}
              weekDays={weekDays}
              shifts={shifts}
              isAdminOrManager={isAdminOrManager}
              onCellClick={onCellClick}
              onShiftClick={onShiftClick}
              onShiftDrop={onShiftDrop}
              selectedShifts={selectedShifts}
              onShiftSelect={handleShiftSelect}
              getShiftsForDayAndFunction={getShiftsForDayAndFunction}
            />
          ))}
        </>
      )}

      {/* Summary Row */}
      <div className="grid min-w-[900px] grid-cols-[220px_repeat(7,1fr)] bg-muted/50 border-t border-border">
        <div className="border-r border-border p-3 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Ingen funksjon</span>
        </div>
        {weekDays.map((day, i) => {
          const stats = calculateDayStats(day);
          const isToday = formatDate(day) === "2026-01-19";
          return (
            <CostSummaryTooltip key={i} costs={stats.costs}>
              <div className={cn(
                "border-r border-border p-2 text-xs last:border-r-0 cursor-pointer hover:bg-muted transition-colors",
                isToday && "bg-primary/10"
              )}>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{stats.hours}t</span>
                </div>
                <div className="flex items-center gap-1 font-medium">
                  <DollarSign className="h-3 w-3" />
                  <span>{stats.costs.totalCost.toLocaleString("nb-NO")} kr</span>
                </div>
                {stats.costs.totalSupplements > 0 && (
                  <div className="flex items-center gap-1 text-destructive">
                    <Moon className="h-3 w-3" />
                    <span>+{stats.costs.totalSupplements.toLocaleString("nb-NO")}</span>
                  </div>
                )}
              </div>
            </CostSummaryTooltip>
          );
        })}
      </div>
    </div>
  );
}

// Individual function row component
function FunctionRow({
  func,
  weekDays,
  shifts,
  isAdminOrManager,
  onCellClick,
  onShiftClick,
  onShiftDrop,
  selectedShifts,
  onShiftSelect,
  getShiftsForDayAndFunction,
}: {
  func: FunctionData;
  weekDays: Date[];
  shifts: ShiftData[];
  isAdminOrManager: boolean;
  onCellClick: (date: Date, functionId: string) => void;
  onShiftClick: (shift: ShiftData) => void;
  onShiftDrop: (shiftId: string, newDate: string, newFunctionId: string, isCopy: boolean) => void;
  selectedShifts: Set<string>;
  onShiftSelect: (shiftId: string, selected: boolean) => void;
  getShiftsForDayAndFunction: (date: Date, functionId: string) => ShiftData[];
}) {
  return (
    <div className="grid min-w-[900px] grid-cols-[220px_repeat(7,1fr)] border-b border-border last:border-b-0 hover:bg-muted/10 transition-colors">
      {/* Function label */}
      <div 
        className="flex items-center gap-2 border-r border-border p-2"
        style={{ 
          borderLeft: `4px solid ${func.color || "#3B82F6"}`,
          backgroundColor: `${func.color || "#3B82F6"}10`
        }}
      >
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-foreground truncate">
            {func.name}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {func.departments?.name || "Bakeri"}
          </span>
        </div>
      </div>

      {/* Day cells */}
      {weekDays.map((day, i) => {
        const dayShifts = getShiftsForDayAndFunction(day, func.id);
        const isToday = formatDate(day) === "2026-01-19";

        return (
          <DroppableScheduleCell
            key={i}
            date={day}
            functionId={func.id}
            isToday={isToday}
            isAdminOrManager={isAdminOrManager}
            onClick={() => onCellClick(day, func.id)}
            onDrop={onShiftDrop}
            className="min-h-[100px] p-1"
          >
            <div className="space-y-1">
              {dayShifts.map((shift) => (
                <ImprovedShiftCard
                  key={shift.id}
                  shift={shift}
                  onShiftClick={onShiftClick}
                  isAdminOrManager={isAdminOrManager}
                  isSelected={selectedShifts.has(shift.id)}
                  onSelect={onShiftSelect}
                  compact
                />
              ))}
            </div>
          </DroppableScheduleCell>
        );
      })}
    </div>
  );
}

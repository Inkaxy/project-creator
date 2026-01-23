import { useMemo } from "react";
import { ShiftData } from "@/hooks/useShifts";
import { EmployeeProfile } from "@/hooks/useEmployees";
import { useActiveSickLeavesForPeriod, SickLeaveType } from "@/hooks/useSickLeave";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DraggableShiftCard } from "./DraggableShiftCard";
import { DroppableScheduleCell } from "./DroppableScheduleCell";
import { Plus, Thermometer, HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmployeeBasedScheduleGridProps {
  employees: EmployeeProfile[];
  shifts: ShiftData[];
  weekDays: Date[];
  isAdminOrManager: boolean;
  onCellClick: (date: Date, employeeId: string) => void;
  onShiftClick: (shift: ShiftData) => void;
  onShiftDrop: (shiftId: string, newDate: string, newFunctionId: string, isCopy: boolean) => void;
}

const dayNames = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getEmployeeTypeLabel(type: string | null): string {
  switch (type) {
    case "fast":
      return "Fast";
    case "deltid":
      return "Deltid";
    case "tilkalling":
      return "Tilkalling";
    case "vikar":
      return "Vikar";
    case "laerling":
      return "Lærling";
    case "sesong":
      return "Sesong";
    default:
      return "Ansatt";
  }
}

function calculateShiftHours(shift: ShiftData): number {
  const [startHour, startMin] = shift.planned_start.split(":").map(Number);
  const [endHour, endMin] = shift.planned_end.split(":").map(Number);
  
  let start = startHour * 60 + startMin;
  let end = endHour * 60 + endMin;
  
  // Handle overnight shifts
  if (end < start) {
    end += 24 * 60;
  }
  
  const totalMinutes = end - start - (shift.planned_break_minutes || 0);
  return totalMinutes / 60;
}

export function EmployeeBasedScheduleGrid({
  employees,
  shifts,
  weekDays,
  isAdminOrManager,
  onCellClick,
  onShiftClick,
  onShiftDrop,
}: EmployeeBasedScheduleGridProps) {
  // Fetch sick leaves for the week
  const startDate = weekDays[0] ? formatDate(weekDays[0]) : "";
  const endDate = weekDays[6] ? formatDate(weekDays[6]) : "";
  const { data: sickLeaves = [] } = useActiveSickLeavesForPeriod(startDate, endDate);

  const getShiftsForEmployeeOnDate = (employeeId: string, date: Date) => {
    return shifts.filter(
      (s) => s.employee_id === employeeId && s.date === formatDate(date)
    );
  };

  // Check if an employee is on sick leave on a given date
  const getSickLeaveForEmployeeOnDate = (employeeId: string, date: Date) => {
    const dateStr = formatDate(date);
    return sickLeaves.find((sl) => {
      if (sl.employee_id !== employeeId) return false;
      const startOk = sl.start_date <= dateStr;
      const endOk = !sl.end_date || sl.end_date >= dateStr;
      return startOk && endOk;
    });
  };

  const getSickLeaveLabel = (leaveType: SickLeaveType): string => {
    switch (leaveType) {
      case 'egenmelding': return 'Egenmelding';
      case 'sykemelding': return 'Sykemeldt';
      case 'gradert_sykemelding': return 'Gradert syk';
      case 'arbeidsrelatert_sykdom': return 'Arb.rel. syk';
      default: return 'Syk';
    }
  };

  const employeeWeeklyHours = useMemo(() => {
    const hoursMap: Record<string, number> = {};
    
    for (const employee of employees) {
      const employeeShifts = shifts.filter((s) => s.employee_id === employee.id);
      const totalHours = employeeShifts.reduce((sum, shift) => {
        return sum + calculateShiftHours(shift);
      }, 0);
      hoursMap[employee.id] = totalHours;
    }
    
    return hoursMap;
  }, [employees, shifts]);

  // Determine target hours based on employee type
  const getTargetHours = (employeeType: string | null): number => {
    switch (employeeType) {
      case "fast":
        return 37.5;
      case "deltid":
        return 30;
      case "tilkalling":
        return 20;
      default:
        return 37.5;
    }
  };

  if (employees.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Ingen ansatte å vise.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Header with days + Hours column */}
      <div className="grid min-w-[900px] grid-cols-[200px_repeat(7,1fr)_100px] border-b border-border">
        <div className="border-r border-border bg-muted/50 p-3">
          <span className="text-sm font-medium text-muted-foreground">Ansatt</span>
        </div>
        {weekDays.map((day, i) => {
          const isToday = formatDate(day) === "2026-01-19"; // Demo date
          return (
            <div
              key={i}
              className={cn(
                "border-r border-border p-3 last:border-r-0",
                isToday && "bg-primary/5"
              )}
            >
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{dayNames[i]}</p>
                <p
                  className={cn(
                    "text-lg font-semibold",
                    isToday ? "text-primary" : "text-foreground"
                  )}
                >
                  {day.getDate()}
                </p>
              </div>
            </div>
          );
        })}
        <div className="border-l border-border bg-muted/50 p-3 text-center">
          <span className="text-sm font-medium text-muted-foreground">Timer</span>
        </div>
      </div>

      {/* Employee Rows */}
      {employees.map((employee) => {
        const weeklyHours = employeeWeeklyHours[employee.id] || 0;
        const targetHours = getTargetHours(employee.employee_type);
        const hoursPercent = Math.min((weeklyHours / targetHours) * 100, 100);
        const isOvertime = weeklyHours > targetHours;

        return (
          <div
            key={employee.id}
            className="grid min-w-[900px] grid-cols-[200px_repeat(7,1fr)_100px] border-b border-border last:border-b-0"
          >
            {/* Employee info cell */}
            <div className="flex items-center gap-2 border-r border-border bg-muted/30 p-3">
              <AvatarWithInitials name={employee.full_name} size="sm" />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-foreground truncate">
                  {employee.full_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {getEmployeeTypeLabel(employee.employee_type)}
                </span>
              </div>
            </div>

            {/* Day cells */}
            {weekDays.map((day, i) => {
              const cellShifts = getShiftsForEmployeeOnDate(employee.id, day);
              const sickLeave = getSickLeaveForEmployeeOnDate(employee.id, day);
              const isToday = formatDate(day) === "2026-01-19";

              return (
                <DroppableScheduleCell
                  key={i}
                  date={day}
                  functionId={cellShifts[0]?.function_id || "employee-cell"}
                  isToday={isToday}
                  isAdminOrManager={isAdminOrManager}
                  onClick={() => onCellClick(day, employee.id)}
                  onDrop={onShiftDrop}
                  className={cn(
                    "min-h-[80px]",
                    sickLeave && "bg-destructive/5 border-l-2 border-l-destructive"
                  )}
                >
                  {/* Sick leave indicator */}
                  {sickLeave && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1.5 mb-1 border border-destructive/20">
                          <Thermometer className="h-3.5 w-3.5 text-destructive" />
                          <span className="text-xs font-medium text-destructive">
                            {getSickLeaveLabel(sickLeave.leave_type)}
                          </span>
                          {sickLeave.sick_leave_percentage < 100 && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-destructive border-destructive/30">
                              {sickLeave.sick_leave_percentage}%
                            </Badge>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{getSickLeaveLabel(sickLeave.leave_type)}</p>
                        <p className="text-xs text-muted-foreground">
                          Fra {sickLeave.start_date}
                          {sickLeave.end_date && ` til ${sickLeave.end_date}`}
                        </p>
                        {sickLeave.sick_leave_percentage < 100 && (
                          <p className="text-xs">Gradert: {sickLeave.sick_leave_percentage}%</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Regular shifts or FRI */}
                  {cellShifts.length > 0 ? (
                    cellShifts.map((shift) => (
                      <DraggableShiftCard
                        key={shift.id}
                        shift={shift}
                        onShiftClick={onShiftClick}
                        isAdminOrManager={isAdminOrManager}
                        showFunction
                      />
                    ))
                  ) : !sickLeave ? (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      FRI
                    </div>
                  ) : null}
                </DroppableScheduleCell>
              );
            })}

            {/* Hours column */}
            <div className="flex flex-col items-center justify-center border-l border-border p-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full cursor-help">
                    <div
                      className={cn(
                        "text-center font-semibold",
                        isOvertime && "text-destructive"
                      )}
                    >
                      {weeklyHours.toFixed(1)}t
                    </div>
                    <Progress
                      value={hoursPercent}
                      className={cn("mt-1 h-2", isOvertime && "[&>div]:bg-destructive")}
                    />
                    <div className="mt-1 text-center text-xs text-muted-foreground">
                      / {targetHours}t
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">
                    {employee.full_name}
                  </p>
                  <p className="text-sm">
                    {weeklyHours.toFixed(1)} av {targetHours} timer denne uken
                  </p>
                  {isOvertime && (
                    <p className="text-sm text-destructive">
                      Overtid: +{(weeklyHours - targetHours).toFixed(1)}t
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        );
      })}

      {/* Summary Row */}
      <div className="grid min-w-[900px] grid-cols-[200px_repeat(7,1fr)_100px] bg-muted/50">
        <div className="border-r border-border p-3">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Totalt
          </span>
        </div>
        {weekDays.map((day, i) => {
          const dayShifts = shifts.filter((s) => s.date === formatDate(day) && s.employee_id);
          const uniqueEmployees = new Set(dayShifts.map((s) => s.employee_id)).size;
          return (
            <div
              key={i}
              className="border-r border-border p-2 text-center text-xs last:border-r-0"
            >
              <div className="font-medium text-foreground">
                {uniqueEmployees} pers
              </div>
              <div className="text-muted-foreground">
                {dayShifts.length} vakter
              </div>
            </div>
          );
        })}
        <div className="border-l border-border p-2 text-center">
          <div className="text-sm font-semibold text-foreground">
            {Object.values(employeeWeeklyHours)
              .reduce((a, b) => a + b, 0)
              .toFixed(1)}t
          </div>
        </div>
      </div>
    </div>
  );
}

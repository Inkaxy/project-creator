import { DragEvent, useRef, useState, forwardRef } from "react";
import { ShiftData } from "@/hooks/useShifts";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { Users, GripVertical, Clock, CheckCircle, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";
import { SickLeaveType } from "@/hooks/useSickLeave";

interface SickLeaveInfo {
  leave_type: SickLeaveType;
  sick_leave_percentage: number;
}

interface ImprovedShiftCardProps {
  shift: ShiftData;
  onShiftClick: (shift: ShiftData) => void;
  isAdminOrManager: boolean;
  showFunction?: boolean;
  isSelected?: boolean;
  onSelect?: (shiftId: string, selected: boolean) => void;
  compact?: boolean;
  sickLeave?: SickLeaveInfo | null;
}

export const ImprovedShiftCard = forwardRef<HTMLDivElement, ImprovedShiftCardProps>(
  ({ shift, onShiftClick, isAdminOrManager, showFunction = false, isSelected = false, onSelect, compact = false, sickLeave }, ref) => {
    const [isDragging, setIsDragging] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
      if (!isAdminOrManager) {
        e.preventDefault();
        return;
      }
      setIsDragging(true);
      e.dataTransfer.setData("application/json", JSON.stringify({
        shiftId: shift.id,
        originalDate: shift.date,
        originalFunctionId: shift.function_id,
        originalEmployeeId: shift.employee_id,
        plannedStart: shift.planned_start,
        plannedEnd: shift.planned_end,
        employeeName: shift.profiles?.full_name || null,
      }));
      e.dataTransfer.effectAllowed = "copyMove";
      
      const target = e.target as HTMLElement;
      target.style.opacity = "0.5";
    };

    const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
      setIsDragging(false);
      const target = e.target as HTMLElement;
      target.style.opacity = "1";
    };

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      
      // Multi-select with Ctrl/Cmd
      if ((e.ctrlKey || e.metaKey) && onSelect) {
        onSelect(shift.id, !isSelected);
      } else {
        onShiftClick(shift);
      }
    };

    // Format actual clock times
    const hasClockData = shift.actual_start || shift.actual_end;
    const clockStart = shift.actual_start?.slice(0, 5);
    const clockEnd = shift.actual_end?.slice(0, 5);

    return (
      <div
        ref={ref || elementRef}
        draggable={isAdminOrManager}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        className={cn(
          "cursor-pointer rounded-lg transition-all hover:shadow-md group relative",
          compact ? "p-1.5 text-xs" : "p-2 text-sm",
          !shift.employee_id 
            ? "border-2 border-dashed border-primary/50 bg-primary/5" 
            : sickLeave
              ? "bg-destructive/10 border-2 border-destructive/40"
              : shift.is_night_shift 
                ? "bg-destructive/10 border border-destructive/20" 
                : "bg-card border border-border",
          isSelected && "ring-2 ring-primary ring-offset-1",
          isAdminOrManager && "cursor-grab active:cursor-grabbing",
          isDragging && "opacity-50"
        )}
      >
        {/* Sick leave indicator badge */}
        {sickLeave && (
          <div className="absolute -top-2 -left-1 z-10">
            <div className="bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 flex items-center gap-1 text-[10px] font-medium shadow-sm">
              <Thermometer className="h-3 w-3" />
              <span>{sickLeave.leave_type === 'egenmelding' ? 'Egenm.' : 'Syk'}</span>
              {sickLeave.sick_leave_percentage < 100 && (
                <span>{sickLeave.sick_leave_percentage}%</span>
              )}
            </div>
          </div>
        )}

        {/* Selection checkbox overlay for multi-select */}
        {isSelected && (
          <div className="absolute -top-1 -right-1 z-10">
            <div className="bg-primary text-primary-foreground rounded-full p-0.5">
              <CheckCircle className="h-3 w-3" />
            </div>
          </div>
        )}

        {/* Drag handle indicator for managers */}
        {isAdminOrManager && (
          <div className="absolute left-0 top-0 bottom-0 w-3 flex items-center justify-center opacity-0 group-hover:opacity-40 transition-opacity">
            <GripVertical className="h-3 w-3" />
          </div>
        )}
        
        {shift.profiles ? (
          <div className="space-y-1">
            {/* Employee name */}
            <p className={cn(
              "font-semibold text-foreground truncate",
              compact ? "text-xs" : "text-sm"
            )}>
              {shift.profiles.full_name}
            </p>
            
            {/* Planned time */}
            <p className={cn(
              "font-bold",
              compact ? "text-sm" : "text-base",
              shift.is_night_shift ? "text-destructive" : "text-foreground"
            )}>
              {shift.planned_start?.slice(0, 5)} - {shift.planned_end?.slice(0, 5)}
            </p>
            
            {/* Actual clock time (if available) */}
            {hasClockData && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className={cn(compact ? "text-[10px]" : "text-xs")}>
                  {clockStart || "--:--"} - {clockEnd || "--:--"}
                </span>
              </div>
            )}

            {/* Function badge if showFunction */}
            {showFunction && shift.functions && (
              <div className="flex items-center gap-1 mt-1">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: shift.functions.color || "#3B82F6" }}
                />
                <span className={cn(
                  "text-muted-foreground truncate",
                  compact ? "text-[10px]" : "text-xs"
                )}>
                  {shift.functions.name}
                </span>
              </div>
            )}

            {/* Status indicator */}
            {shift.status === "completed" && (
              <div className="flex items-center gap-1 text-success text-[10px]">
                <CheckCircle className="h-3 w-3" />
                <span>Stemplet inn</span>
              </div>
            )}
          </div>
        ) : (
          // Open shift
          <div className="flex items-center gap-2 text-primary">
            <Users className="h-4 w-4" />
            <div>
              <p className="font-medium">Ledig vakt</p>
              <p className="text-xs opacity-80">
                {shift.planned_start?.slice(0, 5)} - {shift.planned_end?.slice(0, 5)}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ImprovedShiftCard.displayName = "ImprovedShiftCard";

import { DragEvent, useEffect, useRef, useState } from "react";
import { ShiftData } from "@/hooks/useShifts";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { Users, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraggableShiftCardProps {
  shift: ShiftData;
  onShiftClick: (shift: ShiftData) => void;
  isAdminOrManager: boolean;
}

export function DraggableShiftCard({ shift, onShiftClick, isAdminOrManager }: DraggableShiftCardProps) {
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
    
    // Add visual feedback
    const target = e.target as HTMLElement;
    target.style.opacity = "0.5";
    target.classList.add("scale-105", "shadow-lg");
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    setIsDragging(false);
    const target = e.target as HTMLElement;
    target.style.opacity = "1";
    target.classList.remove("scale-105", "shadow-lg");
  };

  // Handle Escape key to cancel drag
  useEffect(() => {
    if (!isDragging) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsDragging(false);
        // Reset visual state
        if (elementRef.current) {
          elementRef.current.style.opacity = "1";
          elementRef.current.classList.remove("scale-105", "shadow-lg");
        }
        // Dispatch a custom event to signal drag cancellation
        document.dispatchEvent(new CustomEvent("dragcancel"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDragging]);

  return (
    <div
      ref={elementRef}
      draggable={isAdminOrManager}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={(e) => { e.stopPropagation(); onShiftClick(shift); }}
      className={cn(
        "mb-1 cursor-pointer rounded-lg p-2 text-xs transition-all hover:scale-[1.02] group relative",
        !shift.employee_id 
          ? "border-2 border-dashed border-primary bg-primary/10" 
          : shift.is_night_shift 
            ? "bg-destructive/10 text-destructive" 
            : "bg-primary/10 text-primary",
        isAdminOrManager && "cursor-grab active:cursor-grabbing"
      )}
    >
      {/* Drag handle indicator for managers */}
      {isAdminOrManager && (
        <div className="absolute left-0 top-0 bottom-0 w-4 flex items-center justify-center opacity-0 group-hover:opacity-50 transition-opacity">
          <GripVertical className="h-3 w-3" />
        </div>
      )}
      
      {shift.profiles ? (
        <div className="flex items-center gap-2">
          <AvatarWithInitials name={shift.profiles.full_name} size="sm" />
          <div>
            <p className="font-medium">{shift.profiles.full_name.split(" ")[0]}</p>
            <p className="opacity-80">{shift.planned_start?.slice(0,5)}-{shift.planned_end?.slice(0,5)}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="font-medium">Ledig vakt</span>
        </div>
      )}
    </div>
  );
}

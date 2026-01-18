import { DragEvent, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Clock, Copy, Move } from "lucide-react";

interface DragData {
  shiftId: string;
  originalDate: string;
  originalFunctionId: string | null;
  originalEmployeeId: string | null;
  plannedStart: string;
  plannedEnd: string;
  employeeName?: string;
}

interface DroppableScheduleCellProps {
  date: Date;
  functionId: string;
  isToday: boolean;
  isAdminOrManager: boolean;
  onClick: () => void;
  onDrop: (shiftId: string, newDate: string, newFunctionId: string, isCopy: boolean) => void;
  children: ReactNode;
  className?: string;
}

export function DroppableScheduleCell({
  date,
  functionId,
  isToday,
  isAdminOrManager,
  onClick,
  onDrop,
  children,
  className,
}: DroppableScheduleCellProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragData, setDragData] = useState<DragData | null>(null);
  const [isCopyMode, setIsCopyMode] = useState(false);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  const formatDisplayDate = (d: Date) => d.toLocaleDateString("nb-NO", { weekday: "short", day: "numeric", month: "short" });

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!isAdminOrManager) return;
    e.preventDefault();
    const copyMode = e.ctrlKey || e.metaKey;
    e.dataTransfer.dropEffect = copyMode ? "copy" : "move";
    setIsCopyMode(copyMode);
    setIsDragOver(true);

    // Try to get drag data for preview
    try {
      const jsonData = e.dataTransfer.getData("application/json");
      if (jsonData) {
        setDragData(JSON.parse(jsonData));
      }
    } catch {
      // Can't access data during dragover in some browsers, that's ok
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    if (!isAdminOrManager) return;
    e.preventDefault();
    setIsDragOver(true);
    
    // Try to extract drag data from types
    const types = e.dataTransfer.types;
    if (types.includes("application/json")) {
      // Data will be available on drop
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setIsDragOver(false);
      setDragData(null);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    setDragData(null);

    if (!isAdminOrManager) return;

    try {
      const data: DragData = JSON.parse(e.dataTransfer.getData("application/json"));
      const isCopy = e.ctrlKey || e.metaKey;
      const newDate = formatDate(date);

      if (isCopy || data.originalDate !== newDate || data.originalFunctionId !== functionId) {
        onDrop(data.shiftId, newDate, functionId, isCopy);
      }
    } catch (err) {
      console.error("Failed to parse drop data:", err);
    }
  };

  const handleKeyChange = (e: KeyboardEvent) => {
    if (isDragOver) {
      setIsCopyMode(e.ctrlKey || e.metaKey);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onClick}
      className={cn(
        "min-h-[80px] cursor-pointer border-r border-border p-2 transition-all last:border-r-0 hover:bg-muted/50 relative",
        isToday && "bg-primary/5",
        isDragOver && isAdminOrManager && "bg-primary/10 ring-2 ring-primary ring-inset",
        className
      )}
    >
      {children}
      
      {/* Drop Preview Indicator */}
      {isDragOver && isAdminOrManager && (
        <div className="absolute inset-1 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/20 backdrop-blur-sm pointer-events-none z-10">
          <div className="flex items-center gap-1 text-primary font-medium text-xs">
            {isCopyMode ? (
              <>
                <Copy className="h-3 w-3" />
                <span>Kopier hit</span>
              </>
            ) : (
              <>
                <Move className="h-3 w-3" />
                <span>Flytt hit</span>
              </>
            )}
          </div>
          <div className="text-[10px] text-primary/80 mt-1">
            {formatDisplayDate(date)}
          </div>
          {dragData && (
            <div className="flex items-center gap-1 text-[10px] text-primary/70 mt-0.5">
              <Clock className="h-2.5 w-2.5" />
              <span>{dragData.plannedStart?.slice(0, 5)} - {dragData.plannedEnd?.slice(0, 5)}</span>
            </div>
          )}
          <div className="text-[9px] text-primary/60 mt-1">
            {isCopyMode ? "Slipp for å kopiere" : "Hold Ctrl for å kopiere"}
          </div>
        </div>
      )}
    </div>
  );
}

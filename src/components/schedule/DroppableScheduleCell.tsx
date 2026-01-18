import { DragEvent, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DragData {
  shiftId: string;
  originalDate: string;
  originalFunctionId: string | null;
  originalEmployeeId: string | null;
  plannedStart: string;
  plannedEnd: string;
}

interface DroppableScheduleCellProps {
  date: Date;
  functionId: string;
  isToday: boolean;
  isAdminOrManager: boolean;
  onClick: () => void;
  onDrop: (shiftId: string, newDate: string, newFunctionId: string, isCopy: boolean) => void;
  children: ReactNode;
}

export function DroppableScheduleCell({
  date,
  functionId,
  isToday,
  isAdminOrManager,
  onClick,
  onDrop,
  children,
}: DroppableScheduleCellProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!isAdminOrManager) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = e.ctrlKey || e.metaKey ? "copy" : "move";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    // Only set to false if we're leaving the cell, not entering a child
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (!isAdminOrManager) return;

    try {
      const data: DragData = JSON.parse(e.dataTransfer.getData("application/json"));
      const isCopy = e.ctrlKey || e.metaKey;
      const newDate = formatDate(date);

      // Only trigger if something actually changed (or it's a copy)
      if (isCopy || data.originalDate !== newDate || data.originalFunctionId !== functionId) {
        onDrop(data.shiftId, newDate, functionId, isCopy);
      }
    } catch (err) {
      console.error("Failed to parse drop data:", err);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onClick}
      className={cn(
        "min-h-[80px] cursor-pointer border-r border-border p-2 transition-colors last:border-r-0 hover:bg-muted/50",
        isToday && "bg-primary/5",
        isDragOver && isAdminOrManager && "bg-primary/20 ring-2 ring-primary ring-inset"
      )}
    >
      {children}
    </div>
  );
}

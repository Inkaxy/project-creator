import { Button } from "@/components/ui/button";
import { LayoutGrid, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "functions" | "employees";

interface ScheduleViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ScheduleViewToggle({ viewMode, onViewModeChange }: ScheduleViewToggleProps) {
  return (
    <div className="flex rounded-lg border border-border bg-muted p-1">
      <Button
        variant={viewMode === "functions" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("functions")}
        className={cn("gap-2", viewMode === "functions" && "shadow-sm")}
      >
        <LayoutGrid className="h-4 w-4" />
        Funksjoner
      </Button>
      <Button
        variant={viewMode === "employees" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("employees")}
        className={cn("gap-2", viewMode === "employees" && "shadow-sm")}
      >
        <Users className="h-4 w-4" />
        Ansatte
      </Button>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TimeRange = "week" | "2weeks" | "month";

interface TimeRangeSelectorProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

export function TimeRangeSelector({ timeRange, onTimeRangeChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex rounded-lg border border-border bg-muted p-1">
      <Button
        variant={timeRange === "week" ? "default" : "ghost"}
        size="sm"
        onClick={() => onTimeRangeChange("week")}
        className={cn("gap-1 text-xs", timeRange === "week" && "shadow-sm")}
      >
        1 uke
      </Button>
      <Button
        variant={timeRange === "2weeks" ? "default" : "ghost"}
        size="sm"
        onClick={() => onTimeRangeChange("2weeks")}
        className={cn("gap-1 text-xs", timeRange === "2weeks" && "shadow-sm")}
      >
        2 uker
      </Button>
      <Button
        variant={timeRange === "month" ? "default" : "ghost"}
        size="sm"
        onClick={() => onTimeRangeChange("month")}
        className={cn("gap-1 text-xs", timeRange === "month" && "shadow-sm")}
      >
        1 mnd
      </Button>
    </div>
  );
}

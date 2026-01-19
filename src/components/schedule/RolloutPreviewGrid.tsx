import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { RolloutPreview, PreviewShift } from "@/hooks/useShiftTemplates";
import { cn } from "@/lib/utils";

interface RolloutPreviewGridProps {
  preview: RolloutPreview;
}

const DAY_NAMES = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function RolloutPreviewGrid({ preview }: RolloutPreviewGridProps) {
  // Group shifts by function
  const shiftsByFunction = useMemo(() => {
    const grouped: Record<string, PreviewShift[]> = {};
    
    for (const shift of preview.shifts) {
      if (!grouped[shift.function_id]) {
        grouped[shift.function_id] = [];
      }
      grouped[shift.function_id].push(shift);
    }
    
    return grouped;
  }, [preview.shifts]);

  // Get unique functions
  const functions = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; color: string | null }>();
    for (const shift of preview.shifts) {
      if (!seen.has(shift.function_id)) {
        seen.set(shift.function_id, {
          id: shift.function_id,
          name: shift.function_name,
          color: shift.function_color,
        });
      }
    }
    return Array.from(seen.values());
  }, [preview.shifts]);

  // Get dates for each day
  const dayDates = useMemo(() => {
    const dates: Record<number, { date: string; isHoliday: boolean }> = {};
    for (const shift of preview.shifts) {
      if (!dates[shift.dayOfWeek]) {
        dates[shift.dayOfWeek] = {
          date: shift.date,
          isHoliday: shift.isHoliday,
        };
      }
    }
    return dates;
  }, [preview.shifts]);

  if (functions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg">
        Ingen vakter i forhåndsvisning
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden text-sm">
      {/* Header */}
      <div className="grid grid-cols-8 bg-muted/50 border-b">
        <div className="p-2 font-medium border-r text-xs">Funksjon</div>
        {DAY_ORDER.map((dayIndex) => {
          const dayInfo = dayDates[dayIndex];
          const isWeekend = dayIndex === 0 || dayIndex === 6;
          
          return (
            <div 
              key={dayIndex} 
              className={cn(
                "p-1.5 text-center border-r last:border-r-0",
                isWeekend && "bg-muted/30",
                dayInfo?.isHoliday && "bg-destructive/10"
              )}
            >
              <div className="font-medium text-xs">{DAY_NAMES[dayIndex]}</div>
              {dayInfo && (
                <div className="text-xs text-muted-foreground">
                  {format(new Date(dayInfo.date), "d.", { locale: nb })}
                </div>
              )}
              {dayInfo?.isHoliday && (
                <Badge variant="destructive" className="text-[10px] px-1 py-0 mt-0.5">
                  Helligdag
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {/* Function rows */}
      {functions.map((func) => (
        <div key={func.id} className="grid grid-cols-8 border-b last:border-b-0">
          <div className="p-1.5 border-r flex items-center gap-1.5 bg-muted/10">
            <div 
              className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
              style={{ backgroundColor: func.color || '#6b7280' }}
            />
            <span className="text-xs font-medium truncate">{func.name}</span>
          </div>
          
          {DAY_ORDER.map((dayIndex) => {
            const dayShifts = shiftsByFunction[func.id]?.filter(
              s => s.dayOfWeek === dayIndex
            ) || [];
            const isWeekend = dayIndex === 0 || dayIndex === 6;
            
            return (
              <div 
                key={dayIndex} 
                className={cn(
                  "p-0.5 border-r last:border-r-0 min-h-[50px]",
                  isWeekend && "bg-muted/10"
                )}
              >
                {dayShifts.map((shift, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "text-[10px] p-1 rounded mb-0.5",
                      shift.status === 'new' && "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800",
                      shift.status === 'existing' && "bg-muted text-muted-foreground border border-border",
                      shift.status === 'conflict' && "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800"
                    )}
                  >
                    <div className="font-medium">
                      {shift.start_time.slice(0, 5)}-{shift.end_time.slice(0, 5)}
                    </div>
                    {shift.employee_name && (
                      <div className="truncate opacity-75">
                        {shift.employee_name.split(' ')[0]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div className="p-2 bg-muted/30 flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800" />
          <span>Ny ({preview.shiftCount})</span>
        </div>
        {preview.conflictCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-800" />
            <span>Konflikt ({preview.conflictCount})</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-muted border border-border" />
          <span>Overskrives</span>
        </div>
      </div>
    </div>
  );
}
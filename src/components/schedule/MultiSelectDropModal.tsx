import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Move, Calendar, Clock } from "lucide-react";
import { ShiftData } from "@/hooks/useShifts";
import { format, parseISO, differenceInDays } from "date-fns";
import { nb } from "date-fns/locale";

interface MultiSelectDropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shifts: ShiftData[];
  targetDate: string;
  isCopy: boolean;
  onConfirm: () => void;
}

export function MultiSelectDropModal({
  open,
  onOpenChange,
  shifts,
  targetDate,
  isCopy,
  onConfirm,
}: MultiSelectDropModalProps) {
  if (shifts.length === 0) return null;

  // Calculate day offset from first shift
  const firstShiftDate = shifts[0]?.date;
  const dayOffset = firstShiftDate 
    ? differenceInDays(parseISO(targetDate), parseISO(firstShiftDate))
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCopy ? (
              <>
                <Copy className="h-5 w-5 text-primary" />
                Kopier {shifts.length} vakter
              </>
            ) : (
              <>
                <Move className="h-5 w-5 text-primary" />
                Flytt {shifts.length} vakter
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isCopy 
              ? `Vaktene vil bli kopiert med ${dayOffset >= 0 ? '+' : ''}${dayOffset} dager forskyvning.`
              : `Vaktene vil bli flyttet med ${dayOffset >= 0 ? '+' : ''}${dayOffset} dager forskyvning.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-60 overflow-y-auto py-2">
          {shifts.map((shift) => {
            const newDate = new Date(parseISO(shift.date));
            newDate.setDate(newDate.getDate() + dayOffset);
            
            return (
              <div 
                key={shift.id} 
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {shift.profiles?.full_name || "Ledig vakt"}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {shift.planned_start?.slice(0, 5)} - {shift.planned_end?.slice(0, 5)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 text-xs">
                  <Badge variant="outline" className="text-muted-foreground">
                    {format(parseISO(shift.date), "EEE d. MMM", { locale: nb })}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="secondary">
                    {format(newDate, "EEE d. MMM", { locale: nb })}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={onConfirm}>
            {isCopy ? "Kopier alle" : "Flytt alle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

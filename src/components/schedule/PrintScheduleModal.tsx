import { useState, useRef } from "react";
import { format, addWeeks, startOfWeek, addDays } from "date-fns";
import { nb } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Printer, Download } from "lucide-react";
import { ShiftData } from "@/hooks/useShifts";
import { cn } from "@/lib/utils";

interface FunctionData {
  id: string;
  name: string;
  color: string | null;
  department_id: string | null;
  departments?: { name: string } | null;
}

interface PrintScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate: Date;
  functions: FunctionData[];
  shifts: ShiftData[];
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function PrintScheduleModal({
  open,
  onOpenChange,
  currentDate,
  functions,
  shifts,
}: PrintScheduleModalProps) {
  const [weeks, setWeeks] = useState("1");
  const printRef = useRef<HTMLDivElement>(null);

  const numWeeks = parseInt(weeks);
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endDate = addWeeks(startDate, numWeeks);

  // Generate all days for the selected period
  const allDays: Date[] = [];
  let day = startDate;
  while (day < endDate) {
    allDays.push(day);
    day = addDays(day, 1);
  }

  // Group days by week
  const weekGroups: Date[][] = [];
  for (let i = 0; i < numWeeks; i++) {
    const weekStart = addWeeks(startDate, i);
    const weekDays: Date[] = [];
    for (let d = 0; d < 7; d++) {
      weekDays.push(addDays(weekStart, d));
    }
    weekGroups.push(weekDays);
  }

  const getShiftsForDayAndFunction = (date: Date, functionId: string) => {
    return shifts.filter(
      (shift) => shift.date === formatDate(date) && shift.function_id === functionId
    );
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vaktplan - ${format(startDate, "d. MMM", { locale: nb })} til ${format(addDays(endDate, -1), "d. MMM yyyy", { locale: nb })}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: system-ui, -apple-system, sans-serif; font-size: 10px; padding: 16px; }
            h1 { font-size: 16px; margin-bottom: 4px; }
            .subtitle { color: #666; margin-bottom: 16px; font-size: 11px; }
            .week-section { margin-bottom: 20px; page-break-inside: avoid; }
            .week-header { font-size: 12px; font-weight: 600; margin-bottom: 8px; padding: 4px 8px; background: #f5f5f5; border-radius: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 9px; }
            th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; vertical-align: top; }
            th { background: #f9f9f9; font-weight: 600; }
            .function-cell { font-weight: 500; min-width: 100px; }
            .function-color { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 4px; }
            .shift { background: #f0f7ff; padding: 2px 4px; margin-bottom: 2px; border-radius: 2px; font-size: 8px; }
            .shift-time { font-weight: 500; }
            .shift-employee { color: #555; }
            .day-header { text-align: center; }
            .day-name { font-size: 8px; color: #888; }
            .day-date { font-weight: 600; }
            @media print { 
              body { padding: 0; }
              .week-section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>Vaktplan</h1>
          <p class="subtitle">${format(startDate, "d. MMMM", { locale: nb })} – ${format(addDays(endDate, -1), "d. MMMM yyyy", { locale: nb })}</p>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Skriv ut vaktplan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="weeks">Antall uker</Label>
              <Select value={weeks} onValueChange={setWeeks}>
                <SelectTrigger id="weeks">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 uke</SelectItem>
                  <SelectItem value="2">2 uker</SelectItem>
                  <SelectItem value="3">3 uker</SelectItem>
                  <SelectItem value="4">4 uker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground pt-5">
              {format(startDate, "d. MMM", { locale: nb })} – {format(addDays(endDate, -1), "d. MMM yyyy", { locale: nb })}
            </div>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-4 bg-background max-h-[400px] overflow-y-auto">
            <div ref={printRef}>
              {weekGroups.map((weekDays, weekIndex) => (
                <div key={weekIndex} className="mb-6 last:mb-0">
                  <div className="text-sm font-semibold mb-2 px-2 py-1 bg-muted rounded">
                    Uke {format(weekDays[0], "w", { locale: nb })}
                  </div>
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr>
                        <th className="border border-border p-2 bg-muted/50 text-left w-[120px]">
                          Funksjon
                        </th>
                        {weekDays.map((day, i) => (
                          <th key={i} className="border border-border p-2 bg-muted/50 text-center">
                            <div className="text-[10px] text-muted-foreground">
                              {format(day, "EEE", { locale: nb })}
                            </div>
                            <div className="font-semibold">
                              {format(day, "d.")}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {functions.map((func) => (
                        <tr key={func.id}>
                          <td className="border border-border p-2 bg-muted/20">
                            <div className="flex items-center gap-1">
                              <span
                                className="w-2 h-2 rounded-sm flex-shrink-0"
                                style={{ backgroundColor: func.color || "#3B82F6" }}
                              />
                              <span className="truncate text-xs font-medium">
                                {func.name}
                              </span>
                            </div>
                          </td>
                          {weekDays.map((day, i) => {
                            const dayShifts = getShiftsForDayAndFunction(day, func.id);
                            return (
                              <td key={i} className="border border-border p-1 align-top">
                                <div className="space-y-0.5">
                                  {dayShifts.map((shift) => (
                                    <div
                                      key={shift.id}
                                      className="bg-primary/10 rounded px-1 py-0.5 text-[10px]"
                                    >
                                      <div className="font-medium">
                                        {shift.planned_start?.slice(0, 5)} - {shift.planned_end?.slice(0, 5)}
                                      </div>
                                      {shift.profiles?.full_name && (
                                        <div className="text-muted-foreground truncate">
                                          {shift.profiles.full_name.split(" ")[0]}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Skriv ut
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useRef, useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  addDays,
  getISOWeek,
  parseISO,
} from "date-fns";
import { nb } from "date-fns/locale";
import { Printer } from "lucide-react";
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
import { useAllTimeEntries, type TimeEntryData } from "@/hooks/useTimeEntries";
import { useDepartments } from "@/hooks/useEmployees";

interface PrintTimesheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWeekStart: Date;
}

const DAY_NAMES = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];

function isNightHour(hour: number): boolean {
  return hour >= 21 || hour < 6;
}

/**
 * Calculate night hours, regular hours, and break for a time entry.
 * Night hours = hours worked between 21:00 and 06:00.
 */
function calculateHourBreakdown(entry: TimeEntryData) {
  if (!entry.clock_in || !entry.clock_out) {
    return { regularHours: 0, nightHours: 0, breakMinutes: entry.break_minutes || 0, totalHours: 0 };
  }

  const clockIn = new Date(entry.clock_in);
  const clockOut = new Date(entry.clock_out);
  const breakMinutes = entry.break_minutes || 0;

  // Calculate night hours minute by minute (simplified: per-hour buckets)
  let nightMinutes = 0;
  let totalMinutes = 0;
  const cursor = new Date(clockIn);

  while (cursor < clockOut) {
    const h = cursor.getHours();
    if (isNightHour(h)) {
      nightMinutes++;
    }
    totalMinutes++;
    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  const totalHoursGross = totalMinutes / 60;
  const totalHoursNet = totalHoursGross - breakMinutes / 60;
  const nightHours = nightMinutes / 60;
  const regularHours = Math.max(0, totalHoursNet - nightHours);

  return {
    regularHours: Math.round(regularHours * 100) / 100,
    nightHours: Math.round(nightHours * 100) / 100,
    breakMinutes,
    totalHours: Math.round(totalHoursNet * 100) / 100,
  };
}

function formatHours(h: number): string {
  if (h === 0) return "-";
  return h.toFixed(1);
}

export function PrintTimesheetModal({
  open,
  onOpenChange,
  currentWeekStart,
}: PrintTimesheetModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [weekCount, setWeekCount] = useState("1");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const { data: departments } = useDepartments();

  // Calculate date range
  const numWeeks = parseInt(weekCount);
  const rangeStart = startOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const rangeEnd = endOfWeek(addWeeks(rangeStart, numWeeks - 1), { weekStartsOn: 1 });

  const startDate = format(rangeStart, "yyyy-MM-dd");
  const endDate = format(rangeEnd, "yyyy-MM-dd");

  const { data: entries } = useAllTimeEntries(startDate, endDate);

  // Build weeks array
  const weeks = useMemo(() => {
    const result: { weekNumber: number; startDate: Date; days: Date[] }[] = [];
    for (let w = 0; w < numWeeks; w++) {
      const ws = addWeeks(rangeStart, w);
      const days: Date[] = [];
      for (let d = 0; d < 7; d++) {
        days.push(addDays(ws, d));
      }
      result.push({ weekNumber: getISOWeek(ws), startDate: ws, days });
    }
    return result;
  }, [numWeeks, rangeStart]);

  // Group entries by department → employee
  const grouped = useMemo(() => {
    if (!entries) return {};

    const filtered = departmentFilter === "all"
      ? entries
      : entries.filter((e) => e.profiles?.department_id === departmentFilter);

    const byDeptEmployee: Record<
      string,
      Record<string, { name: string; entries: TimeEntryData[] }>
    > = {};

    for (const entry of filtered) {
      const deptId = entry.profiles?.department_id || "no-dept";
      const empId = entry.employee_id;
      const empName = entry.profiles?.full_name || "Ukjent";

      if (!byDeptEmployee[deptId]) byDeptEmployee[deptId] = {};
      if (!byDeptEmployee[deptId][empId]) {
        byDeptEmployee[deptId][empId] = { name: empName, entries: [] };
      }
      byDeptEmployee[deptId][empId].entries.push(entry);
    }

    return byDeptEmployee;
  }, [entries, departmentFilter]);

  const getDeptName = (deptId: string) => {
    if (deptId === "no-dept") return "Ingen avdeling";
    return departments?.find((d) => d.id === deptId)?.name || "Ukjent avdeling";
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Timeliste utskrift</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 10px; color: #000; padding: 10mm; }
          h2 { font-size: 14px; margin: 16px 0 4px; border-bottom: 2px solid #333; padding-bottom: 4px; }
          h3 { font-size: 12px; margin: 12px 0 4px; color: #333; }
          .week-header { font-size: 11px; font-weight: bold; background: #f0f0f0; padding: 4px 8px; margin-top: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          th, td { border: 1px solid #ccc; padding: 3px 6px; text-align: center; }
          th { background: #e8e8e8; font-weight: bold; font-size: 9px; }
          td { font-size: 9px; }
          .emp-name { text-align: left; font-weight: bold; }
          .day-col { min-width: 56px; }
          .total-col { font-weight: bold; background: #f5f5f5; }
          .section-break { page-break-before: auto; }
          @media print {
            body { padding: 5mm; }
            .section-break { page-break-before: auto; }
          }
        </style>
      </head>
      <body>
        ${printRef.current.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  // Find entries for a specific employee on a specific date
  const getEntriesForDate = (
    empEntries: TimeEntryData[],
    date: Date
  ) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return empEntries.filter((e) => e.date === dateStr);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Skriv ut timeliste
          </DialogTitle>
        </DialogHeader>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-2">
            <Label>Antall uker</Label>
            <Select value={weekCount} onValueChange={setWeekCount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 uke</SelectItem>
                <SelectItem value="2">2 uker</SelectItem>
                <SelectItem value="4">4 uker</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Avdeling</Label>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle avdelinger</SelectItem>
                {departments?.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Print preview */}
        <div
          ref={printRef}
          className="border rounded-lg p-4 bg-white text-black overflow-x-auto"
          style={{ fontSize: "10px" }}
        >
          <div style={{ textAlign: "center", marginBottom: "12px" }}>
            <h1 style={{ fontSize: "16px", fontWeight: "bold" }}>Timeliste</h1>
            <p style={{ fontSize: "11px", color: "#666" }}>
              {format(rangeStart, "d. MMM yyyy", { locale: nb })} –{" "}
              {format(rangeEnd, "d. MMM yyyy", { locale: nb })}
            </p>
          </div>

          {Object.entries(grouped).map(([deptId, employees]) => (
            <div key={deptId} className="section-break">
              <h2>{getDeptName(deptId)}</h2>

              {Object.entries(employees)
                .sort(([, a], [, b]) => a.name.localeCompare(b.name))
                .map(([empId, { name, entries: empEntries }]) => (
                  <div key={empId} style={{ marginBottom: "16px" }}>
                    <h3>{name}</h3>

                    {weeks.map((week) => {
                      // Calculate per-day data
                      const dayData = week.days.map((day) => {
                        const dayEntries = getEntriesForDate(empEntries, day);
                        let regular = 0;
                        let night = 0;
                        let breakMin = 0;

                        for (const entry of dayEntries) {
                          const breakdown = calculateHourBreakdown(entry);
                          regular += breakdown.regularHours;
                          night += breakdown.nightHours;
                          breakMin += breakdown.breakMinutes;
                        }

                        return { regular, night, breakMin, clockIn: dayEntries[0]?.clock_in, clockOut: dayEntries[0]?.clock_out };
                      });

                      const weekTotalRegular = dayData.reduce((s, d) => s + d.regular, 0);
                      const weekTotalNight = dayData.reduce((s, d) => s + d.night, 0);
                      const weekTotalBreak = dayData.reduce((s, d) => s + d.breakMin, 0);

                      // Skip week if no entries at all
                      const hasAny = dayData.some((d) => d.regular > 0 || d.night > 0);
                      if (!hasAny) return null;

                      return (
                        <div key={week.weekNumber}>
                          <div className="week-header" style={{ background: "#f0f0f0", padding: "3px 8px", fontWeight: "bold", fontSize: "10px", marginTop: "6px" }}>
                            Uke {week.weekNumber}
                          </div>
                          <table>
                            <thead>
                              <tr>
                                <th style={{ width: "70px", textAlign: "left" }}></th>
                                {DAY_NAMES.map((d, i) => (
                                  <th key={d} className="day-col" style={{ minWidth: "56px" }}>
                                    {d} {format(week.days[i], "d/M")}
                                  </th>
                                ))}
                                <th style={{ minWidth: "50px" }}>Sum</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Inn/ut */}
                              <tr>
                                <td style={{ textAlign: "left", fontWeight: "bold" }}>Inn/Ut</td>
                                {dayData.map((d, i) => (
                                  <td key={i}>
                                    {d.clockIn && d.clockOut
                                      ? `${format(new Date(d.clockIn), "HH:mm")}-${format(new Date(d.clockOut), "HH:mm")}`
                                      : d.clockIn
                                        ? `${format(new Date(d.clockIn), "HH:mm")}-...`
                                        : "-"}
                                  </td>
                                ))}
                                <td></td>
                              </tr>
                              {/* Vanlige timer */}
                              <tr>
                                <td style={{ textAlign: "left", fontWeight: "bold" }}>Timer</td>
                                {dayData.map((d, i) => (
                                  <td key={i}>{formatHours(d.regular)}</td>
                                ))}
                                <td className="total-col" style={{ fontWeight: "bold", background: "#f5f5f5" }}>
                                  {formatHours(weekTotalRegular)}
                                </td>
                              </tr>
                              {/* Nattimer */}
                              <tr>
                                <td style={{ textAlign: "left", fontWeight: "bold" }}>Natt</td>
                                {dayData.map((d, i) => (
                                  <td key={i}>{formatHours(d.night)}</td>
                                ))}
                                <td className="total-col" style={{ fontWeight: "bold", background: "#f5f5f5" }}>
                                  {formatHours(weekTotalNight)}
                                </td>
                              </tr>
                              {/* Pause */}
                              <tr>
                                <td style={{ textAlign: "left", fontWeight: "bold" }}>Pause</td>
                                {dayData.map((d, i) => (
                                  <td key={i}>{d.breakMin > 0 ? `${d.breakMin}m` : "-"}</td>
                                ))}
                                <td className="total-col" style={{ fontWeight: "bold", background: "#f5f5f5" }}>
                                  {weekTotalBreak > 0 ? `${weekTotalBreak}m` : "-"}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>
          ))}

          {Object.keys(grouped).length === 0 && (
            <p style={{ textAlign: "center", padding: "20px", color: "#999" }}>
              Ingen stemplede timer i valgt periode
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Lukk
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

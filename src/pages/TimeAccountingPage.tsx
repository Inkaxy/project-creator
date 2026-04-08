import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useEmployees } from "@/hooks/useEmployees";
import { BarChart3, Clock, Moon, Coffee, ChevronLeft, ChevronRight, Building2, TrendingUp, TrendingDown } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addWeeks, addMonths, addYears, subWeeks, subMonths, subYears, getISOWeek, getYear } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";

type ViewMode = "week" | "month" | "year";

interface TimeAccountingEntry {
  employee_id: string;
  employee_name: string;
  department_id: string | null;
  department_name: string | null;
  total_minutes: number;
  night_minutes: number;
  regular_minutes: number;
  break_minutes: number;
  shift_count: number;
}

function getDateRange(date: Date, mode: ViewMode): { start: string; end: string } {
  switch (mode) {
    case "week":
      return {
        start: format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        end: format(endOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      };
    case "month":
      return {
        start: format(startOfMonth(date), "yyyy-MM-dd"),
        end: format(endOfMonth(date), "yyyy-MM-dd"),
      };
    case "year":
      return {
        start: format(startOfYear(date), "yyyy-MM-dd"),
        end: format(endOfYear(date), "yyyy-MM-dd"),
      };
  }
}

function getPeriodLabel(date: Date, mode: ViewMode): string {
  switch (mode) {
    case "week":
      return `Uke ${getISOWeek(date)}, ${getYear(date)}`;
    case "month":
      return format(date, "MMMM yyyy", { locale: nb });
    case "year":
      return format(date, "yyyy");
  }
}

function navigatePeriod(date: Date, mode: ViewMode, direction: number): Date {
  switch (mode) {
    case "week":
      return direction > 0 ? addWeeks(date, 1) : subWeeks(date, 1);
    case "month":
      return direction > 0 ? addMonths(date, 1) : subMonths(date, 1);
    case "year":
      return direction > 0 ? addYears(date, 1) : subYears(date, 1);
  }
}

function calculateNightMinutes(clockIn: string, clockOut: string): number {
  const cin = new Date(clockIn);
  const cout = new Date(clockOut);
  let nightMins = 0;
  const current = new Date(cin);

  while (current < cout) {
    const hour = current.getHours();
    if (hour >= 21 || hour < 6) {
      nightMins++;
    }
    current.setMinutes(current.getMinutes() + 1);
  }
  return nightMins;
}

function formatMinutes(mins: number): string {
  const h = Math.floor(Math.abs(mins) / 60);
  const m = Math.round(Math.abs(mins) % 60);
  return `${h}t ${m.toString().padStart(2, "0")}m`;
}

function useTimeAccountingData(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["time_accounting", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select(`
          id,
          employee_id,
          clock_in,
          clock_out,
          break_minutes,
          date,
          profiles!time_entries_employee_id_fkey (
            id,
            full_name,
            department_id,
            departments (id, name)
          )
        `)
        .gte("date", startDate)
        .lte("date", endDate)
        .not("clock_in", "is", null)
        .not("clock_out", "is", null);

      if (error) throw error;
      return data;
    },
    enabled: !!startDate && !!endDate,
  });
}

export default function TimeAccountingPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [compareDate, setCompareDate] = useState<Date | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  const currentRange = getDateRange(currentDate, viewMode);
  const compareRange = compareDate ? getDateRange(compareDate, viewMode) : null;

  const { data: currentData, isLoading: currentLoading } = useTimeAccountingData(currentRange.start, currentRange.end);
  const { data: compareData } = useTimeAccountingData(compareRange?.start ?? "", compareRange?.end ?? "");
  const { data: employees } = useEmployees();

  // Get unique departments
  const departments = useMemo(() => {
    if (!employees) return [];
    const deptMap = new Map<string, string>();
    employees.forEach((e) => {
      if (e.department_id && e.departments?.name) {
        deptMap.set(e.department_id, e.departments.name);
      }
    });
    return Array.from(deptMap, ([id, name]) => ({ id, name }));
  }, [employees]);

  // Process data into accounting entries
  const processEntries = (data: typeof currentData): TimeAccountingEntry[] => {
    if (!data) return [];
    const map = new Map<string, TimeAccountingEntry>();

    for (const entry of data) {
      const profile = entry.profiles as any;
      if (!profile) continue;

      const key = profile.id;
      if (!map.has(key)) {
        map.set(key, {
          employee_id: profile.id,
          employee_name: profile.full_name || "Ukjent",
          department_id: profile.department_id,
          department_name: profile.departments?.name || null,
          total_minutes: 0,
          night_minutes: 0,
          regular_minutes: 0,
          break_minutes: 0,
          shift_count: 0,
        });
      }

      const acc = map.get(key)!;
      if (entry.clock_in && entry.clock_out) {
        const totalMins = (new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()) / 60000;
        const nightMins = calculateNightMinutes(entry.clock_in, entry.clock_out);
        const breakMins = entry.break_minutes || 0;

        acc.total_minutes += totalMins - breakMins;
        acc.night_minutes += nightMins;
        acc.regular_minutes += totalMins - breakMins - nightMins;
        acc.break_minutes += breakMins;
        acc.shift_count += 1;
      }
    }

    return Array.from(map.values());
  };

  const currentEntries = useMemo(() => processEntries(currentData), [currentData]);
  const compareEntries = useMemo(() => processEntries(compareData), [compareData]);

  // Filter by department
  const filteredCurrent = useMemo(() => {
    if (selectedDepartment === "all") return currentEntries;
    return currentEntries.filter((e) => e.department_id === selectedDepartment);
  }, [currentEntries, selectedDepartment]);

  const filteredCompare = useMemo(() => {
    if (selectedDepartment === "all") return compareEntries;
    return compareEntries.filter((e) => e.department_id === selectedDepartment);
  }, [compareEntries, selectedDepartment]);

  // Summaries
  const currentSummary = useMemo(() => ({
    totalMinutes: filteredCurrent.reduce((s, e) => s + e.total_minutes, 0),
    nightMinutes: filteredCurrent.reduce((s, e) => s + e.night_minutes, 0),
    regularMinutes: filteredCurrent.reduce((s, e) => s + e.regular_minutes, 0),
    breakMinutes: filteredCurrent.reduce((s, e) => s + e.break_minutes, 0),
    shiftCount: filteredCurrent.reduce((s, e) => s + e.shift_count, 0),
    employeeCount: filteredCurrent.length,
  }), [filteredCurrent]);

  const compareSummary = useMemo(() => {
    if (!filteredCompare.length) return null;
    return {
      totalMinutes: filteredCompare.reduce((s, e) => s + e.total_minutes, 0),
      nightMinutes: filteredCompare.reduce((s, e) => s + e.night_minutes, 0),
      regularMinutes: filteredCompare.reduce((s, e) => s + e.regular_minutes, 0),
      breakMinutes: filteredCompare.reduce((s, e) => s + e.break_minutes, 0),
      shiftCount: filteredCompare.reduce((s, e) => s + e.shift_count, 0),
      employeeCount: filteredCompare.length,
    };
  }, [filteredCompare]);

  // Department summary for department breakdown tab
  const departmentSummary = useMemo(() => {
    const map = new Map<string, { name: string; total: number; night: number; regular: number; breaks: number; shifts: number; employees: Set<string> }>();
    const entries = selectedDepartment === "all" ? currentEntries : filteredCurrent;

    for (const e of entries) {
      const deptKey = e.department_id || "none";
      if (!map.has(deptKey)) {
        map.set(deptKey, { name: e.department_name || "Uten avdeling", total: 0, night: 0, regular: 0, breaks: 0, shifts: 0, employees: new Set() });
      }
      const d = map.get(deptKey)!;
      d.total += e.total_minutes;
      d.night += e.night_minutes;
      d.regular += e.regular_minutes;
      d.breaks += e.break_minutes;
      d.shifts += e.shift_count;
      d.employees.add(e.employee_id);
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [currentEntries, filteredCurrent, selectedDepartment]);

  const enableCompare = () => {
    setCompareDate(navigatePeriod(currentDate, viewMode, -1));
  };

  const getDiff = (current: number, compare: number) => {
    const diff = current - compare;
    const pct = compare > 0 ? Math.round((diff / compare) * 100) : 0;
    return { diff, pct };
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Timeregnskap</h1>
            <p className="text-muted-foreground">Oversikt over stemplede timer per avdeling og ansatt</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View mode */}
          <div className="flex rounded-lg border border-border bg-muted p-1">
            {(["week", "month", "year"] as ViewMode[]).map((m) => (
              <Button
                key={m}
                variant={viewMode === m ? "default" : "ghost"}
                size="sm"
                onClick={() => { setViewMode(m); setCompareDate(null); }}
                className={cn("text-xs", viewMode === m && "shadow-sm")}
              >
                {m === "week" ? "Uke" : m === "month" ? "Måned" : "År"}
              </Button>
            ))}
          </div>

          {/* Period nav */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(navigatePeriod(currentDate, viewMode, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center text-sm font-medium text-foreground capitalize">
              {getPeriodLabel(currentDate, viewMode)}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(navigatePeriod(currentDate, viewMode, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Department filter */}
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Alle avdelinger" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">
                <div className="flex items-center gap-2"><Building2 className="h-4 w-4" />Hele selskapet</div>
              </SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Compare button */}
          {!compareDate ? (
            <Button variant="outline" size="sm" onClick={enableCompare}>
              <BarChart3 className="mr-1 h-4 w-4" /> Sammenlign
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">vs</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCompareDate(navigatePeriod(compareDate, viewMode, -1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[130px] text-center text-xs font-medium text-muted-foreground capitalize">
                {getPeriodLabel(compareDate, viewMode)}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCompareDate(navigatePeriod(compareDate, viewMode, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCompareDate(null)}>✕</Button>
            </div>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard
            title="Totale timer"
            icon={Clock}
            current={currentSummary.totalMinutes}
            compare={compareSummary?.totalMinutes}
          />
          <SummaryCard
            title="Vanlige timer"
            icon={BarChart3}
            current={currentSummary.regularMinutes}
            compare={compareSummary?.regularMinutes}
          />
          <SummaryCard
            title="Nattimer"
            icon={Moon}
            current={currentSummary.nightMinutes}
            compare={compareSummary?.nightMinutes}
          />
          <SummaryCard
            title="Pause totalt"
            icon={Coffee}
            current={currentSummary.breakMinutes}
            compare={compareSummary?.breakMinutes}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="employees">
          <TabsList>
            <TabsTrigger value="employees">Per ansatt</TabsTrigger>
            <TabsTrigger value="departments">Per avdeling</TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timer per ansatt – {getPeriodLabel(currentDate, viewMode)}</CardTitle>
              </CardHeader>
              <CardContent>
                {currentLoading ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Laster data...</p>
                ) : filteredCurrent.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Ingen stemplinger funnet i denne perioden</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ansatt</TableHead>
                        <TableHead>Avdeling</TableHead>
                        <TableHead className="text-right">Vakter</TableHead>
                        <TableHead className="text-right">Vanlige timer</TableHead>
                        <TableHead className="text-right">Nattimer</TableHead>
                        <TableHead className="text-right">Pause</TableHead>
                        <TableHead className="text-right">Totalt</TableHead>
                        {compareSummary && <TableHead className="text-right">Endring</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCurrent
                        .sort((a, b) => b.total_minutes - a.total_minutes)
                        .map((entry) => {
                          const compareEntry = filteredCompare.find((c) => c.employee_id === entry.employee_id);
                          const diff = compareEntry ? getDiff(entry.total_minutes, compareEntry.total_minutes) : null;

                          return (
                            <TableRow key={entry.employee_id}>
                              <TableCell className="font-medium">{entry.employee_name}</TableCell>
                              <TableCell>
                                {entry.department_name ? (
                                  <Badge variant="secondary" className="text-xs">{entry.department_name}</Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">{entry.shift_count}</TableCell>
                              <TableCell className="text-right">{formatMinutes(entry.regular_minutes)}</TableCell>
                              <TableCell className="text-right">
                                {entry.night_minutes > 0 ? (
                                  <span className="text-primary">{formatMinutes(entry.night_minutes)}</span>
                                ) : "—"}
                              </TableCell>
                              <TableCell className="text-right">{formatMinutes(entry.break_minutes)}</TableCell>
                              <TableCell className="text-right font-semibold">{formatMinutes(entry.total_minutes)}</TableCell>
                              {compareSummary && (
                                <TableCell className="text-right">
                                  {diff ? (
                                    <DiffBadge diff={diff.diff} pct={diff.pct} />
                                  ) : (
                                    <Badge variant="outline" className="text-xs">Ny</Badge>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      {/* Totals row */}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell>Totalt ({filteredCurrent.length} ansatte)</TableCell>
                        <TableCell />
                        <TableCell className="text-right">{currentSummary.shiftCount}</TableCell>
                        <TableCell className="text-right">{formatMinutes(currentSummary.regularMinutes)}</TableCell>
                        <TableCell className="text-right text-primary">{formatMinutes(currentSummary.nightMinutes)}</TableCell>
                        <TableCell className="text-right">{formatMinutes(currentSummary.breakMinutes)}</TableCell>
                        <TableCell className="text-right">{formatMinutes(currentSummary.totalMinutes)}</TableCell>
                        {compareSummary && (
                          <TableCell className="text-right">
                            <DiffBadge
                              diff={getDiff(currentSummary.totalMinutes, compareSummary.totalMinutes).diff}
                              pct={getDiff(currentSummary.totalMinutes, compareSummary.totalMinutes).pct}
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timer per avdeling – {getPeriodLabel(currentDate, viewMode)}</CardTitle>
              </CardHeader>
              <CardContent>
                {departmentSummary.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Ingen data</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Avdeling</TableHead>
                        <TableHead className="text-right">Ansatte</TableHead>
                        <TableHead className="text-right">Vakter</TableHead>
                        <TableHead className="text-right">Vanlige timer</TableHead>
                        <TableHead className="text-right">Nattimer</TableHead>
                        <TableHead className="text-right">Pause</TableHead>
                        <TableHead className="text-right">Totalt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departmentSummary.map((dept) => (
                        <TableRow key={dept.name}>
                          <TableCell className="font-medium">{dept.name}</TableCell>
                          <TableCell className="text-right">{dept.employees.size}</TableCell>
                          <TableCell className="text-right">{dept.shifts}</TableCell>
                          <TableCell className="text-right">{formatMinutes(dept.regular)}</TableCell>
                          <TableCell className="text-right text-primary">{formatMinutes(dept.night)}</TableCell>
                          <TableCell className="text-right">{formatMinutes(dept.breaks)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatMinutes(dept.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

/* Sub-components */

function SummaryCard({ title, icon: Icon, current, compare }: { title: string; icon: React.ElementType; current: number; compare?: number }) {
  const diff = compare != null ? current - compare : null;
  const pct = compare && compare > 0 ? Math.round(((current - compare) / compare) * 100) : null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{formatMinutes(current)}</p>
          {diff != null && pct != null && (
            <div className={cn("flex items-center gap-1 text-xs font-medium", diff >= 0 ? "text-primary" : "text-destructive")}>
              {diff >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {diff >= 0 ? "+" : ""}{pct}% ({diff >= 0 ? "+" : ""}{formatMinutes(diff)})
            </div>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function DiffBadge({ diff, pct }: { diff: number; pct: number }) {
  const isPositive = diff >= 0;
  return (
    <Badge variant="outline" className={cn("text-xs", isPositive ? "text-primary border-primary/30" : "text-destructive border-destructive/30")}>
      {isPositive ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
      {isPositive ? "+" : ""}{pct}%
    </Badge>
  );
}

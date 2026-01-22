import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllTimeEntries } from "@/hooks/useTimeEntries";
import { useEmployees } from "@/hooks/useEmployees";
import { format, startOfMonth, endOfMonth, subMonths, differenceInMinutes } from "date-fns";
import { nb } from "date-fns/locale";
import {
  DollarSign,
  Download,
  FileSpreadsheet,
  Calendar as CalendarIcon,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Loader2,
} from "lucide-react";

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Calculate date range for selected month
  const startDate = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
  const endDate = format(endOfMonth(selectedMonth), "yyyy-MM-dd");

  // Fetch data
  const { data: timeEntries = [], isLoading: entriesLoading } = useAllTimeEntries(startDate, endDate);
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();

  const isLoading = entriesLoading || employeesLoading;

  // Filter approved entries only
  const approvedEntries = timeEntries.filter(entry => entry.status === "approved");

  // Calculate summary per employee
  const employeeSummary = useMemo(() => {
    const summary: Record<string, {
      employeeId: string;
      name: string;
      totalHours: number;
      overtimeHours: number;
      nightHours: number;
      weekendHours: number;
      entries: number;
      pendingEntries: number;
    }> = {};

    timeEntries.forEach(entry => {
      const empId = entry.employee_id;
      if (!summary[empId]) {
        summary[empId] = {
          employeeId: empId,
          name: entry.profiles?.full_name || "Ukjent",
          totalHours: 0,
          overtimeHours: 0,
          nightHours: 0,
          weekendHours: 0,
          entries: 0,
          pendingEntries: 0,
        };
      }

      if (entry.clock_in && entry.clock_out) {
        const start = new Date(entry.clock_in);
        const end = new Date(entry.clock_out);
        const hoursWorked = differenceInMinutes(end, start) / 60 - (entry.break_minutes || 0) / 60;
        
        if (entry.status === "approved") {
          summary[empId].totalHours += hoursWorked;
          summary[empId].entries += 1;

          // Rough calculation for night hours (22:00 - 06:00)
          const startHour = start.getHours();
          const endHour = end.getHours();
          if (startHour >= 22 || startHour < 6 || endHour >= 22 || endHour < 6) {
            summary[empId].nightHours += Math.min(hoursWorked, 8); // Rough estimate
          }

          // Weekend check
          const dayOfWeek = start.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            summary[empId].weekendHours += hoursWorked;
          }

          // Overtime (over 9 hours/day)
          if (hoursWorked > 9) {
            summary[empId].overtimeHours += hoursWorked - 9;
          }
        } else if (entry.status === "submitted") {
          summary[empId].pendingEntries += 1;
        }
      }
    });

    return Object.values(summary).sort((a, b) => a.name.localeCompare(b.name));
  }, [timeEntries]);

  // Stats
  const stats = useMemo(() => {
    const totalHours = employeeSummary.reduce((sum, e) => sum + e.totalHours, 0);
    const totalOvertime = employeeSummary.reduce((sum, e) => sum + e.overtimeHours, 0);
    const totalNight = employeeSummary.reduce((sum, e) => sum + e.nightHours, 0);
    const totalWeekend = employeeSummary.reduce((sum, e) => sum + e.weekendHours, 0);
    const pendingCount = employeeSummary.reduce((sum, e) => sum + e.pendingEntries, 0);

    return { totalHours, totalOvertime, totalNight, totalWeekend, pendingCount };
  }, [employeeSummary]);

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const toggleAll = () => {
    if (selectedEmployees.length === employeeSummary.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employeeSummary.map(e => e.employeeId));
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ["Ansatt", "Timer totalt", "Overtid", "Natt-timer", "Helg-timer", "Antall vakter"];
    const rows = employeeSummary
      .filter(e => selectedEmployees.length === 0 || selectedEmployees.includes(e.employeeId))
      .map(e => [
        e.name,
        e.totalHours.toFixed(2),
        e.overtimeHours.toFixed(2),
        e.nightHours.toFixed(2),
        e.weekendHours.toFixed(2),
        e.entries.toString(),
      ]);

    const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lonnskjoring-${format(selectedMonth, "yyyy-MM")}.csv`;
    link.click();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 pl-12 sm:flex-row sm:items-center sm:justify-between lg:pl-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="h-8 w-8" />
              Lønnskjøring
            </h1>
            <p className="text-muted-foreground">
              Oversikt og eksport av arbeidstimer for lønn
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(selectedMonth, "MMMM yyyy", { locale: nb })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedMonth}
                  onSelect={(date) => date && setSelectedMonth(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Totalt timer</p>
                  <p className="text-xl font-bold text-foreground">
                    {stats.totalHours.toFixed(1)}t
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <TrendingUp className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Overtid</p>
                  <p className="text-xl font-bold text-foreground">
                    {stats.totalOvertime.toFixed(1)}t
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-night/10">
                  <Clock className="h-5 w-5 text-night" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Natt-timer</p>
                  <p className="text-xl font-bold text-foreground">
                    {stats.totalNight.toFixed(1)}t
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <CalendarIcon className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Helg-timer</p>
                  <p className="text-xl font-bold text-foreground">
                    {stats.totalWeekend.toFixed(1)}t
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Venter godkjenning</p>
                  <p className="text-xl font-bold text-foreground">
                    {stats.pendingCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Timesammendrag per ansatt</CardTitle>
              <CardDescription>
                {format(selectedMonth, "MMMM yyyy", { locale: nb })} • Kun godkjente timelister
              </CardDescription>
            </div>
            <Button onClick={handleExport} disabled={employeeSummary.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Eksporter til CSV
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : employeeSummary.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen godkjente timelister for denne perioden</p>
                <p className="text-sm mt-1">
                  Godkjente timelister vises her for eksport til lønn
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedEmployees.length === employeeSummary.length}
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead>Ansatt</TableHead>
                      <TableHead className="text-right">Timer totalt</TableHead>
                      <TableHead className="text-right">Overtid</TableHead>
                      <TableHead className="text-right">Natt-timer</TableHead>
                      <TableHead className="text-right">Helg-timer</TableHead>
                      <TableHead className="text-right">Vakter</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeSummary.map((emp) => (
                      <TableRow key={emp.employeeId}>
                        <TableCell>
                          <Checkbox
                            checked={selectedEmployees.includes(emp.employeeId)}
                            onCheckedChange={() => toggleEmployee(emp.employeeId)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell className="text-right">{emp.totalHours.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {emp.overtimeHours > 0 ? (
                            <Badge variant="secondary" className="bg-warning/10 text-warning">
                              {emp.overtimeHours.toFixed(2)}
                            </Badge>
                          ) : (
                            "0.00"
                          )}
                        </TableCell>
                        <TableCell className="text-right">{emp.nightHours.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{emp.weekendHours.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{emp.entries}</TableCell>
                        <TableCell className="text-right">
                          {emp.pendingEntries > 0 ? (
                            <Badge variant="outline" className="border-warning text-warning">
                              {emp.pendingEntries} venter
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-success">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Klar
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Eksporter til lønnssystem</p>
                <p className="text-muted-foreground mt-1">
                  CSV-filen kan importeres direkte i de fleste lønnssystemer som Tripletex, Visma, og SAP.
                  Sørg for at alle timelister er godkjent før eksport.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

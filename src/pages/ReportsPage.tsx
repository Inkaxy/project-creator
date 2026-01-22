import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllTimeEntries } from "@/hooks/useTimeEntries";
import { useDeviationStats } from "@/hooks/useDeviations";
import { useEmployees, useDepartments } from "@/hooks/useEmployees";
import { useAbsenceRequests } from "@/hooks/useAbsenceRequests";
import { format, startOfMonth, endOfMonth, subMonths, differenceInMinutes, eachDayOfInterval, getDay } from "date-fns";
import { nb } from "date-fns/locale";
import {
  BarChart3,
  Download,
  Calendar as CalendarIcon,
  Clock,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Shield,
  Flame,
  ClipboardCheck,
  FileText,
  PieChart,
  Activity,
} from "lucide-react";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  // Calculate date range
  const startDate = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
  const endDate = format(endOfMonth(selectedMonth), "yyyy-MM-dd");

  // Fetch data
  const { data: timeEntries = [], isLoading: entriesLoading } = useAllTimeEntries(startDate, endDate);
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: departments = [] } = useDepartments();
  const { data: deviationStats } = useDeviationStats();
  const { data: absenceRequests = [] } = useAbsenceRequests();

  const isLoading = entriesLoading || employeesLoading;

  // Calculate work hours statistics
  const workStats = useMemo(() => {
    const approved = timeEntries.filter(e => e.status === "approved");
    let totalHours = 0;
    let totalOvertime = 0;
    let lateArrivals = 0;
    let earlyDepartures = 0;

    approved.forEach(entry => {
      if (entry.clock_in && entry.clock_out) {
        const start = new Date(entry.clock_in);
        const end = new Date(entry.clock_out);
        const hours = differenceInMinutes(end, start) / 60 - (entry.break_minutes || 0) / 60;
        totalHours += hours;

        if (hours > 9) {
          totalOvertime += hours - 9;
        }

        // Check for deviations
        if (entry.shifts?.planned_start) {
          const plannedStart = new Date(`${entry.date}T${entry.shifts.planned_start}`);
          if (start > plannedStart && differenceInMinutes(start, plannedStart) > 5) {
            lateArrivals++;
          }
        }
      }
    });

    const avgHoursPerEntry = approved.length > 0 ? totalHours / approved.length : 0;

    return {
      totalHours,
      totalOvertime,
      avgHoursPerEntry,
      lateArrivals,
      earlyDepartures,
      totalEntries: approved.length,
    };
  }, [timeEntries]);

  // Absence statistics
  const absenceStats = useMemo(() => {
    const monthAbsences = absenceRequests.filter(a => {
      const absenceDate = new Date(a.start_date);
      return absenceDate >= startOfMonth(selectedMonth) && absenceDate <= endOfMonth(selectedMonth);
    });

    const byType: Record<string, number> = {};
    monthAbsences.forEach(a => {
      const typeName = a.absence_types?.name || "Annet";
      byType[typeName] = (byType[typeName] || 0) + a.total_days;
    });

    const totalDays = Object.values(byType).reduce((sum, days) => sum + days, 0);

    return { byType, totalDays, count: monthAbsences.length };
  }, [absenceRequests, selectedMonth]);

  // Compliance score calculation
  const complianceScore = useMemo(() => {
    let score = 100;
    
    // Deduct for open deviations
    const openDeviations = deviationStats?.byStatus?.open || 0;
    score -= openDeviations * 5;

    // Deduct for late arrivals
    score -= Math.min(workStats.lateArrivals * 2, 20);

    // Deduct for pending time entries
    const pending = timeEntries.filter(e => e.status === "submitted").length;
    score -= Math.min(pending, 10);

    return Math.max(0, Math.min(100, score));
  }, [deviationStats, workStats, timeEntries]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Utmerket";
    if (score >= 80) return "Bra";
    if (score >= 60) return "Akseptabelt";
    return "Trenger forbedring";
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 pl-12 sm:flex-row sm:items-center sm:justify-between lg:pl-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Rapporter
            </h1>
            <p className="text-muted-foreground">
              Statistikk og analyser for virksomheten
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alle avdelinger" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle avdelinger</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Oversikt</span>
            </TabsTrigger>
            <TabsTrigger value="hours" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Arbeidstid</span>
            </TabsTrigger>
            <TabsTrigger value="absence" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Fravær</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Compliance</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Timer denne måneden</p>
                      <p className="text-xl font-bold text-foreground">
                        {workStats.totalHours.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                      <Users className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Aktive ansatte</p>
                      <p className="text-xl font-bold text-foreground">
                        {employees.filter(e => e.is_active).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                      <CalendarIcon className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fraværsdager</p>
                      <p className="text-xl font-bold text-foreground">
                        {absenceStats.totalDays.toFixed(0)}
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
                      <p className="text-xs text-muted-foreground">Åpne avvik</p>
                      <p className="text-xl font-bold text-foreground">
                        {deviationStats?.byStatus?.open || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Score Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Compliance Score
                </CardTitle>
                <CardDescription>
                  Overordnet etterlevelsesgrad for {format(selectedMonth, "MMMM yyyy", { locale: nb })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className={`text-5xl font-bold ${getScoreColor(complianceScore)}`}>
                      {complianceScore}
                    </div>
                    <div className="text-sm text-muted-foreground">av 100</div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${getScoreColor(complianceScore)}`}>
                        {getScoreLabel(complianceScore)}
                      </span>
                    </div>
                    <Progress value={complianceScore} className="h-3" />
                    <p className="text-sm text-muted-foreground">
                      Basert på avvik, timelister og fremmøte
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Arbeidstidssammendrag</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Totalt arbeidet</span>
                    <span className="font-medium">{workStats.totalHours.toFixed(1)} timer</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Overtid</span>
                    <span className="font-medium text-warning">{workStats.totalOvertime.toFixed(1)} timer</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Snitt per vakt</span>
                    <span className="font-medium">{workStats.avgHoursPerEntry.toFixed(1)} timer</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Antall vakter</span>
                    <span className="font-medium">{workStats.totalEntries}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fraværsfordeling</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(absenceStats.byType).length > 0 ? (
                    Object.entries(absenceStats.byType).map(([type, days]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{type}</span>
                        <Badge variant="secondary">{days} dager</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Ingen registrert fravær denne måneden
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Hours Tab */}
          <TabsContent value="hours">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Arbeidstidsstatistikk
                </CardTitle>
                <CardDescription>
                  Detaljert oversikt over arbeidstimer for {format(selectedMonth, "MMMM yyyy", { locale: nb })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">Totalt arbeidet</span>
                    </div>
                    <p className="text-3xl font-bold">{workStats.totalHours.toFixed(1)}t</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {workStats.totalEntries} registrerte vakter
                    </p>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-warning" />
                      <span className="font-medium">Overtid</span>
                    </div>
                    <p className="text-3xl font-bold text-warning">{workStats.totalOvertime.toFixed(1)}t</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Timer over 9t/dag
                    </p>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-success" />
                      <span className="font-medium">Snitt per vakt</span>
                    </div>
                    <p className="text-3xl font-bold">{workStats.avgHoursPerEntry.toFixed(1)}t</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Gjennomsnittlig arbeidstid
                    </p>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      <span className="font-medium">Sent fremmøte</span>
                    </div>
                    <p className="text-3xl font-bold text-destructive">{workStats.lateArrivals}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Registrerte forsinkelser
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Absence Tab */}
          <TabsContent value="absence">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Fraværsrapport
                </CardTitle>
                <CardDescription>
                  Fravær for {format(selectedMonth, "MMMM yyyy", { locale: nb })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="font-medium">Fordeling per type</h3>
                    {Object.entries(absenceStats.byType).length > 0 ? (
                      Object.entries(absenceStats.byType).map(([type, days]) => {
                        const percentage = absenceStats.totalDays > 0 
                          ? (days / absenceStats.totalDays) * 100 
                          : 0;
                        return (
                          <div key={type} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>{type}</span>
                              <span className="font-medium">{days} dager</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground">Ingen fravær registrert</p>
                    )}
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <h3 className="font-medium mb-4">Sammendrag</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Totalt fravær</span>
                        <span className="font-bold text-xl">{absenceStats.totalDays} dager</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Antall søknader</span>
                        <span className="font-medium">{absenceStats.count}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Snitt per søknad</span>
                        <span className="font-medium">
                          {absenceStats.count > 0 
                            ? (absenceStats.totalDays / absenceStats.count).toFixed(1) 
                            : 0} dager
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Compliance Oversikt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-4">
                    <div className={`text-6xl font-bold ${getScoreColor(complianceScore)}`}>
                      {complianceScore}%
                    </div>
                    <p className={`text-lg font-medium mt-2 ${getScoreColor(complianceScore)}`}>
                      {getScoreLabel(complianceScore)}
                    </p>
                  </div>
                  <Progress value={complianceScore} className="h-4" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    Avviksstatus
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Åpne avvik</span>
                    <Badge variant="destructive">{deviationStats?.byStatus?.open || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Under behandling</span>
                    <Badge variant="secondary">{deviationStats?.byStatus?.in_progress || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lukket</span>
                    <Badge variant="default" className="bg-success">{deviationStats?.byStatus?.closed || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-medium">Totalt</span>
                    <span className="font-bold">{deviationStats?.total || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    Internkontroll-status
                  </CardTitle>
                  <CardDescription>
                    Oversikt over dokumentasjon og etterlevelse
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-border p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="font-medium">HMS</p>
                      <Badge variant="default" className="mt-2 bg-success">Oppdatert</Badge>
                    </div>
                    <div className="rounded-lg border border-border p-4 text-center">
                      <Flame className="h-8 w-8 mx-auto mb-2 text-destructive" />
                      <p className="font-medium">Brannvern</p>
                      <Badge variant="default" className="mt-2 bg-success">Oppdatert</Badge>
                    </div>
                    <div className="rounded-lg border border-border p-4 text-center">
                      <ClipboardCheck className="h-8 w-8 mx-auto mb-2 text-success" />
                      <p className="font-medium">IK-Mat</p>
                      <Badge variant="default" className="mt-2 bg-success">Oppdatert</Badge>
                    </div>
                    <div className="rounded-lg border border-border p-4 text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="font-medium">Opplæring</p>
                      <Badge variant="secondary" className="mt-2">3 utløper snart</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

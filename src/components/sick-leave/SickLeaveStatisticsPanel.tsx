import { useMemo } from "react";
import { format, subMonths, differenceInDays } from "date-fns";
import { nb } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSickLeaves } from "@/hooks/useSickLeave";

export function SickLeaveStatisticsPanel() {
  const { data: allSickLeaves = [], isLoading } = useSickLeaves();

  const statistics = useMemo(() => {
    const now = new Date();
    const oneYearAgo = subMonths(now, 12);
    
    // Filtrer sykefravær siste 12 måneder
    const recentSickLeaves = allSickLeaves.filter(
      sl => new Date(sl.start_date) >= oneYearAgo
    );

    // Tell totale fraværsdager
    const totalDays = recentSickLeaves.reduce((acc, sl) => {
      const end = sl.end_date ? new Date(sl.end_date) : new Date();
      const start = new Date(sl.start_date);
      return acc + differenceInDays(end, start) + 1;
    }, 0);

    // Fordeling per type
    const typeBreakdown = recentSickLeaves.reduce((acc, sl) => {
      acc[sl.leave_type] = (acc[sl.leave_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Antall aktive
    const activeSickLeaves = allSickLeaves.filter(sl => sl.status === "active");
    
    // Gjennomsnittlig varighet
    const completedLeaves = recentSickLeaves.filter(sl => sl.status === "completed" && sl.end_date);
    const avgDuration = completedLeaves.length > 0
      ? completedLeaves.reduce((acc, sl) => {
          const days = differenceInDays(new Date(sl.end_date!), new Date(sl.start_date)) + 1;
          return acc + days;
        }, 0) / completedLeaves.length
      : 0;

    // Månedlig oversikt
    const monthlyData: { month: string; count: number; days: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = subMonths(now, i);
      const monthName = format(monthStart, "MMM", { locale: nb });
      const monthSickLeaves = recentSickLeaves.filter(sl => {
        const slMonth = new Date(sl.start_date).getMonth();
        const slYear = new Date(sl.start_date).getFullYear();
        return slMonth === monthStart.getMonth() && slYear === monthStart.getFullYear();
      });
      
      monthlyData.push({
        month: monthName,
        count: monthSickLeaves.length,
        days: monthSickLeaves.reduce((acc, sl) => {
          const end = sl.end_date ? new Date(sl.end_date) : new Date();
          const start = new Date(sl.start_date);
          return acc + differenceInDays(end, start) + 1;
        }, 0),
      });
    }

    // Oppfølgingsstatistikk
    const followUpStats = {
      planOnTime: recentSickLeaves.filter(sl => 
        sl.follow_up_plan_completed_at && 
        new Date(sl.follow_up_plan_completed_at) <= new Date(sl.follow_up_plan_due)
      ).length,
      planTotal: recentSickLeaves.filter(sl => sl.follow_up_plan_completed_at).length,
      meeting1OnTime: recentSickLeaves.filter(sl => 
        sl.dialogue_meeting_1_completed_at && 
        new Date(sl.dialogue_meeting_1_completed_at) <= new Date(sl.dialogue_meeting_1_due)
      ).length,
      meeting1Total: recentSickLeaves.filter(sl => sl.dialogue_meeting_1_completed_at).length,
    };

    return {
      totalSickLeaves: recentSickLeaves.length,
      totalDays,
      activeSickLeaves: activeSickLeaves.length,
      avgDuration: Math.round(avgDuration * 10) / 10,
      typeBreakdown,
      monthlyData,
      followUpStats,
    };
  }, [allSickLeaves]);

  const pieData = [
    { name: "Egenmelding", value: statistics.typeBreakdown.egenmelding || 0, color: "hsl(var(--primary))" },
    { name: "Sykemelding", value: statistics.typeBreakdown.sykemelding || 0, color: "hsl(var(--destructive))" },
    { name: "Gradert", value: statistics.typeBreakdown.gradert_sykemelding || 0, color: "hsl(var(--secondary))" },
    { name: "Arbeidsrelatert", value: statistics.typeBreakdown.arbeidsrelatert_sykdom || 0, color: "hsl(var(--accent))" },
  ].filter(d => d.value > 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Laster statistikk...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Nøkkeltall */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sykefravær (12 mnd)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalSickLeaves}</div>
            <p className="text-xs text-muted-foreground">registreringer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totalt fraværsdager
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalDays}</div>
            <p className="text-xs text-muted-foreground">siste 12 måneder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Snitt varighet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.avgDuration}</div>
            <p className="text-xs text-muted-foreground">dager per fravær</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktive nå
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.activeSickLeaves}</div>
            <p className="text-xs text-muted-foreground">pågående sykefravær</p>
          </CardContent>
        </Card>
      </div>

      {/* Grafer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Månedlig oversikt */}
        <Card>
          <CardHeader>
            <CardTitle>Månedlig oversikt</CardTitle>
            <CardDescription>Antall sykefravær per måned siste 12 måneder</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statistics.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Antall" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fordeling per type */}
        <Card>
          <CardHeader>
            <CardTitle>Fordeling per type</CardTitle>
            <CardDescription>Sykefraværstyper siste 12 måneder</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Ingen data å vise
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Oppfølgingsstatistikk */}
      <Card>
        <CardHeader>
          <CardTitle>Oppfølging</CardTitle>
          <CardDescription>Andel oppfølgingsaktiviteter gjennomført innen frist</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Oppfølgingsplaner innen frist</span>
              <span className="font-medium">
                {statistics.followUpStats.planTotal > 0 
                  ? Math.round((statistics.followUpStats.planOnTime / statistics.followUpStats.planTotal) * 100)
                  : 0}%
              </span>
            </div>
            <Progress 
              value={statistics.followUpStats.planTotal > 0 
                ? (statistics.followUpStats.planOnTime / statistics.followUpStats.planTotal) * 100 
                : 0} 
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Dialogmøte 1 innen frist</span>
              <span className="font-medium">
                {statistics.followUpStats.meeting1Total > 0 
                  ? Math.round((statistics.followUpStats.meeting1OnTime / statistics.followUpStats.meeting1Total) * 100)
                  : 0}%
              </span>
            </div>
            <Progress 
              value={statistics.followUpStats.meeting1Total > 0 
                ? (statistics.followUpStats.meeting1OnTime / statistics.followUpStats.meeting1Total) * 100 
                : 0} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

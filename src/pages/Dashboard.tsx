import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { StatusBadge } from "@/components/ui/status-badge";
import { PendingWageAdjustmentsWidget } from "@/components/dashboard/PendingWageAdjustmentsWidget";
import { employees, pendingApprovals, shifts } from "@/data/mockData";
import { useWageAdjustments } from "@/hooks/useWageAdjustments";
import {
  Users,
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  CalendarClock,
  DollarSign,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const activeEmployees = employees.filter((e) => e.status === "active").length;
  const todayShifts = shifts.filter((s) => s.date === "2026-01-19");
  const openShifts = shifts.filter((s) => s.status === "open").length;
  const { data: pendingWageAdjustments = [] } = useWageAdjustments("pending");

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="pl-12 lg:pl-0">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Oversikt over Bakeri Sentrum • Søndag 19. januar 2026
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Ansatte i dag"
            value={todayShifts.filter((s) => s.employeeId).length}
            subtitle={`av ${activeEmployees} aktive`}
            icon={Users}
            variant="primary"
          />
          <StatCard
            title="Venter godkjenning"
            value={pendingApprovals.length}
            subtitle="fraværssøknader & bytter"
            icon={CheckCircle}
            variant="warning"
          />
          <StatCard
            title="Etterbetalinger"
            value={pendingWageAdjustments.length}
            subtitle="ventende godkjenning"
            icon={DollarSign}
            variant={pendingWageAdjustments.length > 0 ? "warning" : "default"}
          />
          <StatCard
            title="Ledige vakter"
            value={openShifts}
            subtitle="denne uken"
            icon={CalendarClock}
            variant="default"
          />
          <StatCard
            title="Timer i dag"
            value="32.5"
            subtitle="planlagte timer"
            icon={Clock}
            trend={{ value: 5, isPositive: true }}
            variant="success"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Today's Shifts */}
          <Card className="lg:col-span-2 lg:row-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Dagens vakter
                </CardTitle>
                <CardDescription>Søndag 19. januar 2026</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/vaktplan">
                  Se vaktplan <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      {shift.employeeName ? (
                        <AvatarWithInitials name={shift.employeeName} size="md" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">
                          {shift.employeeName || "Ledig vakt"}
                        </p>
                        <p className="text-sm text-muted-foreground">{shift.function}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-foreground">
                          {shift.startTime} - {shift.endTime}
                        </p>
                        {shift.isNight && (
                          <Badge variant="destructive" className="mt-1">
                            Nattskift
                          </Badge>
                        )}
                        {shift.status === "open" && (
                          <Badge variant="outline" className="mt-1 border-primary text-primary">
                            Ledig
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-warning" />
                Venter godkjenning
              </CardTitle>
              <CardDescription>{pendingApprovals.length} forespørsler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingApprovals.map((approval) => (
                  <div
                    key={approval.id}
                    className="rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start gap-3">
                      <AvatarWithInitials name={approval.employeeName} size="sm" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {approval.employeeName}
                        </p>
                        <p className="text-xs text-muted-foreground">{approval.description}</p>
                        <StatusBadge status="pending" label="Venter" />
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" className="flex-1">
                        Godkjenn
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Avslå
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="mt-4 w-full" asChild>
                <Link to="/godkjenninger">
                  Se alle godkjenninger <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Pending Wage Adjustments Widget */}
          <PendingWageAdjustmentsWidget />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Hurtighandlinger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
                <Link to="/ansatte">
                  <Users className="h-6 w-6 text-primary" />
                  <span>Legg til ansatt</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
                <Link to="/vaktplan">
                  <Calendar className="h-6 w-6 text-primary" />
                  <span>Opprett vakt</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
                <Link to="/timelister">
                  <Clock className="h-6 w-6 text-primary" />
                  <span>Se timelister</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
                <Link to="/meld-avvik">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                  <span>Meld avvik</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

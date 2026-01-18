import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { StatusBadge } from "@/components/ui/status-badge";
import { ClockInOutCard } from "@/components/timesheet/ClockInOutCard";
import { ClockHistoryCard } from "@/components/timesheet/ClockHistoryCard";
import { useAuth } from "@/contexts/AuthContext";
import { useShifts } from "@/hooks/useShifts";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import { nb } from "date-fns/locale";
import {
  Clock,
  Calendar,
  FileText,
  GraduationCap,
  TrendingUp,
  Wallet,
  Sun,
  Moon,
  Target,
  Award,
} from "lucide-react";

export default function MyPage() {
  const { user, profile } = useAuth();
  
  // Get upcoming shifts for the user
  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const nextWeekEnd = format(endOfWeek(addDays(today, 7), { weekStartsOn: 1 }), "yyyy-MM-dd");
  
  const { data: shifts } = useShifts(weekStart, nextWeekEnd);
  const userShifts = shifts?.filter((s) => s.employee_id === user?.id) || [];
  const upcomingShifts = userShifts
    .filter((s) => new Date(s.date) >= today)
    .slice(0, 3);

  // Mock additional user data (would come from profile in production)
  const userData = {
    hoursThisWeek: 32,
    hoursPlanned: 40,
    timeAccount: 12.5,
    nightAccount: 3,
    vacationDays: 18,
    seniority: {
      currentLevel: 2,
      currentHours: 3200,
      nextLevelHours: 3900,
      hourlyRate: 220,
      nextHourlyRate: 230,
    },
  };

  const courses = [
    { name: "Brannvern grunnkurs", status: "completed", date: "2025-12-15" },
    { name: "IK-Mat hygiene", status: "in_progress", progress: 60 },
    { name: "Førstehjelpskurs", status: "required", dueDate: "2026-02-01" },
  ];

  const seniorityProgress =
    ((userData.seniority.currentHours - 1950) / (userData.seniority.nextLevelHours - 1950)) * 100;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 pl-12 sm:flex-row sm:items-start sm:justify-between lg:pl-0">
          <div className="flex items-center gap-4">
            <AvatarWithInitials name={profile?.full_name || "Bruker"} size="lg" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">{profile?.full_name || "Bruker"}</h1>
              <p className="text-muted-foreground">
                {profile?.employee_type || "Ansatt"}
              </p>
              <StatusBadge status="active" className="mt-2" />
            </div>
          </div>
        </div>

        {/* Clock In/Out Card - Functional! */}
        <ClockInOutCard />

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Timer denne uken</p>
                  <p className="text-xl font-bold text-foreground">
                    {userData.hoursThisWeek}/{userData.hoursPlanned}t
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-light">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tidskonto</p>
                  <p className="text-xl font-bold text-foreground">+{userData.timeAccount}t</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-night-light">
                  <Moon className="h-5 w-5 text-night" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Natt-konto</p>
                  <p className="text-xl font-bold text-foreground">+{userData.nightAccount}t</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-light">
                  <Calendar className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Feriedager</p>
                  <p className="text-xl font-bold text-foreground">{userData.vacationDays} dager</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Clock History - Real data! */}
          <div className="lg:col-span-2">
            <ClockHistoryCard />
          </div>

          {/* Seniority / Gamification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Din ansiennitet
              </CardTitle>
              <CardDescription>Nivå {userData.seniority.currentLevel}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fremgang til Nivå 3</span>
                  <span className="font-medium text-foreground">
                    {userData.seniority.currentHours}/{userData.seniority.nextLevelHours}t
                  </span>
                </div>
                <Progress value={seniorityProgress} className="h-3" />
              </div>

              <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Target className="h-4 w-4" />
                  <span className="font-medium">
                    {userData.seniority.nextLevelHours - userData.seniority.currentHours} timer til Nivå 3!
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">📅 Estimert: April 2026</p>
                <p className="text-sm text-muted-foreground">
                  💰 = +{userData.seniority.nextHourlyRate - userData.seniority.hourlyRate} kr/time
                </p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Nåværende timelønn</span>
                <span className="text-lg font-bold text-foreground">
                  {userData.seniority.hourlyRate} kr/t
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Shifts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Kommende vakter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingShifts.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Ingen planlagte vakter
              </p>
            ) : (
              upcomingShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        shift.is_night_shift ? "bg-night-light" : "bg-primary-light"
                      }`}
                    >
                      {shift.is_night_shift ? (
                        <Moon className="h-5 w-5 text-night" />
                      ) : (
                        <Sun className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{shift.functions?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(shift.date), "EEEE d. MMMM", { locale: nb })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={shift.is_night_shift ? "destructive" : "default"}>
                    {shift.planned_start} - {shift.planned_end}
                  </Badge>
                </div>
              ))
            )}
            <Button variant="outline" className="w-full" asChild>
              <a href="/schedule">Se hele vaktplanen</a>
            </Button>
          </CardContent>
        </Card>

        {/* Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Mine kurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {courses.map((course, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border p-4 transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <h4 className="font-medium text-foreground">{course.name}</h4>
                    {course.status === "completed" && (
                      <Badge variant="default" className="bg-success">
                        Fullført
                      </Badge>
                    )}
                    {course.status === "in_progress" && (
                      <Badge variant="secondary">Pågående</Badge>
                    )}
                    {course.status === "required" && (
                      <Badge variant="outline" className="border-warning text-warning">
                        Påkrevd
                      </Badge>
                    )}
                  </div>
                  {course.progress !== undefined && (
                    <div className="space-y-1">
                      <Progress value={course.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">{course.progress}% fullført</p>
                    </div>
                  )}
                  {course.date && (
                    <p className="text-sm text-muted-foreground">
                      Fullført{" "}
                      {new Date(course.date).toLocaleDateString("nb-NO", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  {course.dueDate && (
                    <p className="text-sm text-warning">
                      Frist:{" "}
                      {new Date(course.dueDate).toLocaleDateString("nb-NO", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="h-auto flex-col gap-2 p-4">
            <Calendar className="h-6 w-6 text-primary" />
            <span>Søk om fravær</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 p-4">
            <Clock className="h-6 w-6 text-primary" />
            <span>Be om vaktbytte</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 p-4">
            <FileText className="h-6 w-6 text-primary" />
            <span>Se lønnsslipp</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 p-4">
            <Wallet className="h-6 w-6 text-primary" />
            <span>Mine kontoer</span>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}

import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  Calendar,
  FileText,
  GraduationCap,
  TrendingUp,
  Wallet,
  PlayCircle,
  PauseCircle,
  LogOut,
  Sun,
  Moon,
  Target,
  Award,
} from "lucide-react";

export default function MyPage() {
  // Mock user data
  const user = {
    name: "Maria Hansen",
    role: "Baker",
    department: "Produksjon",
    status: "active" as const,
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

  const todayShift = {
    function: "Stek Natt",
    time: "01:30 - 09:00",
    isNight: true,
    status: "planned",
  };

  const upcomingShifts = [
    { date: "Man 20. jan", function: "Baker", time: "06:00 - 14:00", isNight: false },
    { date: "Tir 21. jan", function: "Stek Natt", time: "01:30 - 09:00", isNight: true },
    { date: "Ons 22. jan", function: "Vekkgjøring", time: "04:00 - 12:00", isNight: true },
  ];

  const courses = [
    { name: "Brannvern grunnkurs", status: "completed", date: "2025-12-15" },
    { name: "IK-Mat hygiene", status: "in_progress", progress: 60 },
    { name: "Førstehjelpskurs", status: "required", dueDate: "2026-02-01" },
  ];

  const seniorityProgress =
    ((user.seniority.currentHours - 1950) / (user.seniority.nextLevelHours - 1950)) * 100;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 pl-12 sm:flex-row sm:items-start sm:justify-between lg:pl-0">
          <div className="flex items-center gap-4">
            <AvatarWithInitials name={user.name} size="lg" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">{user.name}</h1>
              <p className="text-muted-foreground">
                {user.role} • {user.department}
              </p>
              <StatusBadge status={user.status} className="mt-2" />
            </div>
          </div>
        </div>

        {/* Today's Shift / Clock In */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary-light to-background">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  {todayShift.isNight ? (
                    <Moon className="h-7 w-7 text-primary" />
                  ) : (
                    <Sun className="h-7 w-7 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dagens vakt</p>
                  <p className="text-xl font-semibold text-foreground">{todayShift.function}</p>
                  <p className="text-muted-foreground">{todayShift.time}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="lg" className="gap-2">
                  <PlayCircle className="h-5 w-5" />
                  Stemple inn
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
                    {user.hoursThisWeek}/{user.hoursPlanned}t
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
                  <p className="text-xl font-bold text-foreground">+{user.timeAccount}t</p>
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
                  <p className="text-xl font-bold text-foreground">+{user.nightAccount}t</p>
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
                  <p className="text-xl font-bold text-foreground">{user.vacationDays} dager</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Upcoming Shifts */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Kommende vakter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingShifts.map((shift, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        shift.isNight ? "bg-night-light" : "bg-primary-light"
                      }`}
                    >
                      {shift.isNight ? (
                        <Moon className={`h-5 w-5 text-night`} />
                      ) : (
                        <Sun className={`h-5 w-5 text-primary`} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{shift.function}</p>
                      <p className="text-sm text-muted-foreground">{shift.date}</p>
                    </div>
                  </div>
                  <Badge variant={shift.isNight ? "destructive" : "default"}>
                    {shift.time}
                  </Badge>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                Se hele vaktplanen
              </Button>
            </CardContent>
          </Card>

          {/* Seniority / Gamification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Din ansiennitet
              </CardTitle>
              <CardDescription>Nivå {user.seniority.currentLevel} - Faglært Baker</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fremgang til Nivå 3</span>
                  <span className="font-medium text-foreground">
                    {user.seniority.currentHours}/{user.seniority.nextLevelHours}t
                  </span>
                </div>
                <Progress value={seniorityProgress} className="h-3" />
              </div>

              <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Target className="h-4 w-4" />
                  <span className="font-medium">
                    {user.seniority.nextLevelHours - user.seniority.currentHours} timer til Nivå 3!
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">📅 Estimert: April 2026</p>
                <p className="text-sm text-muted-foreground">
                  💰 = +{user.seniority.nextHourlyRate - user.seniority.hourlyRate} kr/time (ca. 1400
                  kr/mnd)
                </p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Nåværende timelønn</span>
                <span className="text-lg font-bold text-foreground">
                  {user.seniority.hourlyRate} kr/t
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

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

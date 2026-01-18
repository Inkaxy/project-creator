import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { shifts, functions } from "@/data/mockData";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Users,
  Clock,
  DollarSign,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 19)); // Jan 19, 2026
  const [viewType, setViewType] = useState<"day" | "week" | "month">("week");

  // Generate week days
  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };

  const weekDays = getWeekDays(currentDate);
  const dayNames = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getShiftsForDay = (date: Date) => {
    return shifts.filter((shift) => shift.date === formatDate(date));
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date(2026, 0, 19)); // Demo date
  };

  // Calculate daily stats
  const calculateDayStats = (date: Date) => {
    const dayShifts = getShiftsForDay(date);
    const hours = dayShifts.reduce((acc, shift) => {
      const [startH, startM] = shift.startTime.split(":").map(Number);
      const [endH, endM] = shift.endTime.split(":").map(Number);
      let duration = (endH * 60 + endM - startH * 60 - startM) / 60;
      if (duration < 0) duration += 24; // Overnight shift
      return acc + duration;
    }, 0);
    return {
      hours: hours.toFixed(1),
      salary: Math.round(hours * 250), // Average hourly rate
      shifts: dayShifts.length,
    };
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 pl-12 sm:flex-row sm:items-center sm:justify-between lg:pl-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vaktplan</h1>
            <p className="text-muted-foreground">Produksjon & Butikk</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ny vakt
            </Button>
          </div>
        </div>

        {/* Navigation & View Toggle */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={goToToday}>
              I dag
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="ml-2 text-lg font-semibold text-foreground">
              Uke {Math.ceil((currentDate.getDate() + new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()) / 7)},{" "}
              {currentDate.toLocaleDateString("nb-NO", { month: "long", year: "numeric" })}
            </span>
          </div>
          <div className="flex rounded-lg border border-border bg-muted p-1">
            {(["day", "week", "month"] as const).map((type) => (
              <Button
                key={type}
                variant={viewType === type ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewType(type)}
                className={cn(
                  "px-4",
                  viewType === type && "shadow-sm"
                )}
              >
                {type === "day" ? "Dag" : type === "week" ? "Uke" : "Måned"}
              </Button>
            ))}
          </div>
        </div>

        {/* Published Status */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary text-primary">
            <CalendarDays className="mr-1 h-3 w-3" />
            Publisert t.o.m. 26. januar
          </Badge>
        </div>

        {/* Schedule Grid */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {/* Day Headers */}
              <div className="grid min-w-[800px] grid-cols-[200px_repeat(7,1fr)] border-b border-border">
                <div className="border-r border-border bg-muted/50 p-3">
                  <span className="text-sm font-medium text-muted-foreground">Funksjon</span>
                </div>
                {weekDays.map((day, i) => {
                  const isToday = formatDate(day) === "2026-01-19";
                  const stats = calculateDayStats(day);
                  return (
                    <div
                      key={i}
                      className={cn(
                        "border-r border-border p-3 last:border-r-0",
                        isToday && "bg-primary-light"
                      )}
                    >
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">{dayNames[i]}</p>
                        <p
                          className={cn(
                            "text-lg font-semibold",
                            isToday ? "text-primary" : "text-foreground"
                          )}
                        >
                          {day.getDate()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Function Rows */}
              {functions.slice(0, 6).map((func) => (
                <div
                  key={func.id}
                  className="grid min-w-[800px] grid-cols-[200px_repeat(7,1fr)] border-b border-border last:border-b-0"
                >
                  {/* Function Name */}
                  <div className="flex items-center border-r border-border bg-muted/30 p-3">
                    <span className="text-sm font-medium text-foreground">{func.name}</span>
                  </div>

                  {/* Day Cells */}
                  {weekDays.map((day, i) => {
                    const dayShifts = getShiftsForDay(day).filter(
                      (s) => s.function === func.name
                    );
                    const isToday = formatDate(day) === "2026-01-19";

                    return (
                      <div
                        key={i}
                        className={cn(
                          "min-h-[80px] border-r border-border p-2 last:border-r-0",
                          isToday && "bg-primary-light/30"
                        )}
                      >
                        {dayShifts.map((shift) => (
                          <div
                            key={shift.id}
                            className={cn(
                              "mb-1 cursor-pointer rounded-lg p-2 text-xs transition-all hover:scale-[1.02]",
                              shift.status === "open"
                                ? "border-2 border-dashed border-primary bg-primary-light"
                                : shift.isNight
                                ? "bg-night-light text-night"
                                : "bg-primary-light text-primary"
                            )}
                          >
                            {shift.employeeName ? (
                              <div className="flex items-center gap-2">
                                <AvatarWithInitials name={shift.employeeName} size="sm" />
                                <div>
                                  <p className="font-medium">
                                    {shift.employeeName.split(" ")[0]}
                                  </p>
                                  <p className="opacity-80">
                                    {shift.startTime}-{shift.endTime}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span className="font-medium">Ledig vakt</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Summary Row */}
              <div className="grid min-w-[800px] grid-cols-[200px_repeat(7,1fr)] bg-muted/50">
                <div className="border-r border-border p-3">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    Dagstotaler
                  </span>
                </div>
                {weekDays.map((day, i) => {
                  const stats = calculateDayStats(day);
                  const isToday = formatDate(day) === "2026-01-19";
                  return (
                    <div
                      key={i}
                      className={cn(
                        "border-r border-border p-2 text-xs last:border-r-0",
                        isToday && "bg-primary-light/50"
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{stats.hours}t</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          <span>{stats.salary.toLocaleString("nb-NO")} kr</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-primary-light" />
            <span className="text-sm text-muted-foreground">Dagskift</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-night-light" />
            <span className="text-sm text-muted-foreground">Nattskift</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border-2 border-dashed border-primary bg-primary-light" />
            <span className="text-sm text-muted-foreground">Ledig vakt</span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

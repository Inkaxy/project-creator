import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { shifts } from "@/data/mockData";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1)); // January 2026

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = (firstDay.getDay() + 6) % 7; // Monday = 0

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const dayNames = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getShiftsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return shifts.filter((s) => s.date === dateStr);
  };

  const today = 19; // Demo: Jan 19

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 pl-12 sm:flex-row sm:items-center sm:justify-between lg:pl-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Kalender</h1>
            <p className="text-muted-foreground">Månedsoversikt</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ny hendelse
          </Button>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold text-foreground">
            {currentDate.toLocaleDateString("nb-NO", { month: "long", year: "numeric" })}
          </h2>
          <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-0">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {days.map((day, index) => {
                const dayShifts = day ? getShiftsForDay(day) : [];
                const isToday = day === today;
                const isWeekend = index % 7 >= 5;

                return (
                  <div
                    key={index}
                    className={cn(
                      "min-h-[100px] border-b border-r border-border p-2 last:border-r-0 [&:nth-child(7n)]:border-r-0",
                      isWeekend && "bg-muted/30",
                      !day && "bg-muted/50"
                    )}
                  >
                    {day && (
                      <>
                        <div
                          className={cn(
                            "mb-2 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                            isToday
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground"
                          )}
                        >
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayShifts.slice(0, 2).map((shift) => (
                            <div
                              key={shift.id}
                              className={cn(
                                "truncate rounded px-1.5 py-0.5 text-xs",
                                shift.isNight
                                  ? "bg-night-light text-night"
                                  : "bg-primary-light text-primary"
                              )}
                            >
                              {shift.employeeName?.split(" ")[0] || "Ledig"}
                            </div>
                          ))}
                          {dayShifts.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayShifts.length - 2} mer
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-primary-light" />
            <span className="text-sm text-muted-foreground">Dagvakt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-night-light" />
            <span className="text-sm text-muted-foreground">Nattvakt</span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays,
  Clock,
  UserX,
  Flame,
  Shield,
  ClipboardCheck,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Wind
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, getWeek } from "date-fns";
import { nb } from "date-fns/locale";
import { 
  useCalendarEvents, 
  getEventsForDate, 
  CalendarEventType,
  EVENT_TYPE_CONFIG 
} from "@/hooks/useCalendarEvents";
import { CalendarEventBadge, EventTypeLegend } from "@/components/calendar/CalendarEventBadge";
import { CalendarDayDetail } from "@/components/calendar/CalendarDayDetail";
import { StatCard } from "@/components/ui/stat-card";
import { useWeatherSettings } from "@/hooks/useWeatherSettings";
import { getWeatherForDate, weatherIcons, weatherColors, weatherLabels } from "@/lib/weather-utils";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<CalendarEventType[]>([
    'shift', 'absence', 'fire_drill', 'safety_round', 'inspection', 'birthday'
  ]);

  // Calculate date range for current month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = format(monthStart, 'yyyy-MM-dd');
  const endDate = format(monthEnd, 'yyyy-MM-dd');

  // Fetch all events for the month
  const { eventsByDate, isLoading, counts } = useCalendarEvents({
    startDate,
    endDate,
    filters: activeFilters,
  });

  // Weather settings
  const { data: showWeather = true } = useWeatherSettings();

  // Generate calendar grid with week numbers
  const { calendarDays, weekNumbers } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
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

    // Calculate week numbers for each row
    const weeks: number[] = [];
    const totalRows = Math.ceil(days.length / 7);
    for (let row = 0; row < totalRows; row++) {
      // Find first actual day in this row to calculate week number
      const rowStart = row * 7;
      let dayInRow: number | null = null;
      for (let i = rowStart; i < rowStart + 7 && i < days.length; i++) {
        if (days[i] !== null) {
          dayInRow = days[i];
          break;
        }
      }
      if (dayInRow !== null) {
        const dateInRow = new Date(year, month, dayInRow);
        weeks.push(getWeek(dateInRow, { weekStartsOn: 1, firstWeekContainsDate: 4 }));
      }
    }

    return { calendarDays: days, weekNumbers: weeks };
  }, [currentDate]);

  const dayNames = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => direction > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
    setSelectedDate(null);
  };

  const toggleFilter = (type: CalendarEventType) => {
    setActiveFilters(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
  };

  const getDateString = (day: number) => {
    return format(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), 'yyyy-MM-dd');
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(eventsByDate, selectedDate) : [];

  return (
    <MainLayout>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Calendar Section */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 pl-12 sm:flex-row sm:items-center sm:justify-between lg:pl-0">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Kalender</h1>
              <p className="text-muted-foreground">Samlet oversikt over alle hendelser</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard
              title="Vakter"
              value={counts.shifts}
              subtitle="denne måneden"
              icon={Clock}
              variant="default"
            />
            <StatCard
              title="Fravær"
              value={counts.absences}
              subtitle="godkjente"
              icon={UserX}
              variant={counts.absences > 0 ? "warning" : "default"}
            />
            <StatCard
              title="Brannøvelser"
              value={counts.fireDrills}
              subtitle="planlagt"
              icon={Flame}
              variant="default"
            />
            <StatCard
              title="Vernerunder"
              value={counts.safetyRounds}
              subtitle="planlagt"
              icon={Shield}
              variant="default"
            />
            <StatCard
              title="Tilsyn"
              value={counts.inspections}
              subtitle="registrert"
              icon={ClipboardCheck}
              variant="default"
            />
          </div>

          {/* Calendar Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold text-foreground capitalize">
              {format(currentDate, "MMMM yyyy", { locale: nb })}
            </h2>
            <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Legend */}
          <EventTypeLegend
            activeTypes={activeFilters}
            onToggle={toggleFilter}
          />

          {/* Calendar Grid */}
          <Card>
            <CardContent className="p-0">
              {/* Day Headers with Week column */}
              <div className="grid grid-cols-[40px_repeat(7,1fr)] border-b border-border">
                <div className="p-3 text-center text-sm font-medium text-muted-foreground">
                  Uke
                </div>
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="p-3 text-center text-sm font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days with Week Numbers */}
              {isLoading ? (
                <div>
                  {Array.from({ length: 5 }).map((_, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-[40px_repeat(7,1fr)]">
                      <div className="min-h-[100px] border-b border-r border-border p-2 flex items-start justify-center">
                        <Skeleton className="h-5 w-6" />
                      </div>
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="min-h-[100px] border-b border-r border-border p-2">
                          <Skeleton className="h-7 w-7 rounded-full mb-2" />
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-[40px_repeat(7,1fr)]">
                      {/* Week Number Cell */}
                      <div className="min-h-[100px] border-b border-r border-border p-2 flex items-start justify-center bg-muted/20">
                        <span className="text-sm font-medium text-muted-foreground">
                          {weekNumbers[rowIndex]}
                        </span>
                      </div>
                      {/* Day Cells */}
                      {calendarDays.slice(rowIndex * 7, (rowIndex + 1) * 7).map((day, index) => {
                        const dateStr = day ? getDateString(day) : '';
                        const dayEvents = day ? getEventsForDate(eventsByDate, dateStr) : [];
                        const isToday = dateStr === todayStr;
                        const isWeekend = index >= 5;
                        const isSelected = dateStr === selectedDate;

                        return (
                          <div
                            key={index}
                            onClick={() => day && setSelectedDate(dateStr)}
                            className={cn(
                              "min-h-[100px] border-b border-r border-border p-2 transition-colors cursor-pointer",
                              "[&:last-child]:border-r-0",
                              isWeekend && "bg-muted/30",
                              !day && "bg-muted/50 cursor-default",
                              isSelected && "ring-2 ring-primary ring-inset",
                              day && "hover:bg-accent/50"
                            )}
                          >
                            {day && (
                              <>
                                <div className="flex items-center justify-between mb-1">
                                  <div
                                    className={cn(
                                      "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                                      isToday
                                        ? "bg-primary text-primary-foreground"
                                        : "text-foreground"
                                    )}
                                  >
                                    {day}
                                  </div>
                                  {/* Weather inline */}
                                  {showWeather && (() => {
                                    const weather = getWeatherForDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                                    const WeatherIcon = weatherIcons[weather.condition];
                                    return (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-0.5 text-xs">
                                            <WeatherIcon className={cn("h-3.5 w-3.5", weatherColors[weather.condition])} />
                                            <span className="text-muted-foreground">{weather.temp}°</span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-xs">
                                          <p>{weatherLabels[weather.condition]}</p>
                                          <p>Min: {weather.tempMin}° / Max: {weather.tempMax}°</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    );
                                  })()}
                                </div>
                                <div className="space-y-1">
                                  {dayEvents.slice(0, 3).map((event) => (
                                    <CalendarEventBadge
                                      key={event.id}
                                      event={event}
                                    />
                                  ))}
                                  {dayEvents.length > 3 && (
                                    <div className="text-xs text-muted-foreground pl-1">
                                      +{dayEvents.length - 3} mer
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side Panel for Selected Day */}
        <div className={cn(
          "lg:w-80 shrink-0 transition-all duration-200",
          !selectedDate && "lg:w-0 overflow-hidden"
        )}>
          {selectedDate && (
            <Card className="h-[600px] sticky top-4">
              <CalendarDayDetail
                date={selectedDate}
                events={selectedDateEvents}
                onClose={() => setSelectedDate(null)}
              />
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

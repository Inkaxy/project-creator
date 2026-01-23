import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ClipboardList,
  Thermometer,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useIKControlTemplates } from "@/hooks/useIKControls";
import { addDays, format, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { nb } from "date-fns/locale";

interface UpcomingControlsPanelProps {
  departmentId?: string | null;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "temperature":
      return <Thermometer className="h-4 w-4" />;
    case "hygiene":
      return <Sparkles className="h-4 w-4" />;
    case "safety":
      return <ShieldCheck className="h-4 w-4" />;
    default:
      return <ClipboardList className="h-4 w-4" />;
  }
};

const getFrequencyLabel = (frequency: string) => {
  switch (frequency) {
    case "daily":
      return "Daglig";
    case "weekly":
      return "Ukentlig";
    case "monthly":
      return "Månedlig";
    case "shift":
      return "Per vakt";
    default:
      return frequency;
  }
};

export function UpcomingControlsPanel({ departmentId }: UpcomingControlsPanelProps) {
  const { data: templates = [], isLoading } = useIKControlTemplates(departmentId);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  // Generate upcoming days
  const upcomingDays = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  // Group templates by frequency
  const dailyTemplates = templates.filter((t) => t.frequency === "daily");
  const weeklyTemplates = templates.filter((t) => t.frequency === "weekly");
  const monthlyTemplates = templates.filter((t) => t.frequency === "monthly");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Laster kommende kontroller...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Week overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Denne uken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {upcomingDays.slice(0, 7).map((day) => {
              const isToday = isSameDay(day, today);
              const dayTemplates = templates.filter((t) => {
                if (t.frequency === "daily") return true;
                // Add more frequency logic here
                return false;
              });

              return (
                <div
                  key={day.toISOString()}
                  className={`rounded-lg border p-3 text-center ${
                    isToday ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <p className="text-xs text-muted-foreground">
                    {format(day, "EEE", { locale: nb })}
                  </p>
                  <p className={`text-lg font-semibold ${isToday ? "text-primary" : ""}`}>
                    {format(day, "d")}
                  </p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {dayTemplates.length}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Daily controls */}
      {dailyTemplates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Daglige kontroller</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dailyTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    {getCategoryIcon(template.category)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{template.name}</p>
                    {template.departments && (
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: template.departments.color || undefined,
                        }}
                      >
                        {template.departments.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge>{getFrequencyLabel(template.frequency)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Weekly controls */}
      {weeklyTemplates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Ukentlige kontroller</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {weeklyTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    {getCategoryIcon(template.category)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{template.name}</p>
                    {template.departments && (
                      <Badge variant="outline" className="text-xs">
                        {template.departments.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge variant="secondary">{getFrequencyLabel(template.frequency)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Monthly controls */}
      {monthlyTemplates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Månedlige kontroller</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {monthlyTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    {getCategoryIcon(template.category)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{template.name}</p>
                    {template.departments && (
                      <Badge variant="outline" className="text-xs">
                        {template.departments.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge variant="outline">{getFrequencyLabel(template.frequency)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {templates.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              Ingen kontrollpunkter er satt opp ennå.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

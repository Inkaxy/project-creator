import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CheckCircle, AlertTriangle, XCircle, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { nb } from "date-fns/locale";

const statusConfig = {
  draft: { 
    label: "Kladd", 
    icon: Clock, 
    className: "bg-muted text-muted-foreground" 
  },
  submitted: { 
    label: "Sendt", 
    icon: Send, 
    className: "bg-primary-light text-primary" 
  },
  approved: { 
    label: "Godkjent", 
    icon: CheckCircle, 
    className: "bg-success-light text-success" 
  },
  rejected: { 
    label: "Avvist", 
    icon: XCircle, 
    className: "bg-destructive/10 text-destructive" 
  },
};

export function ClockHistoryCard() {
  const { user } = useAuth();
  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const { data: entries, isLoading } = useTimeEntries(user?.id, weekStart, weekEnd);

  const completedEntries = entries?.filter((e) => e.clock_out) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Denne uken
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const totalHours = completedEntries.reduce((sum, entry) => {
    if (!entry.clock_in || !entry.clock_out) return sum;
    const start = new Date(entry.clock_in);
    const end = new Date(entry.clock_out);
    const hours = (end.getTime() - start.getTime()) / 3600000 - (entry.break_minutes / 60);
    return sum + hours;
  }, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Denne uken
          </CardTitle>
          <Badge variant="outline" className="text-lg font-bold">
            {totalHours.toFixed(1)}t
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {completedEntries.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Ingen stemplinger denne uken
          </p>
        ) : (
          completedEntries.map((entry) => {
            const status = statusConfig[entry.status];
            const StatusIcon = status.icon;
            const hasDeviation = Math.abs(entry.deviation_minutes) > 15;

            const start = new Date(entry.clock_in!);
            const end = new Date(entry.clock_out!);
            const hours = (end.getTime() - start.getTime()) / 3600000 - (entry.break_minutes / 60);

            return (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="text-center min-w-[50px]">
                    <p className="text-xs text-muted-foreground uppercase">
                      {format(new Date(entry.date), "EEE", { locale: nb })}
                    </p>
                    <p className="text-lg font-bold">
                      {format(new Date(entry.date), "d", { locale: nb })}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {format(start, "HH:mm")} - {format(end, "HH:mm")}
                      </p>
                      {hasDeviation && (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {entry.shifts?.functions?.name || "Uten funksjon"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{hours.toFixed(1)}t</span>
                  <Badge className={status.className}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {status.label}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

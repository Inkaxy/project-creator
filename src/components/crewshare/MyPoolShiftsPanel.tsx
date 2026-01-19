import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMyPoolShifts } from "@/hooks/useCrewshare";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { CalendarClock, Loader2 } from "lucide-react";

export function MyPoolShiftsPanel() {
  const { data: shifts, isLoading } = useMyPoolShifts();

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!shifts?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CalendarClock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Ingen poolvakter</h3>
          <p className="text-muted-foreground">Du har ikke tatt noen eksterne vakter ennå.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {shifts.map((shift) => (
        <Card key={shift.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{shift.title}</CardTitle>
              <Badge variant={shift.status === 'completed' ? 'secondary' : 'default'}>
                {shift.status === 'assigned' ? 'Kommende' : shift.status === 'completed' ? 'Fullført' : shift.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {shift.partner_organization?.name} • {format(new Date(shift.date), "d. MMMM yyyy", { locale: nb })} • {shift.start_time.slice(0,5)}-{shift.end_time.slice(0,5)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

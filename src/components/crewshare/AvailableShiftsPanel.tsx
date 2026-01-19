import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAvailablePoolShifts, useApplyForPoolShift } from "@/hooks/useCrewshare";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { MapPin, Clock, DollarSign, Briefcase, Loader2 } from "lucide-react";

export function AvailableShiftsPanel() {
  const { data: shifts, isLoading } = useAvailablePoolShifts();
  const applyMutation = useApplyForPoolShift();

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!shifts?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Ingen tilgjengelige vakter</h3>
          <p className="text-muted-foreground text-center">
            Det er ingen åpne vakter fra partnerbedrifter akkurat nå.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {shifts.map((shift) => (
        <Card key={shift.id} className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">{shift.title}</CardTitle>
                <CardDescription>{shift.partner_organization?.name}</CardDescription>
              </div>
              {shift.function && (
                <Badge style={{ backgroundColor: shift.function.color || undefined }}>
                  {shift.function.name}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(shift.date), "EEEE d. MMMM", { locale: nb })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}</span>
            </div>
            {shift.location_address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{shift.location_address}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>kr {shift.hourly_rate}/time</span>
            </div>
          </CardContent>
          <div className="p-4 pt-0">
            <Button 
              className="w-full" 
              onClick={() => applyMutation.mutate({ pool_shift_id: shift.id })}
              disabled={applyMutation.isPending}
            >
              {applyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Søk på vakt
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

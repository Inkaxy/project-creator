import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PlayCircle,
  StopCircle,
  Clock,
  Moon,
  Sun,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useActiveTimeEntry,
  useTodayShift,
  useClockIn,
  useClockOut,
} from "@/hooks/useTimeEntries";
import { format, differenceInMinutes } from "date-fns";
import { nb } from "date-fns/locale";

export function ClockInOutCard() {
  const { user } = useAuth();
  const { data: activeEntry, isLoading: loadingActive } = useActiveTimeEntry(user?.id);
  const { data: todayShift, isLoading: loadingShift } = useTodayShift(user?.id);
  const clockIn = useClockIn();
  const clockOut = useClockOut();

  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");
  const [showClockOutDialog, setShowClockOutDialog] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [deviationReason, setDeviationReason] = useState("");
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Update elapsed time every second when clocked in
  useEffect(() => {
    if (!activeEntry?.clock_in) return;

    const updateElapsed = () => {
      const start = new Date(activeEntry.clock_in!);
      const now = new Date();
      const diff = now.getTime() - start.getTime();

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setElapsedTime(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeEntry?.clock_in]);

  // Try to get location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          // Location denied or unavailable - that's okay
        }
      );
    }
  }, []);

  const handleClockIn = async () => {
    if (!user?.id) return;
    await clockIn.mutateAsync({
      employeeId: user.id,
      shiftId: todayShift?.id,
      location,
    });
  };

  const handleClockOutClick = () => {
    setShowClockOutDialog(true);
  };

  const handleClockOutConfirm = async () => {
    if (!activeEntry?.id) return;

    // Check if there's a significant deviation
    const requiresReason = activeEntry.shifts && activeEntry.clock_in
      ? Math.abs(calculateDeviation()) > 15
      : false;

    if (requiresReason && !deviationReason.trim()) {
      return; // Don't allow without reason
    }

    await clockOut.mutateAsync({
      timeEntryId: activeEntry.id,
      breakMinutes,
      location,
      deviationReason: deviationReason.trim() || undefined,
    });
    setShowClockOutDialog(false);
    setDeviationReason("");
  };

  const calculateDeviation = (): number => {
    if (!activeEntry?.shifts || !activeEntry.clock_in) return 0;

    const clockInTime = new Date(activeEntry.clock_in);
    const now = new Date();
    const actualMinutes = differenceInMinutes(now, clockInTime) - breakMinutes;

    const plannedStart = new Date(`${activeEntry.date}T${activeEntry.shifts.planned_start}`);
    let plannedEnd = new Date(`${activeEntry.date}T${activeEntry.shifts.planned_end}`);
    if (plannedEnd < plannedStart) {
      plannedEnd.setDate(plannedEnd.getDate() + 1);
    }
    const plannedMinutes = differenceInMinutes(plannedEnd, plannedStart) - (activeEntry.shifts.planned_break_minutes || 0);

    return actualMinutes - plannedMinutes;
  };

  const isNightShift = todayShift?.is_night_shift || false;
  const isLoading = loadingActive || loadingShift;
  const isClockedIn = !!activeEntry;

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary-light to-background">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-r from-primary-light to-background">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                {isClockedIn ? (
                  <Clock className="h-7 w-7 text-primary animate-pulse" />
                ) : isNightShift ? (
                  <Moon className="h-7 w-7 text-primary" />
                ) : (
                  <Sun className="h-7 w-7 text-primary" />
                )}
              </div>
              <div>
                {isClockedIn ? (
                  <>
                    <p className="text-sm text-muted-foreground">Du er stemplet inn</p>
                    <p className="text-2xl font-bold text-foreground font-mono">
                      {elapsedTime}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">
                        {activeEntry.shifts?.functions?.name || "Uten vakt"}
                      </Badge>
                      {location && (
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </>
                ) : todayShift ? (
                  <>
                    <p className="text-sm text-muted-foreground">Dagens vakt</p>
                    <p className="text-xl font-semibold text-foreground">
                      {todayShift.functions?.name}
                    </p>
                    <p className="text-muted-foreground">
                      {todayShift.planned_start} - {todayShift.planned_end}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Ingen planlagt vakt</p>
                    <p className="text-lg font-medium text-foreground">
                      Du kan fortsatt stemple inn
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {isClockedIn ? (
                <Button 
                  size="lg" 
                  variant="destructive" 
                  className="gap-2"
                  onClick={handleClockOutClick}
                  disabled={clockOut.isPending}
                >
                  <StopCircle className="h-5 w-5" />
                  {clockOut.isPending ? "Stempler ut..." : "Stemple ut"}
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  className="gap-2"
                  onClick={handleClockIn}
                  disabled={clockIn.isPending}
                >
                  <PlayCircle className="h-5 w-5" />
                  {clockIn.isPending ? "Stempler inn..." : "Stemple inn"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clock Out Dialog */}
      <Dialog open={showClockOutDialog} onOpenChange={setShowClockOutDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Stemple ut</DialogTitle>
            <DialogDescription>
              Bekreft pause og legg til kommentar ved behov.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Time summary */}
            {activeEntry?.clock_in && (
              <div className="rounded-lg bg-muted p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stemplet inn:</span>
                  <span className="font-medium">
                    {format(new Date(activeEntry.clock_in), "HH:mm", { locale: nb })}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Stempler ut:</span>
                  <span className="font-medium">
                    {format(new Date(), "HH:mm", { locale: nb })}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Total tid:</span>
                  <span className="font-bold">{elapsedTime}</span>
                </div>
              </div>
            )}

            {/* Break input */}
            <div className="space-y-2">
              <Label htmlFor="break">Pause (minutter)</Label>
              <Input
                id="break"
                type="number"
                min={0}
                max={120}
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Number(e.target.value))}
              />
            </div>

            {/* Deviation warning */}
            {activeEntry?.shifts && Math.abs(calculateDeviation()) > 15 && (
              <div className="flex items-start gap-2 rounded-lg bg-warning-light p-3">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning">
                    Avvik på {Math.abs(calculateDeviation())} minutter
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vennligst legg til en forklaring
                  </p>
                </div>
              </div>
            )}

            {/* Deviation reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Kommentar {activeEntry?.shifts && Math.abs(calculateDeviation()) > 15 && "(påkrevd)"}
              </Label>
              <Textarea
                id="reason"
                placeholder="F.eks. ble lenger pga leveranse, måtte gå tidligere..."
                value={deviationReason}
                onChange={(e) => setDeviationReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClockOutDialog(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={handleClockOutConfirm}
              disabled={
                clockOut.isPending || 
                (activeEntry?.shifts && Math.abs(calculateDeviation()) > 15 && !deviationReason.trim())
              }
            >
              {clockOut.isPending ? "Stempler ut..." : "Bekreft utstempling"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

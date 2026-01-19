import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQualifiedEmployees } from "@/hooks/useEmployeeFunctions";
import { useUpdateShift, useDeleteShift, ShiftData } from "@/hooks/useShifts";
import { useWageSupplements, calculateShiftCost } from "@/hooks/useWageSupplements";
import { Clock, Star, Trash2, Users, Moon, Sun, Calendar, DollarSign } from "lucide-react";

interface ShiftDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: ShiftData | null;
}

export function ShiftDetailModal({
  open,
  onOpenChange,
  shift,
}: ShiftDetailModalProps) {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("15:00");
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [notes, setNotes] = useState("");

  const { data: qualifiedEmployees } = useQualifiedEmployees(shift?.function_id || "");
  const { data: supplements = [] } = useWageSupplements();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();

  // Calculate costs for current shift
  const shiftCosts = useMemo(() => {
    if (!shift) return null;
    return calculateShiftCost(
      {
        planned_start: startTime,
        planned_end: endTime,
        planned_break_minutes: breakMinutes,
        date: shift.date,
        is_night_shift: shift.is_night_shift,
        is_weekend: shift.is_weekend,
        is_holiday: shift.is_holiday,
      },
      supplements
    );
  }, [shift, startTime, endTime, breakMinutes, supplements]);

  useEffect(() => {
    if (shift) {
      setEmployeeId(shift.employee_id || "unassigned");
      setStartTime(shift.planned_start?.slice(0, 5) || "07:00");
      setEndTime(shift.planned_end?.slice(0, 5) || "15:00");
      setBreakMinutes(shift.planned_break_minutes || 30);
      setNotes(shift.notes || "");
    }
  }, [shift]);

  const handleUpdate = async () => {
    if (!shift) return;

    await updateShift.mutateAsync({
      id: shift.id,
      employee_id: employeeId && employeeId !== "unassigned" ? employeeId : null,
      planned_start: startTime,
      planned_end: endTime,
      planned_break_minutes: breakMinutes,
      notes: notes || undefined,
      date: shift.date,
    });

    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!shift) return;

    await deleteShift.mutateAsync(shift.id);
    onOpenChange(false);
  };

  const handleMarkAsOpen = async () => {
    if (!shift) return;

    await updateShift.mutateAsync({
      id: shift.id,
      employee_id: null,
    });
  };

  const getProficiencyBadge = (level: string) => {
    const config = {
      expert: { label: "Ekspert", stars: 3 },
      competent: { label: "Kompetent", stars: 2 },
      learning: { label: "Lærling", stars: 1 },
    };
    return config[level as keyof typeof config] || config.competent;
  };

  const calculateDuration = () => {
    if (!startTime || !endTime) return "0t 0m";
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    let minutes = endH * 60 + endM - (startH * 60 + startM);
    if (minutes < 0) minutes += 24 * 60; // Overnight shift
    minutes -= breakMinutes;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}t ${mins}m`;
  };

  if (!shift) return null;

  const isOpenShift = !shift.employee_id;
  const isUnassignedSelected = employeeId === "unassigned";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {shift.functions?.name || "Vaktdetaljer"}
            {(isOpenShift || isUnassignedSelected) && (
              <Badge variant="outline" className="border-primary text-primary">
                Ledig vakt
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current assignment info */}
          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dato</p>
                <p className="font-medium">
                  {new Date(shift.date).toLocaleDateString("nb-NO", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{calculateDuration()}</span>
              </div>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={shift.status === "published" ? "default" : "secondary"}>
              {shift.status === "draft" ? "Utkast" : 
               shift.status === "published" ? "Publisert" : 
               shift.status === "completed" ? "Fullført" : shift.status}
            </Badge>
            {shift.is_night_shift && (
              <Badge variant="outline">Nattskift</Badge>
            )}
            {shift.is_weekend && (
              <Badge variant="outline">Helg</Badge>
            )}
          </div>

          {/* Employee selection */}
          <div className="space-y-2">
            <Label htmlFor="employee">Ansatt</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Velg ansatt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Ledig vakt</span>
                  </div>
                </SelectItem>
                {qualifiedEmployees
                  ?.filter((ef) => !!ef.profiles?.id)
                  .map((ef) => {
                    const badge = getProficiencyBadge(ef.proficiency_level);
                    return (
                      <SelectItem key={ef.id} value={ef.profiles!.id}>
                        <div className="flex items-center gap-2">
                          <AvatarWithInitials
                            name={ef.profiles?.full_name || ""}
                            size="sm"
                          />
                          <span>{ef.profiles?.full_name}</span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: badge.stars }).map((_, i) => (
                              <Star
                                key={i}
                                className="h-3 w-3 fill-primary text-primary"
                              />
                            ))}
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </div>

          {/* Time inputs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Slutt</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="break">Pause (min)</Label>
              <Input
                id="break"
                type="number"
                min={0}
                max={120}
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Actual times if available */}
          {shift.actual_start && (
            <div className="rounded-lg border border-border p-3">
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                Faktisk arbeidstid
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span>
                  Inn: <strong>{shift.actual_start?.slice(0, 5)}</strong>
                </span>
                <span>
                  Ut: <strong>{shift.actual_end?.slice(0, 5) || "-"}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Cost breakdown */}
          {shiftCosts && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Kostnadsberegning</p>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Grunnlønn ({shiftCosts.baseHours.toFixed(1)}t)</span>
                  <span>{shiftCosts.baseCost.toLocaleString("nb-NO")} kr</span>
                </div>
                
                {shiftCosts.nightSupplement > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span className="flex items-center gap-1">
                      <Moon className="h-3 w-3" /> Nattillegg ({shiftCosts.nightHours.toFixed(1)}t)
                    </span>
                    <span>+{shiftCosts.nightSupplement.toLocaleString("nb-NO")} kr</span>
                  </div>
                )}
                
                {shiftCosts.eveningSupplement > 0 && (
                  <div className="flex justify-between text-warning">
                    <span className="flex items-center gap-1">
                      <Sun className="h-3 w-3" /> Kveldstillegg ({shiftCosts.eveningHours.toFixed(1)}t)
                    </span>
                    <span>+{shiftCosts.eveningSupplement.toLocaleString("nb-NO")} kr</span>
                  </div>
                )}
                
                {shiftCosts.weekendSupplement > 0 && (
                  <div className="flex justify-between text-primary">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Helgetillegg
                    </span>
                    <span>+{shiftCosts.weekendSupplement.toLocaleString("nb-NO")} kr</span>
                  </div>
                )}
                
                {shiftCosts.holidaySupplement > 0 && (
                  <div className="flex justify-between text-accent">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" /> Helligdagstillegg
                    </span>
                    <span>+{shiftCosts.holidaySupplement.toLocaleString("nb-NO")} kr</span>
                  </div>
                )}
                
                <div className="mt-2 flex justify-between border-t border-primary/20 pt-2 font-semibold">
                  <span>Totalkostnad</span>
                  <span className="text-primary">{shiftCosts.totalCost.toLocaleString("nb-NO")} kr</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notater</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Legg til notater..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="mr-2 h-4 w-4" />
                Slett vakt
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                <AlertDialogDescription>
                  Denne handlingen kan ikke angres. Vakten vil bli permanent slettet.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Slett
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex flex-1 justify-end gap-2">
            {employeeId && (
              <Button variant="outline" onClick={handleMarkAsOpen}>
                Marker som ledig
              </Button>
            )}
            <Button
              onClick={handleUpdate}
              disabled={updateShift.isPending}
            >
              {updateShift.isPending ? "Lagrer..." : "Lagre endringer"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { 
  Clock, 
  Star, 
  Trash2, 
  Users, 
  Moon, 
  Sun, 
  Calendar, 
  DollarSign,
  MessageSquare,
  Coffee,
  PlusCircle,
  History,
  Send,
  Bell,
  Smartphone
} from "lucide-react";
import { toast } from "sonner";

interface EnhancedShiftDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: ShiftData | null;
}

export function EnhancedShiftDetailModal({
  open,
  onOpenChange,
  shift,
}: EnhancedShiftDetailModalProps) {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("15:00");
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [notes, setNotes] = useState("");
  const [approveForPayroll, setApproveForPayroll] = useState(false);
  const [notifyEmployee, setNotifyEmployee] = useState(false);
  const [notifySms, setNotifySms] = useState(false);

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
      setApproveForPayroll(false);
      setNotifyEmployee(false);
      setNotifySms(false);
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

    toast.success("Vakt oppdatert");
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!shift) return;
    await deleteShift.mutateAsync(shift.id);
    toast.success("Vakt slettet");
    onOpenChange(false);
  };

  const handleMarkAsOpen = async () => {
    if (!shift) return;
    await updateShift.mutateAsync({
      id: shift.id,
      employee_id: null,
    });
    setEmployeeId("unassigned");
    toast.success("Vakt markert som ledig");
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
    if (!startTime || !endTime) return { hours: 0, minutes: 0, display: "0t 0m" };
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    let minutes = endH * 60 + endM - (startH * 60 + startM);
    if (minutes < 0) minutes += 24 * 60;
    minutes -= breakMinutes;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return { hours, minutes: mins, display: `${hours}t ${mins}m` };
  };

  if (!shift) return null;

  const duration = calculateDuration();
  const isOpenShift = !shift.employee_id;
  const hasClockData = shift.actual_start || shift.actual_end;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {shift.profiles ? (
                <AvatarWithInitials 
                  name={shift.profiles.full_name} 
                  avatarUrl={shift.profiles.avatar_url || undefined}
                  className="h-12 w-12"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              )}
              <div>
                <DialogTitle className="text-lg">
                  {format(new Date(shift.date), "EEEE d. MMMM yyyy", { locale: nb })}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {shift.profiles?.full_name || "Ledig vakt"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.info("Opprett medarbeider kommer snart")}>
              <PlusCircle className="h-4 w-4 mr-1" />
              Opprett medarbeider
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Time inputs */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Klokken</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="font-mono"
                />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            {/* Employee selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tildelt</Label>
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

            {/* Function and shift type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Gruppe eller funksjon*</Label>
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                {shift.functions && (
                  <>
                    <div 
                      className="h-3 w-3 rounded" 
                      style={{ backgroundColor: shift.functions.color || "#3B82F6" }} 
                    />
                    <span className="text-sm">{shift.functions.name}</span>
                  </>
                )}
              </div>
            </div>

            {/* Shift type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Vakttype</Label>
              <Select defaultValue="normal">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="overtime">Overtid</SelectItem>
                  <SelectItem value="standby">Beredskapsvakt</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Vakttyper kan administreres i Innstillinger.
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Duration and break */}
            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Varighet: <strong>{duration.display}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Coffee className="h-4 w-4 text-muted-foreground" />
                  <span>Pauser: <strong>{breakMinutes}m</strong></span>
                </div>
              </CardContent>
            </Card>

            {/* Actual clock time */}
            {hasClockData && (
              <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                    <Clock className="h-4 w-4" />
                    <span>
                      Stemplingsur: <strong>{shift.actual_start?.slice(0, 5) || "--:--"} - {shift.actual_end?.slice(0, 5) || "--:--"}</strong>
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Approve for payroll */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="approve" 
                    checked={approveForPayroll}
                    onCheckedChange={(c) => setApproveForPayroll(!!c)}
                  />
                  <Label htmlFor="approve" className="text-sm font-normal">
                    Godkjenn vakt for lønn
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Notify employee */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm font-medium">Varsle medarbeider</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notify" 
                      checked={notifyEmployee}
                      onCheckedChange={(c) => setNotifyEmployee(!!c)}
                    />
                    <Label htmlFor="notify" className="text-sm font-normal flex items-center gap-1">
                      <Bell className="h-3 w-3" />
                      Beskjed
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="sms" 
                      checked={notifySms}
                      onCheckedChange={(c) => setNotifySms(!!c)}
                    />
                    <Label htmlFor="sms" className="text-sm font-normal flex items-center gap-1">
                      <Smartphone className="h-3 w-3" />
                      SMS
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      Standard SMS-satser gjelder
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Tabs for additional info */}
        <Tabs defaultValue="communication" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="communication">Kommunikasjon</TabsTrigger>
            <TabsTrigger value="pause">Pause</TabsTrigger>
            <TabsTrigger value="salary">Lønn</TabsTrigger>
            <TabsTrigger value="supplements">Tillegg</TabsTrigger>
            <TabsTrigger value="history">Historikk</TabsTrigger>
          </TabsList>

          <TabsContent value="communication" className="space-y-3 mt-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Vaktmerknad</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Legg til merknad..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Vaktmerknaden kan være synlig for andre i organisasjonen din.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="pause" className="space-y-3 mt-4">
            <div className="space-y-2">
              <Label>Pause (minutter)</Label>
              <Input
                type="number"
                min={0}
                max={120}
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
                className="w-32"
              />
            </div>
          </TabsContent>

          <TabsContent value="salary" className="space-y-3 mt-4">
            {shiftCosts && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Grunnlønn ({shiftCosts.baseHours.toFixed(1)}t)</span>
                  <span>{shiftCosts.baseCost.toLocaleString("nb-NO")} kr</span>
                </div>
                {shiftCosts.nightSupplement > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Nattillegg ({shiftCosts.nightHours.toFixed(1)}t)</span>
                    <span>+{shiftCosts.nightSupplement.toLocaleString("nb-NO")} kr</span>
                  </div>
                )}
                {shiftCosts.eveningSupplement > 0 && (
                  <div className="flex justify-between text-warning">
                    <span>Kveldstillegg ({shiftCosts.eveningHours.toFixed(1)}t)</span>
                    <span>+{shiftCosts.eveningSupplement.toLocaleString("nb-NO")} kr</span>
                  </div>
                )}
                {shiftCosts.weekendSupplement > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Helgetillegg</span>
                    <span>+{shiftCosts.weekendSupplement.toLocaleString("nb-NO")} kr</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{shiftCosts.totalCost.toLocaleString("nb-NO")} kr</span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="supplements" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">
              Tillegg beregnes automatisk basert på vakttid og gjeldende tariff.
            </p>
            <div className="flex flex-wrap gap-2">
              {shift.is_night_shift && (
                <Badge variant="outline" className="border-destructive text-destructive">
                  <Moon className="h-3 w-3 mr-1" /> Nattillegg
                </Badge>
              )}
              {shift.is_weekend && (
                <Badge variant="outline" className="border-primary text-primary">
                  <Calendar className="h-3 w-3 mr-1" /> Helgetillegg
                </Badge>
              )}
              {shift.is_holiday && (
                <Badge variant="outline" className="border-accent text-accent">
                  Helligdagstillegg
                </Badge>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-3 mt-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span>Opprettet: {format(new Date(shift.created_at), "d. MMM yyyy HH:mm", { locale: nb })}</span>
              </div>
              {shift.updated_at && shift.updated_at !== shift.created_at && (
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <span>Sist endret: {format(new Date(shift.updated_at), "d. MMM yyyy HH:mm", { locale: nb })}</span>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-col gap-2 sm:flex-row mt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Slett
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateShift.isPending}
            >
              {updateShift.isPending ? "Lagrer..." : "Lagre"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

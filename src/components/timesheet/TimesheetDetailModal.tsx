import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Pencil,
  ArrowRight,
  Coffee,
  Timer,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Briefcase,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { type TimeEntryData, useApproveTimeEntries, useRejectTimeEntry } from "@/hooks/useTimeEntries";
import { useDeviationTypes, type DeviationType } from "@/hooks/useDeviationTypes";
import { InlineDeviationEditor, type DeviationLine } from "./InlineDeviationEditor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface TimesheetDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: TimeEntryData | null;
}

function timeDiffMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return diff;
}

let lineIdCounter = 0;

export function TimesheetDetailModal({ open, onOpenChange, entry }: TimesheetDetailModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: deviationTypes = [] } = useDeviationTypes();
  const approveEntries = useApproveTimeEntries();
  const rejectEntry = useRejectTimeEntry();

  // Editable state
  const [editMode, setEditMode] = useState(false);
  const [editClockIn, setEditClockIn] = useState("");
  const [editClockOut, setEditClockOut] = useState("");
  const [editBreak, setEditBreak] = useState(0);
  const [useDeviation, setUseDeviation] = useState(false);
  const [deviationLines, setDeviationLines] = useState<DeviationLine[]>([]);
  const [managerNotes, setManagerNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Derived values
  const clockIn = entry?.clock_in ? format(new Date(entry.clock_in), "HH:mm") : "—";
  const clockOut = entry?.clock_out ? format(new Date(entry.clock_out), "HH:mm") : "—";
  const plannedStart = entry?.shifts?.planned_start?.slice(0, 5) || "";
  const plannedEnd = entry?.shifts?.planned_end?.slice(0, 5) || "";
  const plannedBreak = entry?.shifts?.planned_break_minutes || 0;
  const margin = 15;

  // Reset state when entry changes
  useEffect(() => {
    if (entry) {
      const ci = entry.clock_in ? format(new Date(entry.clock_in), "HH:mm") : "07:00";
      const co = entry.clock_out ? format(new Date(entry.clock_out), "HH:mm") : "15:00";
      setEditClockIn(ci);
      setEditClockOut(co);
      setEditBreak(entry.break_minutes || 0);
      setEditMode(false);
      setUseDeviation(false);
      setShowRejectForm(false);
      setManagerNotes("");
      setRejectionReason("");
      
      const normalType = deviationTypes.find((t) => t.code === "normal");
      setDeviationLines([{
        id: `init-${Date.now()}`,
        deviation_type_id: normalType?.id || "",
        start_time: ci,
        end_time: co,
        duration_minutes: timeDiffMinutes(ci, co),
      }]);
    }
  }, [entry?.id, deviationTypes]);

  if (!entry) return null;

  const isPending = entry.status === "submitted";
  const hasDeviation = Math.abs(entry.deviation_minutes) > margin;
  
  // Calculate times
  const actualCi = editMode ? editClockIn : clockIn;
  const actualCo = editMode ? editClockOut : clockOut;
  const actualBreak = editMode ? editBreak : entry.break_minutes;
  const actualMinutes = timeDiffMinutes(actualCi, actualCo) - actualBreak;
  const plannedMinutes = plannedStart && plannedEnd ? timeDiffMinutes(plannedStart, plannedEnd) - plannedBreak : 0;
  const deviationMin = actualMinutes - plannedMinutes;

  // Visual timeline computation  
  const timelineStart = plannedStart && clockIn !== "—" 
    ? Math.min(timeToMinutes(plannedStart), timeToMinutes(clockIn)) - 30
    : 0;
  const timelineEnd = plannedEnd && clockOut !== "—"
    ? Math.max(timeToMinutes(plannedEnd), timeToMinutes(clockOut)) + 30
    : 24 * 60;
  const timelineRange = timelineEnd - timelineStart || 1;

  function timeToMinutes(t: string) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }
  function toPercent(t: string) {
    return ((timeToMinutes(t) - timelineStart) / timelineRange) * 100;
  }

  const handleApprove = async () => {
    if (!user?.id) return;
    setSaving(true);

    try {
      // Update clock times if edited
      if (editMode) {
        const dateStr = entry.date;
        const newClockIn = `${dateStr}T${editClockIn}:00`;
        let newClockOut = `${dateStr}T${editClockOut}:00`;
        // Handle overnight
        if (editClockOut < editClockIn) {
          const nextDay = new Date(dateStr);
          nextDay.setDate(nextDay.getDate() + 1);
          newClockOut = `${format(nextDay, "yyyy-MM-dd")}T${editClockOut}:00`;
        }
        
        await supabase
          .from("time_entries")
          .update({
            clock_in: newClockIn,
            clock_out: newClockOut,
            break_minutes: editBreak,
            manager_notes: managerNotes || null,
          })
          .eq("id", entry.id);
      }

      // Save deviation lines
      if (useDeviation && deviationLines.length > 0) {
        const insertData = deviationLines.map((l) => {
          const dt = deviationTypes.find((t) => t.id === l.deviation_type_id);
          return {
            time_entry_id: entry.id,
            deviation_type_id: l.deviation_type_id,
            start_time: l.start_time + ":00",
            end_time: l.end_time + ":00",
            duration_minutes: l.duration_minutes,
            salary_type_id: dt?.salary_type_id || null,
            created_by: user.id,
          };
        });

        const { error: lineError } = await supabase
          .from("time_entry_lines")
          .insert(insertData);
        if (lineError) throw lineError;

        // Handle time bank
        for (const line of deviationLines) {
          const dt = deviationTypes.find((t) => t.id === line.deviation_type_id);
          if (dt?.affects_time_bank && line.duration_minutes > 0) {
            const currentYear = new Date().getFullYear();
            const { data: account } = await supabase
              .from("employee_accounts")
              .select("id")
              .eq("employee_id", entry.employee_id)
              .eq("account_type", "time_bank")
              .eq("year", currentYear)
              .maybeSingle();

            if (account) {
              await supabase.from("account_transactions").insert({
                account_id: account.id,
                amount: line.duration_minutes / 60,
                description: `${dt.name} fra timeliste ${entry.date}`,
                reference_type: "overtime",
                reference_id: entry.id,
                created_by: user.id,
              });
            }
          }
        }
      }

      await approveEntries.mutateAsync({
        timeEntryIds: [entry.id],
        approverId: user.id,
      });

      queryClient.invalidateQueries({ queryKey: ["employee-accounts"] });
      toast.success("Timer godkjent" + (useDeviation ? " med avvikshåndtering" : "") + (editMode ? " (korrigert)" : ""));
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Kunne ikke godkjenne: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await rejectEntry.mutateAsync({
        timeEntryId: entry.id,
        managerNotes: rejectionReason,
      });
      toast.success("Timer avvist");
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Kunne ikke avvise: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <AvatarWithInitials name={entry.profiles?.full_name || "?"} size="md" />
            <div>
              <span className="text-lg">{entry.profiles?.full_name || "Ukjent"}</span>
              <p className="text-sm font-normal text-muted-foreground">
                {format(new Date(entry.date + "T00:00"), "EEEE d. MMMM yyyy", { locale: nb })}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detaljer for timeregistrering
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Status + function header */}
          <div className="flex items-center gap-2 flex-wrap">
            {entry.shifts?.functions && (
              <Badge
                variant="outline"
                style={{
                  borderColor: entry.shifts.functions.color || undefined,
                  color: entry.shifts.functions.color || undefined,
                }}
              >
                <Briefcase className="mr-1 h-3 w-3" />
                {entry.shifts.functions.name}
              </Badge>
            )}
            {hasDeviation ? (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border-amber-500">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Avvik {deviationMin > 0 ? "+" : ""}{deviationMin} min
              </Badge>
            ) : (
              <Badge className="bg-success/10 text-success border-success/30">
                <CheckCircle className="mr-1 h-3 w-3" />
                Innenfor margin
              </Badge>
            )}
            {entry.deviation_reason && (
              <span className="text-sm text-muted-foreground italic">
                «{entry.deviation_reason}»
              </span>
            )}
          </div>

          {/* Visual timeline */}
          {plannedStart && plannedEnd && clockIn !== "—" && clockOut !== "—" && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Visuell tidslinje</Label>
              <div className="relative h-16 bg-muted rounded-lg overflow-hidden">
                {/* Planned bar */}
                <div
                  className="absolute top-2 h-5 rounded bg-primary/20 border border-primary/40"
                  style={{
                    left: `${toPercent(plannedStart)}%`,
                    width: `${toPercent(plannedEnd) - toPercent(plannedStart)}%`,
                  }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-primary">
                    Plan: {plannedStart}–{plannedEnd}
                  </span>
                </div>
                {/* Actual bar */}
                <div
                  className={cn(
                    "absolute top-9 h-5 rounded border",
                    hasDeviation
                      ? "bg-amber-200/60 border-amber-500 dark:bg-amber-800/40"
                      : "bg-success/20 border-success/40"
                  )}
                  style={{
                    left: `${toPercent(actualCi)}%`,
                    width: `${toPercent(actualCo) - toPercent(actualCi)}%`,
                  }}
                >
                  <span className={cn(
                    "absolute inset-0 flex items-center justify-center text-[10px] font-medium",
                    hasDeviation ? "text-amber-800 dark:text-amber-200" : "text-success"
                  )}>
                    Faktisk: {actualCi}–{actualCo}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Time details grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Planned */}
            <div className="space-y-3 bg-muted/40 rounded-lg p-4">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Planlagt vakt
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Start</span>
                  <span className="font-mono font-medium">{plannedStart || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Slutt</span>
                  <span className="font-mono font-medium">{plannedEnd || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pause</span>
                  <span className="font-mono font-medium">{plannedBreak} min</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-medium">
                  <span>Arbeidstid</span>
                  <span className="font-mono">{(plannedMinutes / 60).toFixed(1)}t</span>
                </div>
              </div>
            </div>

            {/* Actual / Editable */}
            <div className={cn(
              "space-y-3 rounded-lg p-4",
              editMode ? "bg-primary/5 ring-2 ring-primary/20" : "bg-muted/40"
            )}>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Stemplet tid
                </h4>
                {isPending && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setEditMode(!editMode)}
                  >
                    <Pencil className="h-3 w-3" />
                    {editMode ? "Lås" : "Korriger"}
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Inn</span>
                  {editMode ? (
                    <Input
                      type="time"
                      value={editClockIn}
                      onChange={(e) => setEditClockIn(e.target.value)}
                      className="h-7 w-24 text-sm font-mono"
                    />
                  ) : (
                    <span className="font-mono font-medium">{clockIn}</span>
                  )}
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Ut</span>
                  {editMode ? (
                    <Input
                      type="time"
                      value={editClockOut}
                      onChange={(e) => setEditClockOut(e.target.value)}
                      className="h-7 w-24 text-sm font-mono"
                    />
                  ) : (
                    <span className="font-mono font-medium">{clockOut}</span>
                  )}
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Pause</span>
                  {editMode ? (
                    <Input
                      type="number"
                      value={editBreak}
                      onChange={(e) => setEditBreak(Number(e.target.value))}
                      className="h-7 w-24 text-sm font-mono"
                      min={0}
                      step={5}
                    />
                  ) : (
                    <span className="font-mono font-medium">{entry.break_minutes} min</span>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-medium">
                  <span>Arbeidstid</span>
                  <span className="font-mono">{(actualMinutes / 60).toFixed(1)}t</span>
                </div>
              </div>
            </div>
          </div>

          {/* Deviation summary */}
          {plannedStart && (
            <div className={cn(
              "rounded-lg p-4 flex items-center gap-4",
              deviationMin > 0 ? "bg-success/5 border border-success/20" : deviationMin < 0 ? "bg-destructive/5 border border-destructive/20" : "bg-muted/40"
            )}>
              {deviationMin > 0 ? (
                <TrendingUp className="h-5 w-5 text-success shrink-0" />
              ) : deviationMin < 0 ? (
                <TrendingDown className="h-5 w-5 text-destructive shrink-0" />
              ) : (
                <Timer className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {deviationMin === 0
                    ? "Ingen avvik fra planlagt vakt"
                    : deviationMin > 0
                    ? `${deviationMin} minutter ekstra arbeidet (${(deviationMin / 60).toFixed(1)}t)`
                    : `${Math.abs(deviationMin)} minutter kortere enn planlagt (${(Math.abs(deviationMin) / 60).toFixed(1)}t)`}
                </p>
                {deviationMin > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Bruk avvikshåndteringen under for å bestemme om dette skal utbetales som overtid, legges i tidsbank, eller ignoreres.
                  </p>
                )}
              </div>
              <span className={cn(
                "font-mono text-lg font-bold",
                deviationMin > 0 ? "text-success" : deviationMin < 0 ? "text-destructive" : "text-muted-foreground"
              )}>
                {deviationMin > 0 ? "+" : ""}{deviationMin}m
              </span>
            </div>
          )}

          {/* Deviation lines editor – shown when editing */}
          {isPending && editMode && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Fordel timer til lønnsarter
              </Label>
              <p className="text-xs text-muted-foreground">
                Del opp arbeidstiden i ulike lønnskategorier. Hver linje sendes til lønn med tilhørende lønnsart.
              </p>
              <InlineDeviationEditor
                clockIn={actualCi}
                clockOut={actualCo}
                deviationTypes={deviationTypes}
                lines={deviationLines}
                onChange={setDeviationLines}
              />
            </div>
          )}

          {/* Manager notes */}
          {isPending && (
            <div className="space-y-2">
              <Label className="text-sm">Lederkommentar (valgfritt)</Label>
              <Textarea
                placeholder="Legg til en kommentar..."
                value={managerNotes}
                onChange={(e) => setManagerNotes(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
          )}

          {/* Rejection form */}
          {showRejectForm && (
            <div className="space-y-3 bg-destructive/5 rounded-lg p-4 border border-destructive/20">
              <Label className="text-sm font-semibold text-destructive">Avslå timeliste</Label>
              <Textarea
                placeholder="Begrunnelse for avslag..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowRejectForm(false)}>
                  Avbryt
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleReject}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                  Bekreft avslag
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          {isPending && !showRejectForm && (
            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(true)}
                disabled={saving}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Avslå
              </Button>
              <Button onClick={handleApprove} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                {editMode ? "Godkjenn (korrigert)" : useDeviation ? "Godkjenn med avvik" : "Godkjenn"}
              </Button>
            </div>
          )}

          {/* Already handled */}
          {!isPending && (
            <div className={cn(
              "rounded-lg p-4 text-center",
              entry.status === "approved" ? "bg-success/10" : "bg-destructive/10"
            )}>
              <Badge className={entry.status === "approved" ? "bg-success/20 text-success" : ""} variant={entry.status === "rejected" ? "destructive" : "outline"}>
                {entry.status === "approved" ? "Godkjent" : "Avvist"}
                {entry.approved_at && ` · ${format(new Date(entry.approved_at), "d. MMM yyyy", { locale: nb })}`}
              </Badge>
              {entry.manager_notes && (
                <p className="text-sm text-muted-foreground mt-2 italic">«{entry.manager_notes}»</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

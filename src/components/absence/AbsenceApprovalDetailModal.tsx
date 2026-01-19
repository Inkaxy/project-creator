import { useState, useMemo } from "react";
import { format, eachDayOfInterval, getISOWeek, isWeekend, startOfWeek, endOfWeek } from "date-fns";
import { nb } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, CheckCircle, XCircle, AlertTriangle, Loader2, Trash2, RotateCcw, Pencil } from "lucide-react";
import { AbsenceRequest, useApproveAbsenceRequest, useDeleteAbsenceRequest, useRevertAbsenceToStatus } from "@/hooks/useAbsenceRequests";
import { useEmployeeAccounts, getAvailableBalance, accountTypeLabels } from "@/hooks/useEmployeeAccounts";
import { useShifts, ShiftData, useUpdateShift, useDeleteShift } from "@/hooks/useShifts";
import { useFunctions } from "@/hooks/useFunctions";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface AbsenceApprovalDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  absence: AbsenceRequest;
  onApproved?: () => void;
}

type ShiftAction = "keep" | "delete" | "change_type";

export const AbsenceApprovalDetailModal = ({
  open,
  onOpenChange,
  absence,
  onApproved,
}: AbsenceApprovalDetailModalProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("accounts");
  const [shiftAction, setShiftAction] = useState<ShiftAction>("keep");
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>("");
  const [createOpenShifts, setCreateOpenShifts] = useState<"none" | "copy">("none");

  const { data: accounts } = useEmployeeAccounts(absence.employee_id);
  const { data: functions } = useFunctions();
  const approveAbsence = useApproveAbsenceRequest();
  const deleteAbsence = useDeleteAbsenceRequest();
  const revertAbsence = useRevertAbsenceToStatus();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();

  // Get overlapping shifts
  const { data: shifts } = useShifts(absence.start_date, absence.end_date);
  const overlappingShifts = useMemo(() => {
    if (!shifts) return [];
    return shifts.filter((s) => s.employee_id === absence.employee_id);
  }, [shifts, absence.employee_id]);

  // Account balance for this absence type
  const relevantAccount = useMemo(() => {
    if (!absence.absence_types?.from_account || !accounts) return undefined;
    return accounts.find((a) => a.account_type === absence.absence_types?.from_account);
  }, [absence.absence_types, accounts]);

  const availableBalance = getAvailableBalance(relevantAccount);

  // Calculate days by week for display
  const daysByWeek = useMemo(() => {
    const start = new Date(absence.start_date);
    const end = new Date(absence.end_date);
    const days = eachDayOfInterval({ start, end });
    
    const weeks: Record<number, Date[]> = {};
    days.forEach((day) => {
      const weekNum = getISOWeek(day);
      if (!weeks[weekNum]) weeks[weekNum] = [];
      weeks[weekNum].push(day);
    });
    
    return weeks;
  }, [absence.start_date, absence.end_date]);

  const handleApprove = async () => {
    try {
      // Handle overlapping shifts based on selected action
      if (overlappingShifts.length > 0) {
        for (const shift of overlappingShifts) {
          if (shiftAction === "delete") {
            await deleteShift.mutateAsync(shift.id);
          } else if (shiftAction === "change_type" && selectedFunctionId) {
            await updateShift.mutateAsync({
              id: shift.id,
              employee_id: null,
              status: "open",
              function_id: selectedFunctionId,
            });
          }
        }
      }

      await approveAbsence.mutateAsync({ id: absence.id, approved: true });
      onOpenChange(false);
      onApproved?.();
    } catch (error) {
      console.error("Approval failed:", error);
    }
  };

  const handleReject = async () => {
    try {
      await approveAbsence.mutateAsync({ id: absence.id, approved: false });
      onOpenChange(false);
    } catch (error) {
      console.error("Rejection failed:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAbsence.mutateAsync(absence.id);
      onOpenChange(false);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleRevertToPending = async () => {
    try {
      await revertAbsence.mutateAsync({ id: absence.id, status: "pending" });
      onOpenChange(false);
    } catch (error) {
      console.error("Revert failed:", error);
    }
  };

  const isPending = absence.status === "pending";
  const isApproved = absence.status === "approved";
  const isRejected = absence.status === "rejected";
  const isProcessing = approveAbsence.isPending || deleteAbsence.isPending || revertAbsence.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-start justify-between">
          <div>
            <DialogTitle>Fraværssøknad</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Opprettet: {format(new Date(absence.created_at), "d.M.yyyy, HH:mm", { locale: nb })}
            </p>
          </div>
          {isPending && (
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReject}
                disabled={isProcessing}
              >
                Avvis
              </Button>
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Godkjenn"
                )}
              </Button>
            </div>
          )}
          {(isApproved || isRejected) && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevertToPending}
                disabled={isProcessing}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Angre
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isProcessing}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Slett
              </Button>
            </div>
          )}
        </DialogHeader>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {isPending && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
              <Clock className="h-3 w-3 mr-1" />
              Avventer
            </Badge>
          )}
          {isApproved && (
            <Badge className="bg-success/10 text-success">
              <CheckCircle className="h-3 w-3 mr-1" />
              Godkjent
            </Badge>
          )}
          {isRejected && (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Avvist
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="accounts">Kontoer</TabsTrigger>
            <TabsTrigger value="history">Historikk</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="space-y-6 mt-4">
            {/* Employee info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AvatarWithInitials name={absence.profiles?.full_name || ""} size="lg" />
                <div>
                  <p className="font-semibold">{absence.profiles?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(absence.start_date), "d. MMMM", { locale: nb })} -{" "}
                    {format(new Date(absence.end_date), "d. MMMM yyyy", { locale: nb })} - {absence.total_days} dager
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total påvirkning av konto</p>
                <p className="text-xl font-bold">{absence.total_days} dager</p>
              </div>
            </div>

            {/* Account info */}
            {absence.absence_types?.from_account && (
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {absence.absence_types.name} ({new Date().getFullYear()})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tilgjengelig i dag: {availableBalance} dager
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Beløp</p>
                    <p className="font-medium">{absence.total_days} dager</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estimert saldo</p>
                    <p className="font-medium">
                      Tilgjengelig innen {format(new Date(absence.end_date), "d. MMM. yyyy", { locale: nb })}:{" "}
                      {Math.max(0, availableBalance - absence.total_days)} dager
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Week grid */}
            {Object.entries(daysByWeek).map(([weekNum, days]) => (
              <div key={weekNum} className="rounded-lg border bg-card p-4">
                <p className="font-medium mb-3">Uke {weekNum}</p>
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day) => {
                    const isWeekendDay = isWeekend(day);
                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "p-2 rounded text-center text-sm",
                          isWeekendDay
                            ? "bg-muted/30 text-muted-foreground"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        <p className="text-xs">
                          {format(day, "EEE. d. MMM", { locale: nb })}
                        </p>
                        <p className="font-medium mt-1">
                          {isWeekendDay ? "0,00" : "1,00"} {isWeekendDay ? "dager" : "dag"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Overlapping shifts */}
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold mb-2">Overlappende vakter</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Denne forespørselen overlapper med {overlappingShifts.length} tilordnede vakter
              </p>

              {isPending && overlappingShifts.length > 0 && (
                <>
                  <RadioGroup
                    value={shiftAction}
                    onValueChange={(v) => setShiftAction(v as ShiftAction)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="keep" id="modal-keep" />
                      <Label htmlFor="modal-keep" className="font-normal">
                        Behold vakter som de er
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="delete" id="modal-delete" />
                      <Label htmlFor="modal-delete" className="font-normal">
                        Slett vakt(er)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="change_type" id="modal-change" />
                      <Label htmlFor="modal-change" className="font-normal">
                        Behold og endre vakttype
                      </Label>
                    </div>
                  </RadioGroup>

                  {shiftAction === "change_type" && (
                    <div className="mt-4">
                      <Label className="text-sm">Vakttype*</Label>
                      <Select value={selectedFunctionId} onValueChange={setSelectedFunctionId}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Velg" />
                        </SelectTrigger>
                        <SelectContent>
                          {functions?.map((fn) => (
                            <SelectItem key={fn.id} value={fn.id}>
                              {fn.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}

              {!isPending && overlappingShifts.length > 0 && (
                <ul className="text-sm space-y-1">
                  {overlappingShifts.map((shift) => (
                    <li key={shift.id} className="text-muted-foreground">
                      {format(new Date(shift.date), "EEEE d. MMM", { locale: nb })}:{" "}
                      {shift.planned_start?.slice(0, 5)} - {shift.planned_end?.slice(0, 5)}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Extra shifts in schedule */}
            {isPending && (
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-semibold mb-2">Ekstra vakter i vaktplanen</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Du kan opprette ekstra vakter automatisk for å fylle ut vaktplanen for denne perioden.
                </p>
                <RadioGroup
                  value={createOpenShifts}
                  onValueChange={(v) => setCreateOpenShifts(v as typeof createOpenShifts)}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="no-extra" />
                    <Label htmlFor="no-extra" className="font-normal">
                      Ikke opprett ekstra vakter
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="copy" id="copy-open" />
                    <Label htmlFor="copy-open" className="font-normal">
                      Kopiere vakter og sett dem som ledige (for relevante grupper/funksjoner)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="space-y-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {format(new Date(absence.created_at), "d. MMM yyyy 'kl.' HH:mm", { locale: nb })}
                  </span>
                  <span>— Søknad opprettet</span>
                </div>
              </div>
              {absence.approved_at && (
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm">
                    {isApproved ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-muted-foreground">
                      {format(new Date(absence.approved_at), "d. MMM yyyy 'kl.' HH:mm", { locale: nb })}
                    </span>
                    <span>— {isApproved ? "Godkjent" : "Avvist"}</span>
                  </div>
                  {absence.rejection_reason && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Begrunnelse: {absence.rejection_reason}
                    </p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import {
  useOpenShifts,
  useApplyForShift,
  useReviewApplication,
  useWithdrawApplication,
  OpenShiftWithApplicants,
  ShiftApplicant,
} from "@/hooks/useOpenShifts";
import { Users, ChevronDown, ChevronUp, Check, X, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface OpenShiftsPanelProps {
  startDate: string;
  endDate: string;
  compact?: boolean;
}

export function OpenShiftsPanel({ startDate, endDate, compact = false }: OpenShiftsPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<OpenShiftWithApplicants | null>(null);
  const [applyNote, setApplyNote] = useState("");

  const { user, isAdminOrManager } = useAuth();
  const { data: openShifts = [], isLoading } = useOpenShifts(startDate, endDate);
  const applyMutation = useApplyForShift();
  const reviewMutation = useReviewApplication();
  const withdrawMutation = useWithdrawApplication();

  if (isLoading || openShifts.length === 0) return null;

  const handleApply = (shift: OpenShiftWithApplicants) => {
    setSelectedShift(shift);
    setApplyNote("");
    setApplyModalOpen(true);
  };

  const submitApplication = () => {
    if (!selectedShift) return;
    applyMutation.mutate(
      { shiftId: selectedShift.id, note: applyNote || undefined },
      { onSuccess: () => setApplyModalOpen(false) }
    );
  };

  const hasApplied = (shift: OpenShiftWithApplicants) => {
    return shift.applicants.some((a) => a.employee_id === user?.id);
  };

  const getMyApplication = (shift: OpenShiftWithApplicants) => {
    return shift.applicants.find((a) => a.employee_id === user?.id);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("nb-NO", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  if (compact) {
    return (
      <>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <Card className="border-primary/30 bg-primary/5">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-medium">
                      Ledige vakter
                    </CardTitle>
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {openShifts.length}
                    </Badge>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <ScrollArea className="max-h-[250px]">
                  <div className="space-y-2">
                    {openShifts.map((shift) => (
                      <OpenShiftCard
                        key={shift.id}
                        shift={shift}
                        isManager={isAdminOrManager()}
                        hasApplied={hasApplied(shift)}
                        myApplication={getMyApplication(shift)}
                        onApply={() => handleApply(shift)}
                        onWithdraw={(appId) => withdrawMutation.mutate(appId)}
                        onReview={(app, status) =>
                          reviewMutation.mutate({
                            applicationId: app.id,
                            shiftId: shift.id,
                            employeeId: app.employee_id,
                            status,
                          })
                        }
                        formatDate={formatDate}
                        compact
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <ApplyModal
          open={applyModalOpen}
          onOpenChange={setApplyModalOpen}
          shift={selectedShift}
          note={applyNote}
          onNoteChange={setApplyNote}
          onSubmit={submitApplication}
          isSubmitting={applyMutation.isPending}
          formatDate={formatDate}
        />
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Ledige vakter ({openShifts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {openShifts.map((shift) => (
                <OpenShiftCard
                  key={shift.id}
                  shift={shift}
                  isManager={isAdminOrManager()}
                  hasApplied={hasApplied(shift)}
                  myApplication={getMyApplication(shift)}
                  onApply={() => handleApply(shift)}
                  onWithdraw={(appId) => withdrawMutation.mutate(appId)}
                  onReview={(app, status) =>
                    reviewMutation.mutate({
                      applicationId: app.id,
                      shiftId: shift.id,
                      employeeId: app.employee_id,
                      status,
                    })
                  }
                  formatDate={formatDate}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <ApplyModal
        open={applyModalOpen}
        onOpenChange={setApplyModalOpen}
        shift={selectedShift}
        note={applyNote}
        onNoteChange={setApplyNote}
        onSubmit={submitApplication}
        isSubmitting={applyMutation.isPending}
        formatDate={formatDate}
      />
    </>
  );
}

interface OpenShiftCardProps {
  shift: OpenShiftWithApplicants;
  isManager: boolean;
  hasApplied: boolean;
  myApplication?: ShiftApplicant;
  onApply: () => void;
  onWithdraw: (appId: string) => void;
  onReview: (app: ShiftApplicant, status: "approved" | "rejected") => void;
  formatDate: (date: string) => string;
  compact?: boolean;
}

function OpenShiftCard({
  shift,
  isManager,
  hasApplied,
  myApplication,
  onApply,
  onWithdraw,
  onReview,
  formatDate,
  compact = false,
}: OpenShiftCardProps) {
  const pendingApplicants = shift.applicants.filter((a) => a.status === "pending");

  return (
    <div
      className={cn(
        "rounded-lg border border-primary/20 bg-primary/5 p-3",
        compact && "p-2"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {shift.functions && (
              <div
                className="h-2.5 w-2.5 rounded"
                style={{ backgroundColor: shift.functions.color || "#3B82F6" }}
              />
            )}
            <span className={cn("font-medium", compact && "text-sm")}>
              {shift.functions?.name || "Ukjent funksjon"}
            </span>
          </div>
          <div className={cn("mt-1 flex items-center gap-3 text-muted-foreground", compact && "text-xs")}>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(shift.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {shift.planned_start?.slice(0, 5)}-{shift.planned_end?.slice(0, 5)}
            </span>
          </div>
        </div>

        {/* Actions */}
        {!isManager && (
          <div className="shrink-0">
            {hasApplied ? (
              myApplication?.status === "pending" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onWithdraw(myApplication.id)}
                >
                  Trekk søknad
                </Button>
              ) : (
                <Badge
                  variant={myApplication?.status === "approved" ? "default" : "secondary"}
                  className={myApplication?.status === "rejected" ? "bg-destructive/10 text-destructive" : ""}
                >
                  {myApplication?.status === "approved" ? "Godkjent" : "Avslått"}
                </Badge>
              )
            ) : (
              <Button size="sm" onClick={onApply}>
                Søk
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Applicants (for managers) */}
      {isManager && pendingApplicants.length > 0 && (
        <div className="mt-3 border-t border-primary/10 pt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Søkere ({pendingApplicants.length})
          </p>
          <div className="space-y-2">
            {pendingApplicants.map((app) => (
              <div key={app.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AvatarWithInitials name={app.profiles?.full_name || "?"} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{app.profiles?.full_name}</p>
                    {app.note && (
                      <p className="text-xs text-muted-foreground">{app.note}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-primary hover:bg-primary/10"
                    onClick={() => onReview(app, "approved")}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => onReview(app, "rejected")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isManager && pendingApplicants.length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">Ingen søkere ennå</p>
      )}
    </div>
  );
}

interface ApplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: OpenShiftWithApplicants | null;
  note: string;
  onNoteChange: (note: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  formatDate: (date: string) => string;
}

function ApplyModal({
  open,
  onOpenChange,
  shift,
  note,
  onNoteChange,
  onSubmit,
  isSubmitting,
  formatDate,
}: ApplyModalProps) {
  if (!shift) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Søk på ledig vakt</DialogTitle>
          <DialogDescription>
            Send en søknad for denne vakten. En leder vil gjennomgå søknaden din.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              {shift.functions && (
                <div
                  className="h-3 w-3 rounded"
                  style={{ backgroundColor: shift.functions.color || "#3B82F6" }}
                />
              )}
              <span className="font-medium">{shift.functions?.name}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(shift.date)} • {shift.planned_start?.slice(0, 5)}-
              {shift.planned_end?.slice(0, 5)}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Melding til leder (valgfritt)
            </label>
            <Textarea
              placeholder="Legg til en kommentar..."
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Sender..." : "Send søknad"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

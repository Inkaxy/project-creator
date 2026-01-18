import { useState } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Calendar, Check, X, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { usePendingAbsenceRequests, useApproveAbsenceRequest, AbsenceRequest } from "@/hooks/useAbsenceRequests";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";

export const AbsenceApprovalsPanel = () => {
  const { data: requests, isLoading } = usePendingAbsenceRequests();
  const approveRequest = useApproveAbsenceRequest();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AbsenceRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = (id: string) => {
    approveRequest.mutate({ id, approved: true });
  };

  const handleRejectClick = (request: AbsenceRequest) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!selectedRequest) return;
    approveRequest.mutate(
      { id: selectedRequest.id, approved: false, rejectionReason },
      {
        onSuccess: () => {
          setRejectDialogOpen(false);
          setSelectedRequest(null);
          setRejectionReason("");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fraværssøknader til behandling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!requests?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fraværssøknader til behandling</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Check className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Ingen søknader venter på behandling</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Fraværssøknader til behandling
            <Badge variant="secondary">{requests.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex items-start gap-4 p-4 rounded-lg border bg-card"
            >
              <AvatarWithInitials
                name={request.profiles?.full_name || ""}
                className="h-10 w-10"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{request.profiles?.full_name}</span>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: request.absence_types?.color,
                      color: request.absence_types?.color,
                    }}
                  >
                    {request.absence_types?.name}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {format(new Date(request.start_date), "d. MMM", { locale: nb })} -{" "}
                  {format(new Date(request.end_date), "d. MMM yyyy", { locale: nb })}
                  <span className="mx-1">•</span>
                  {request.total_days} {request.total_days === 1 ? "dag" : "dager"}
                </p>

                {request.comment && (
                  <p className="text-sm text-muted-foreground mt-1 italic">
                    "{request.comment}"
                  </p>
                )}

                {request.overlapping_shift_action && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span>
                      Overlappende vakter:{" "}
                      {request.overlapping_shift_action === "keep"
                        ? "Beholdes"
                        : request.overlapping_shift_action === "delete"
                        ? "Slettes"
                        : "Gjøres ledige"}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleRejectClick(request)}
                  disabled={approveRequest.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApprove(request.id)}
                  disabled={approveRequest.isPending}
                >
                  {approveRequest.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avslå fraværssøknad</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Du er i ferd med å avslå fraværssøknaden fra{" "}
              <strong>{selectedRequest?.profiles?.full_name}</strong>.
            </p>
            <Textarea
              placeholder="Begrunnelse for avslag (valgfritt)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={approveRequest.isPending}
            >
              {approveRequest.isPending ? "Avslår..." : "Avslå søknad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Calendar, Clock, Trash2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useAbsenceRequests, useDeleteAbsenceRequest, AbsenceRequest } from "@/hooks/useAbsenceRequests";
import { useAuth } from "@/contexts/AuthContext";

interface AbsenceListProps {
  showAll?: boolean;
}

const statusConfig = {
  pending: {
    label: "Venter",
    variant: "secondary" as const,
    icon: Clock,
  },
  approved: {
    label: "Godkjent",
    variant: "default" as const,
    icon: CheckCircle2,
  },
  rejected: {
    label: "Avslått",
    variant: "destructive" as const,
    icon: XCircle,
  },
};

export const AbsenceList = ({ showAll = false }: AbsenceListProps) => {
  const { user } = useAuth();
  const { data: requests, isLoading } = useAbsenceRequests(showAll ? undefined : user?.id);
  const deleteRequest = useDeleteAbsenceRequest();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mine fraværssøknader</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
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
          <CardTitle>{showAll ? "Fraværssøknader" : "Mine fraværssøknader"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Ingen fraværssøknader</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{showAll ? "Fraværssøknader" : "Mine fraværssøknader"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((request) => (
          <AbsenceRequestItem
            key={request.id}
            request={request}
            showEmployee={showAll}
            onDelete={() => deleteRequest.mutate(request.id)}
            isDeleting={deleteRequest.isPending}
          />
        ))}
      </CardContent>
    </Card>
  );
};

interface AbsenceRequestItemProps {
  request: AbsenceRequest;
  showEmployee?: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}

const AbsenceRequestItem = ({
  request,
  showEmployee,
  onDelete,
  isDeleting,
}: AbsenceRequestItemProps) => {
  const status = statusConfig[request.status];
  const StatusIcon = status.icon;

  return (
    <div className="flex items-start gap-4 p-3 rounded-lg border bg-card">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${request.absence_types?.color}20` }}
      >
        <Calendar className="h-5 w-5" style={{ color: request.absence_types?.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{request.absence_types?.name}</span>
          <Badge variant={status.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>

        {showEmployee && request.profiles && (
          <p className="text-sm text-muted-foreground">{request.profiles.full_name}</p>
        )}

        <p className="text-sm text-muted-foreground mt-1">
          {format(new Date(request.start_date), "d. MMM", { locale: nb })} -{" "}
          {format(new Date(request.end_date), "d. MMM yyyy", { locale: nb })}
          <span className="mx-1">•</span>
          {request.total_days} {request.total_days === 1 ? "dag" : "dager"}
        </p>

        {request.comment && (
          <p className="text-sm text-muted-foreground mt-1 italic">"{request.comment}"</p>
        )}

        {request.rejection_reason && (
          <p className="text-sm text-destructive mt-1">
            Avslågrunn: {request.rejection_reason}
          </p>
        )}
      </div>

      {request.status === "pending" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Slett søknad?</AlertDialogTitle>
              <AlertDialogDescription>
                Er du sikker på at du vil slette denne fraværssøknaden? Dette kan ikke angres.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Slett</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAllPoolShiftRequests, useReviewPoolShiftRequest } from "@/hooks/useCrewshare";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Briefcase, Loader2, Check, X } from "lucide-react";

export function PoolShiftRequestsPanel() {
  const { data: requests, isLoading } = useAllPoolShiftRequests();
  const reviewMutation = useReviewPoolShiftRequest();

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const pendingRequests = requests?.filter(r => r.status === 'pending_employer') || [];

  if (!pendingRequests.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Ingen ventende forespørsler</h3>
          <p className="text-muted-foreground">Alle forespørsler er behandlet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pendingRequests.map((request) => (
        <Card key={request.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{request.employee?.full_name}</CardTitle>
              <Badge variant="secondary">Venter på godkjenning</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{request.pool_shift?.title}</p>
            <p className="text-sm text-muted-foreground mb-3">
              {request.pool_shift?.partner_organization?.name} • {request.pool_shift?.date && format(new Date(request.pool_shift.date), "d. MMM", { locale: nb })}
            </p>
            {request.employee_note && (
              <p className="text-sm bg-muted p-2 rounded mb-3">"{request.employee_note}"</p>
            )}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => reviewMutation.mutate({ request_id: request.id, action: 'reject' })} disabled={reviewMutation.isPending}>
                <X className="h-4 w-4 mr-1" /> Avslå
              </Button>
              <Button size="sm" onClick={() => reviewMutation.mutate({ request_id: request.id, action: 'approve' })} disabled={reviewMutation.isPending}>
                <Check className="h-4 w-4 mr-1" /> Godkjenn
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { StatusBadge } from "@/components/ui/status-badge";
import { useWageAdjustments, useUpdateWageAdjustmentStatus } from "@/hooks/useWageAdjustments";
import { DollarSign, ArrowRight, TrendingUp, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export function PendingWageAdjustmentsWidget() {
  const { data: pendingAdjustments = [], isLoading } = useWageAdjustments("pending");
  const updateStatus = useUpdateWageAdjustmentStatus();

  const totalPendingAmount = pendingAdjustments.reduce(
    (sum, adj) => sum + adj.total_adjustment,
    0
  );

  const handleApprove = (id: string) => {
    updateStatus.mutate({ id, status: "approved" });
  };

  const handleReject = (id: string) => {
    updateStatus.mutate({ id, status: "rejected" });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-warning" />
            Ventende etterbetalinger
          </CardTitle>
          <CardDescription>
            {pendingAdjustments.length} ventende • {totalPendingAmount.toLocaleString("nb-NO")} kr totalt
          </CardDescription>
        </div>
        {pendingAdjustments.length > 0 && (
          <Badge variant="warning" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {pendingAdjustments.length}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {pendingAdjustments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <TrendingUp className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Ingen ventende etterbetalinger
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingAdjustments.slice(0, 3).map((adjustment) => (
              <div
                key={adjustment.id}
                className="rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start gap-3">
                  <AvatarWithInitials 
                    name={adjustment.employee?.full_name || "Ukjent"} 
                    size="sm" 
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {adjustment.employee?.full_name || "Ukjent ansatt"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {format(new Date(adjustment.period_start), "d. MMM", { locale: nb })} - {format(new Date(adjustment.period_end), "d. MMM yyyy", { locale: nb })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status="pending" label="Venter" />
                      <span className="text-sm font-semibold text-primary">
                        +{adjustment.total_adjustment.toLocaleString("nb-NO")} kr
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleApprove(adjustment.id)}
                    disabled={updateStatus.isPending}
                  >
                    Godkjenn
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleReject(adjustment.id)}
                    disabled={updateStatus.isPending}
                  >
                    Avslå
                  </Button>
                </div>
              </div>
            ))}

            {pendingAdjustments.length > 3 && (
              <p className="text-center text-xs text-muted-foreground">
                + {pendingAdjustments.length - 3} flere ventende
              </p>
            )}
          </div>
        )}

        <Button variant="ghost" className="mt-4 w-full" asChild>
          <Link to="/lonnstillegg">
            Se alle etterbetalinger <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

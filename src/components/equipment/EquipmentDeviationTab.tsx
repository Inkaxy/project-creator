import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, AlertTriangle, CheckCircle } from "lucide-react";
import { useEquipmentDeviations } from "@/hooks/useEquipmentDeviations";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { EquipmentDeviationModal } from "./EquipmentDeviationModal";

interface EquipmentDeviationTabProps {
  equipmentId: string;
}

function getSeverityBadge(severity: string) {
  const severityMap: Record<string, { label: string; className: string }> = {
    low: { label: "Lav", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    medium: { label: "Medium", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
    high: { label: "Høy", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
    critical: { label: "Kritisk", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  };
  const config = severityMap[severity] || severityMap.medium;
  return <Badge className={config.className}>{config.label}</Badge>;
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    new: { label: "Ny", variant: "destructive" },
    in_review: { label: "Under vurdering", variant: "secondary" },
    action_planned: { label: "Tiltak planlagt", variant: "secondary" },
    in_progress: { label: "Pågår", variant: "outline" },
    resolved: { label: "Løst", variant: "default" },
    closed: { label: "Lukket", variant: "default" },
  };
  const config = statusMap[status] || statusMap.new;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function EquipmentDeviationTab({ equipmentId }: EquipmentDeviationTabProps) {
  const [showModal, setShowModal] = useState(false);
  const { data: deviations, isLoading } = useEquipmentDeviations(equipmentId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const openDeviations = deviations?.filter(
    (d) => !["resolved", "closed"].includes(d.status)
  ) || [];
  const closedDeviations = deviations?.filter(
    (d) => ["resolved", "closed"].includes(d.status)
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Avvik</h3>
          <p className="text-sm text-muted-foreground">
            {openDeviations.length} åpne avvik
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Meld avvik
        </Button>
      </div>

      {/* Open Deviations */}
      {openDeviations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Åpne avvik ({openDeviations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {openDeviations.map((deviation) => (
              <div
                key={deviation.id}
                className="rounded-lg border p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{deviation.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Meldt {format(new Date(deviation.created_at), "d. MMM yyyy 'kl.' HH:mm", { locale: nb })}
                      {deviation.reporter && ` av ${deviation.reporter.full_name}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {getSeverityBadge(deviation.severity)}
                    {getStatusBadge(deviation.status)}
                  </div>
                </div>
                {deviation.description && (
                  <p className="text-sm">{deviation.description}</p>
                )}
                {deviation.images && deviation.images.length > 0 && (
                  <div className="flex gap-2">
                    {deviation.images.slice(0, 3).map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Avviksbilde ${i + 1}`}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                    ))}
                    {deviation.images.length > 3 && (
                      <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted text-sm">
                        +{deviation.images.length - 3}
                      </div>
                    )}
                  </div>
                )}
                {deviation.assignee && (
                  <p className="text-sm text-muted-foreground">
                    Tildelt: {deviation.assignee.full_name}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Closed Deviations */}
      {closedDeviations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Lukkede avvik ({closedDeviations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {closedDeviations.map((deviation) => (
              <div
                key={deviation.id}
                className="rounded-lg border p-4 space-y-2 opacity-75"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{deviation.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Meldt {format(new Date(deviation.created_at), "d. MMM yyyy", { locale: nb })}
                      {deviation.resolved_at && (
                        <> • Løst {format(new Date(deviation.resolved_at), "d. MMM yyyy", { locale: nb })}</>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {getSeverityBadge(deviation.severity)}
                    {getStatusBadge(deviation.status)}
                  </div>
                </div>
                {deviation.resolution && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Løsning: </span>
                    {deviation.resolution}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!deviations || deviations.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="font-semibold">Ingen avvik</h3>
            <p className="text-muted-foreground">
              Det er ikke meldt noen avvik på dette utstyret
            </p>
          </CardContent>
        </Card>
      )}

      <EquipmentDeviationModal
        open={showModal}
        onOpenChange={setShowModal}
        equipmentId={equipmentId}
      />
    </div>
  );
}

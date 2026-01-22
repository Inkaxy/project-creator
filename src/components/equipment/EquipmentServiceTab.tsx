import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Calendar, Wrench, Clock } from "lucide-react";
import { useEquipmentServiceIntervals, useEquipmentServices } from "@/hooks/useEquipmentServices";
import { format, differenceInDays, isPast } from "date-fns";
import { nb } from "date-fns/locale";
import { EquipmentServiceModal } from "./EquipmentServiceModal";

interface EquipmentServiceTabProps {
  equipmentId: string;
}

function getDueBadge(nextDue: string | null) {
  if (!nextDue) return null;
  
  const dueDate = new Date(nextDue);
  const daysUntil = differenceInDays(dueDate, new Date());
  
  if (isPast(dueDate)) {
    return <Badge variant="destructive">Forfalt ({Math.abs(daysUntil)} dager siden)</Badge>;
  }
  if (daysUntil <= 7) {
    return <Badge variant="destructive">Om {daysUntil} dager</Badge>;
  }
  if (daysUntil <= 30) {
    return <Badge className="bg-yellow-100 text-yellow-800">Om {daysUntil} dager</Badge>;
  }
  return <Badge variant="secondary">Om {daysUntil} dager</Badge>;
}

function getServiceTypeBadge(type: string) {
  const typeMap: Record<string, { label: string; className: string }> = {
    planned: { label: "Planlagt", className: "bg-blue-100 text-blue-800" },
    preventive: { label: "Forebyggende", className: "bg-green-100 text-green-800" },
    repair: { label: "Reparasjon", className: "bg-orange-100 text-orange-800" },
    warranty: { label: "Garanti", className: "bg-purple-100 text-purple-800" },
    calibration: { label: "Kalibrering", className: "bg-cyan-100 text-cyan-800" },
    certification: { label: "Sertifisering", className: "bg-indigo-100 text-indigo-800" },
  };
  const config = typeMap[type] || { label: type, className: "" };
  return <Badge className={config.className}>{config.label}</Badge>;
}

export function EquipmentServiceTab({ equipmentId }: EquipmentServiceTabProps) {
  const [showServiceModal, setShowServiceModal] = useState(false);
  const { data: intervals, isLoading: intervalsLoading } = useEquipmentServiceIntervals(equipmentId);
  const { data: services, isLoading: servicesLoading } = useEquipmentServices(equipmentId);

  if (intervalsLoading || servicesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Intervals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Serviceintervaller</CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Legg til intervall
          </Button>
        </CardHeader>
        <CardContent>
          {intervals && intervals.length > 0 ? (
            <div className="space-y-4">
              {intervals.map((interval) => (
                <div
                  key={interval.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-muted p-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{interval.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Hver {interval.interval_value}{" "}
                        {interval.interval_type === "days" && "dag(er)"}
                        {interval.interval_type === "weeks" && "uke(r)"}
                        {interval.interval_type === "months" && "måned(er)"}
                        {interval.interval_type === "years" && "år"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {interval.next_due && (
                      <>
                        <p className="text-sm text-muted-foreground">Neste</p>
                        <p className="font-medium">
                          {format(new Date(interval.next_due), "d. MMM yyyy", { locale: nb })}
                        </p>
                        {getDueBadge(interval.next_due)}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="mx-auto h-8 w-8 mb-2" />
              <p>Ingen serviceintervaller definert</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Servicehistorikk</CardTitle>
          <Button size="sm" onClick={() => setShowServiceModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Registrer service
          </Button>
        </CardHeader>
        <CardContent>
          {services && services.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              
              <div className="space-y-6">
                {services.map((service, index) => (
                  <div key={service.id} className="relative flex gap-4 pl-10">
                    {/* Timeline dot */}
                    <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                    
                    <div className="flex-1 rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {format(new Date(service.performed_date), "d. MMMM yyyy", { locale: nb })}
                            </p>
                            {getServiceTypeBadge(service.service_type)}
                          </div>
                          {service.service_interval && (
                            <p className="text-sm text-muted-foreground">
                              {service.service_interval.name}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          {(service.cost_labor || service.cost_parts) && (
                            <p className="font-medium">
                              {((service.cost_labor || 0) + (service.cost_parts || 0)).toLocaleString("nb-NO")} kr
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {service.description && (
                        <p className="mt-2 text-sm">{service.description}</p>
                      )}
                      
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {service.performed_by?.full_name && (
                          <span>Utført av: {service.performed_by.full_name}</span>
                        )}
                        {service.performed_by_external && (
                          <span>Utført av: {service.performed_by_external}</span>
                        )}
                        {service.supplier?.name && (
                          <span>Leverandør: {service.supplier.name}</span>
                        )}
                        {service.invoice_number && (
                          <span>Faktura: {service.invoice_number}</span>
                        )}
                      </div>
                      
                      {service.parts_replaced && (
                        <p className="mt-2 text-sm">
                          <span className="text-muted-foreground">Deler byttet: </span>
                          {service.parts_replaced}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="mx-auto h-8 w-8 mb-2" />
              <p>Ingen service registrert ennå</p>
            </div>
          )}
        </CardContent>
      </Card>

      <EquipmentServiceModal
        open={showServiceModal}
        onOpenChange={setShowServiceModal}
        equipmentId={equipmentId}
        intervals={intervals || []}
      />
    </div>
  );
}

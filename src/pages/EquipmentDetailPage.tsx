import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit, Phone, AlertTriangle } from "lucide-react";
import { useEquipment } from "@/hooks/useEquipment";
import { EquipmentOverviewTab } from "@/components/equipment/EquipmentOverviewTab";
import { EquipmentServiceTab } from "@/components/equipment/EquipmentServiceTab";
import { EquipmentDeviationTab } from "@/components/equipment/EquipmentDeviationTab";
import { EquipmentDocumentsTab } from "@/components/equipment/EquipmentDocumentsTab";
import { EquipmentFormModal } from "@/components/equipment/EquipmentFormModal";
import { useState } from "react";

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
    in_operation: { label: "I drift", variant: "default", color: "🟢" },
    service_scheduled: { label: "Service planlagt", variant: "secondary", color: "🟡" },
    under_repair: { label: "Under reparasjon", variant: "outline", color: "🟠" },
    out_of_service: { label: "Ute av drift", variant: "destructive", color: "🔴" },
  };
  const config = statusMap[status] || statusMap.in_operation;
  return (
    <Badge variant={config.variant} className="gap-1">
      <span>{config.color}</span>
      {config.label}
    </Badge>
  );
}

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: equipment, isLoading } = useEquipment(id || null);
  const [showEditModal, setShowEditModal] = useState(false);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!equipment) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold">Utstyr ikke funnet</h2>
          <Button variant="link" onClick={() => navigate("/utstyr")}>
            Tilbake til utstyrsliste
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/utstyr")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              {equipment.image_url ? (
                <img
                  src={equipment.image_url}
                  alt={equipment.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted text-2xl">
                  {equipment.category?.icon || "📦"}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{equipment.name}</h1>
                  {getStatusBadge(equipment.status)}
                </div>
                <p className="text-muted-foreground">
                  {[equipment.brand, equipment.model].filter(Boolean).join(" ")}
                  {equipment.serial_number && ` • SN: ${equipment.serial_number}`}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {equipment.supplier && (
              <Button variant="outline" asChild>
                <a href={`tel:${(equipment.supplier as { phone_service?: string }).phone_service || (equipment.supplier as { phone_main?: string }).phone_main}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  Ring service
                </a>
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowEditModal(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Rediger
            </Button>
            <Button variant="destructive">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Meld avvik
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
            <TabsTrigger value="service">Service</TabsTrigger>
            <TabsTrigger value="deviations">Avvik</TabsTrigger>
            <TabsTrigger value="documents">Dokumenter</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <EquipmentOverviewTab equipment={equipment} />
          </TabsContent>

          <TabsContent value="service">
            <EquipmentServiceTab equipmentId={equipment.id} />
          </TabsContent>

          <TabsContent value="deviations">
            <EquipmentDeviationTab equipmentId={equipment.id} />
          </TabsContent>

          <TabsContent value="documents">
            <EquipmentDocumentsTab equipmentId={equipment.id} />
          </TabsContent>
        </Tabs>
      </div>

      <EquipmentFormModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        equipment={equipment}
      />
    </MainLayout>
  );
}

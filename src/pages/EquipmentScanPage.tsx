import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Camera, 
  QrCode, 
  Eye, 
  AlertTriangle, 
  Phone, 
  ClipboardList,
  Wrench
} from "lucide-react";
import { useQRScanner, parseEquipmentQRCode } from "@/hooks/useQRScanner";
import { useEquipmentByQRCode } from "@/hooks/useEquipment";
import { EquipmentDeviationModal } from "@/components/equipment/EquipmentDeviationModal";

export default function EquipmentScanPage() {
  const navigate = useNavigate();
  const [scannedEquipmentId, setScannedEquipmentId] = useState<string | null>(null);
  const [showDeviationModal, setShowDeviationModal] = useState(false);

  const {
    containerId,
    isScanning,
    scannedCode,
    error,
    startScanning,
    stopScanning,
    resetScanner,
  } = useQRScanner({
    onScan: (code) => {
      const equipmentId = parseEquipmentQRCode(code);
      if (equipmentId) {
        setScannedEquipmentId(code); // Use the raw QR code to query
      }
    },
  });

  const { data: equipment, isLoading } = useEquipmentByQRCode(scannedEquipmentId);

  // Start scanning on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startScanning();
    }, 500);
    return () => {
      clearTimeout(timer);
      stopScanning();
    };
  }, []);

  const handleScanAgain = () => {
    setScannedEquipmentId(null);
    resetScanner();
    startScanning();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/utstyr")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Skann QR-kode</h1>
            <p className="text-muted-foreground">
              Skann QR-koden på utstyret for å se info eller melde avvik
            </p>
          </div>
        </div>

        {/* Scanner or Result */}
        {!equipment ? (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Scanner Container */}
              <div className="relative aspect-square max-h-[60vh] bg-black">
                <div id={containerId} className="h-full w-full" />
                
                {/* Overlay with scanning frame */}
                {isScanning && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="relative h-64 w-64">
                      {/* Corner markers */}
                      <div className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-primary" />
                      <div className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-primary" />
                      <div className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-primary" />
                      <div className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-primary" />
                      
                      {/* Scanning line animation */}
                      <div className="absolute left-0 right-0 h-0.5 animate-pulse bg-primary" style={{ top: '50%' }} />
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 p-4 text-center">
                    <div>
                      <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="font-medium">{error}</p>
                      <Button className="mt-4" onClick={startScanning}>
                        Prøv igjen
                      </Button>
                    </div>
                  </div>
                )}

                {/* Loading state after scan */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <div className="text-center">
                      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      <p className="mt-4">Laster utstyr...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="p-4 text-center">
                <p className="flex items-center justify-center gap-2 text-muted-foreground">
                  <QrCode className="h-5 w-5" />
                  Hold kameraet over QR-koden
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Equipment Result Panel */
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {equipment.image_url ? (
                    <img
                      src={equipment.image_url}
                      alt={equipment.name}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted text-3xl">
                      {equipment.category?.icon || "📦"}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">{equipment.name}</h2>
                      <Badge variant={equipment.status === "in_operation" ? "default" : "secondary"}>
                        {equipment.status === "in_operation" && "🟢 I drift"}
                        {equipment.status === "service_scheduled" && "🟡 Service planlagt"}
                        {equipment.status === "under_repair" && "🟠 Under reparasjon"}
                        {equipment.status === "out_of_service" && "🔴 Ute av drift"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      {[equipment.brand, equipment.model].filter(Boolean).join(" ")}
                    </p>
                    {equipment.category && (
                      <p className="text-sm text-muted-foreground">
                        {equipment.category.icon} {equipment.category.name}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                size="lg"
                className="h-auto flex-col gap-2 py-4"
                onClick={() => navigate(`/utstyr/${equipment.id}`)}
              >
                <Eye className="h-6 w-6" />
                Se detaljer
              </Button>
              
              <Button
                size="lg"
                variant="destructive"
                className="h-auto flex-col gap-2 py-4"
                onClick={() => setShowDeviationModal(true)}
              >
                <AlertTriangle className="h-6 w-6" />
                Meld avvik
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
              >
                <ClipboardList className="h-6 w-6" />
                Utfør sjekkliste
              </Button>
              
              {equipment.supplier && (
                <Button
                  size="lg"
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4"
                  asChild
                >
                  <a href={`tel:${(equipment.supplier as { phone_service?: string }).phone_service || (equipment.supplier as { phone_main?: string }).phone_main}`}>
                    <Phone className="h-6 w-6" />
                    Ring service
                  </a>
                </Button>
              )}
            </div>

            {/* Scan Again Button */}
            <Button
              variant="ghost"
              className="w-full"
              onClick={handleScanAgain}
            >
              <QrCode className="mr-2 h-4 w-4" />
              Skann ny QR-kode
            </Button>
          </div>
        )}
      </div>

      {equipment && (
        <EquipmentDeviationModal
          open={showDeviationModal}
          onOpenChange={setShowDeviationModal}
          equipmentId={equipment.id}
        />
      )}
    </MainLayout>
  );
}

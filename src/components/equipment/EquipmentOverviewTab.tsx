import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import type { Equipment } from "@/hooks/useEquipment";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface EquipmentOverviewTabProps {
  equipment: Equipment;
}

function getCriticalityBadge(criticality: string) {
  const criticalityMap: Record<string, { label: string; className: string }> = {
    low: { label: "Lav", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    medium: { label: "Medium", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
    high: { label: "Høy", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
    critical: { label: "Kritisk", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  };
  const config = criticalityMap[criticality] || criticalityMap.medium;
  return <Badge className={config.className}>{config.label}</Badge>;
}

function getOwnershipLabel(type: string) {
  const map: Record<string, string> = {
    owned: "Eid",
    leased: "Leaset",
    borrowed: "Lånt",
  };
  return map[type] || type;
}

export function EquipmentOverviewTab({ equipment }: EquipmentOverviewTabProps) {
  const qrValue = `crewplan://equipment/${equipment.id}`;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* QR Code Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">QR-kode</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="rounded-lg bg-white p-4">
            <QRCodeSVG
              value={qrValue}
              size={160}
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Skann for å se info eller melde avvik
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {equipment.qr_code}
          </p>
        </CardContent>
      </Card>

      {/* Basic Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grunndata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Kategori</p>
              <p className="font-medium">
                {equipment.category?.icon} {equipment.category?.name || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kritikalitet</p>
              {getCriticalityBadge(equipment.criticality)}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Merke</p>
              <p className="font-medium">{equipment.brand || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Modell</p>
              <p className="font-medium">{equipment.model || "-"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Serienummer</p>
              <p className="font-mono font-medium">{equipment.serial_number || "-"}</p>
            </div>
          </div>
          {equipment.description && (
            <div>
              <p className="text-sm text-muted-foreground">Beskrivelse</p>
              <p className="text-sm">{equipment.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plassering & Ansvar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Lokasjon</p>
            <p className="font-medium">{equipment.location?.name || "-"}</p>
          </div>
          {equipment.location_description && (
            <div>
              <p className="text-sm text-muted-foreground">Nærmere plassering</p>
              <p className="font-medium">{equipment.location_description}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Avdeling</p>
            <p className="font-medium">{equipment.department?.name || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ansvarlig</p>
            <p className="font-medium">{equipment.responsible?.full_name || "-"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Purchase & Warranty Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anskaffelse & Garanti</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Eierform</p>
              <p className="font-medium">{getOwnershipLabel(equipment.ownership_type)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Innkjøpsdato</p>
              <p className="font-medium">
                {equipment.purchase_date
                  ? format(new Date(equipment.purchase_date), "d. MMM yyyy", { locale: nb })
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Innkjøpspris</p>
              <p className="font-medium">
                {equipment.purchase_price
                  ? `${equipment.purchase_price.toLocaleString("nb-NO")} kr`
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Garanti utløper</p>
              <p className="font-medium">
                {equipment.warranty_expires
                  ? format(new Date(equipment.warranty_expires), "d. MMM yyyy", { locale: nb })
                  : "-"}
              </p>
            </div>
          </div>
          {equipment.ownership_type === "leased" && (
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div>
                <p className="text-sm text-muted-foreground">Leasingkost/mnd</p>
                <p className="font-medium">
                  {equipment.lease_monthly_cost
                    ? `${equipment.lease_monthly_cost.toLocaleString("nb-NO")} kr`
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leasing utløper</p>
                <p className="font-medium">
                  {equipment.lease_expires
                    ? format(new Date(equipment.lease_expires), "d. MMM yyyy", { locale: nb })
                    : "-"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supplier Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leverandør</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {equipment.supplier ? (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Firma</p>
                <p className="font-medium">{equipment.supplier.name}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`tel:${equipment.supplier.name}`}
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
                >
                  📞 Ring
                </a>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Ingen leverandør registrert</p>
          )}
        </CardContent>
      </Card>

      {/* Notes Card */}
      {equipment.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notater</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{equipment.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

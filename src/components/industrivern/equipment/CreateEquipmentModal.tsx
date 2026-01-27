import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateEquipment } from "@/hooks/useIndustrivernEquipment";
import { IV_EQUIPMENT_CATEGORY_LABELS, IVEquipmentCategory } from "@/types/industrivern";

interface CreateEquipmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateEquipmentModal({ open, onOpenChange }: CreateEquipmentModalProps) {
  const createEquipment = useCreateEquipment();

  const [category, setCategory] = useState<IVEquipmentCategory | "">("");
  const [equipmentType, setEquipmentType] = useState("");
  const [name, setName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [inventoryNumber, setInventoryNumber] = useState("");
  const [location, setLocation] = useState("");
  const [locationDetails, setLocationDetails] = useState("");
  const [inspectionInterval, setInspectionInterval] = useState("12");
  const [lastInspection, setLastInspection] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !equipmentType || !name || !location) return;

    const nextInspection = lastInspection
      ? calculateNextInspection(lastInspection, parseInt(inspectionInterval))
      : undefined;

    createEquipment.mutate(
      {
        category: category as IVEquipmentCategory,
        equipment_type: equipmentType,
        name,
        serial_number: serialNumber || undefined,
        inventory_number: inventoryNumber || undefined,
        location,
        location_details: locationDetails || undefined,
        inspection_interval_months: parseInt(inspectionInterval),
        last_inspection_date: lastInspection || undefined,
        next_inspection_date: nextInspection,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      }
    );
  };

  const calculateNextInspection = (lastDate: string, intervalMonths: number): string => {
    const date = new Date(lastDate);
    date.setMonth(date.getMonth() + intervalMonths);
    return date.toISOString().split("T")[0];
  };

  const resetForm = () => {
    setCategory("");
    setEquipmentType("");
    setName("");
    setSerialNumber("");
    setInventoryNumber("");
    setLocation("");
    setLocationDetails("");
    setInspectionInterval("12");
    setLastInspection("");
  };

  const EQUIPMENT_TYPES: Record<IVEquipmentCategory, string[]> = {
    personlig_verneutstyr: ["Hjelm", "Vernestøvler", "Vernebriller", "Hansker", "Hørselvern", "Åndedrettsvern"],
    forstehjelp: ["Førstehjelpskoffert", "Hjertestarter", "Øyeskyllflaske", "Båre", "Førstehjelpsstasjon"],
    brannvern: ["Brannslukker", "Brannslange", "Brannteppe", "Røykvarsler", "Brannalarm", "Sprinkleranlegg"],
    kjemikalievern: ["Kjemikaliedress", "Gassmåler", "Nøddusj", "Spillkit", "Vernemaske"],
    kommunikasjon: ["Radio", "Megafon", "Nødtelefon", "Alarmknapp", "PA-system"],
    annet: ["Lommelykt", "Verktøy", "Tau", "Stige", "Annet utstyr"],
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Legg til beredskapsutstyr</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori *</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as IVEquipmentCategory);
                  setEquipmentType("");
                }}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                required
              >
                <option value="">Velg kategori...</option>
                {Object.entries(IV_EQUIPMENT_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment-type">Type utstyr *</Label>
              <select
                id="equipment-type"
                value={equipmentType}
                onChange={(e) => setEquipmentType(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                required
                disabled={!category}
              >
                <option value="">Velg type...</option>
                {category &&
                  EQUIPMENT_TYPES[category as IVEquipmentCategory]?.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Navn/beskrivelse *</Label>
            <Input
              id="name"
              placeholder="F.eks. 'Brannslukker ABC 6kg'"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serial-number">Serienummer</Label>
              <Input
                id="serial-number"
                placeholder="Produsentens serienummer"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inventory-number">Inventarnummer</Label>
              <Input
                id="inventory-number"
                placeholder="Intern ID"
                value={inventoryNumber}
                onChange={(e) => setInventoryNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Lokasjon *</Label>
              <Input
                id="location"
                placeholder="F.eks. 'Hovedbygg'"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-details">Detaljer</Label>
              <Input
                id="location-details"
                placeholder="F.eks. '2. etasje, ved trappen'"
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inspection-interval">Kontrollintervall (mnd)</Label>
              <Input
                id="inspection-interval"
                type="number"
                min="1"
                max="60"
                value={inspectionInterval}
                onChange={(e) => setInspectionInterval(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-inspection">Siste kontroll</Label>
              <Input
                id="last-inspection"
                type="date"
                value={lastInspection}
                onChange={(e) => setLastInspection(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={createEquipment.isPending}>
              {createEquipment.isPending ? "Legger til..." : "Legg til utstyr"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

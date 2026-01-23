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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateEquipment, useUpdateEquipment, type Equipment } from "@/hooks/useEquipment";
import { useEquipmentCategories } from "@/hooks/useEquipmentCategories";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useEmployees } from "@/hooks/useEmployees";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name, color")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

interface EquipmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment?: Equipment | null;
}

export function EquipmentFormModal({
  open,
  onOpenChange,
  equipment,
}: EquipmentFormModalProps) {
  const { toast } = useToast();
  const createEquipment = useCreateEquipment();
  const updateEquipment = useUpdateEquipment();
  const { data: categories } = useEquipmentCategories();
  const { data: suppliers } = useSuppliers();
  const { data: employees } = useEmployees();
  const { data: departments } = useDepartments();

  const [formData, setFormData] = useState({
    name: equipment?.name || "",
    description: equipment?.description || "",
    category_id: equipment?.category_id || "",
    department_id: equipment?.department_id || "",
    supplier_id: equipment?.supplier_id || "",
    responsible_employee_id: equipment?.responsible_employee_id || "",
    brand: equipment?.brand || "",
    model: equipment?.model || "",
    serial_number: equipment?.serial_number || "",
    status: equipment?.status || "in_operation",
    criticality: equipment?.criticality || "medium",
    ownership_type: equipment?.ownership_type || "owned",
    location_description: equipment?.location_description || "",
    notes: equipment?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Feil",
        description: "Navn er påkrevd",
        variant: "destructive",
      });
      return;
    }

    try {
      if (equipment) {
        await updateEquipment.mutateAsync({
          id: equipment.id,
          ...formData,
          category_id: formData.category_id || null,
          department_id: formData.department_id || null,
          supplier_id: formData.supplier_id || null,
          responsible_employee_id: formData.responsible_employee_id || null,
        });
        toast({
          title: "Oppdatert",
          description: "Utstyret ble oppdatert",
        });
      } else {
        await createEquipment.mutateAsync({
          ...formData,
          category_id: formData.category_id || null,
          department_id: formData.department_id || null,
          supplier_id: formData.supplier_id || null,
          responsible_employee_id: formData.responsible_employee_id || null,
        });
        toast({
          title: "Opprettet",
          description: "Nytt utstyr ble lagt til",
        });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke lagre utstyr",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {equipment ? "Rediger utstyr" : "Legg til nytt utstyr"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Navn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="F.eks. Kombidamper Rational"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
            </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Avdeling</Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) => setFormData({ ...formData, department_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg avdeling" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Leverandør</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg leverandør" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((sup) => (
                    <SelectItem key={sup.id} value={sup.id}>
                      {sup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Merke</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="F.eks. Rational"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modell</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="F.eks. SCC 101"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serial_number">Serienummer</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible">Ansvarlig</Label>
              <Select
                value={formData.responsible_employee_id}
                onValueChange={(value) => setFormData({ ...formData, responsible_employee_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg ansvarlig" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status and Criticality */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_operation">🟢 I drift</SelectItem>
                  <SelectItem value="service_scheduled">🟡 Service planlagt</SelectItem>
                  <SelectItem value="under_repair">🟠 Under reparasjon</SelectItem>
                  <SelectItem value="out_of_service">🔴 Ute av drift</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kritikalitet</Label>
              <Select
                value={formData.criticality}
                onValueChange={(value) => setFormData({ ...formData, criticality: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Lav</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">Høy</SelectItem>
                  <SelectItem value="critical">Kritisk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Eierform</Label>
              <Select
                value={formData.ownership_type}
                onValueChange={(value) => setFormData({ ...formData, ownership_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owned">Eid</SelectItem>
                  <SelectItem value="leased">Leaset</SelectItem>
                  <SelectItem value="borrowed">Lånt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location and Notes */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location_description">Plassering</Label>
              <Input
                id="location_description"
                value={formData.location_description}
                onChange={(e) => setFormData({ ...formData, location_description: e.target.value })}
                placeholder="F.eks. Hovedkjøkken, ved vindu"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Kort beskrivelse av utstyret..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notater</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Interne notater..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={createEquipment.isPending || updateEquipment.isPending}
            >
              {equipment ? "Oppdater" : "Opprett"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

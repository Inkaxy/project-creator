import { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
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

function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name")
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
  const { data: locations } = useLocations();

  const getInitialFormData = () => ({
    name: equipment?.name || "",
    description: equipment?.description || "",
    category_id: equipment?.category_id || "",
    department_id: equipment?.department_id || "",
    location_id: equipment?.location_id || "",
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
    // Purchase & Warranty fields
    purchase_date: equipment?.purchase_date || "",
    purchase_price: equipment?.purchase_price?.toString() || "",
    warranty_months: equipment?.warranty_months?.toString() || "",
    warranty_expires: equipment?.warranty_expires || "",
    // Lease fields
    lease_monthly_cost: equipment?.lease_monthly_cost?.toString() || "",
    lease_expires: equipment?.lease_expires || "",
    // Lifetime
    expected_lifetime_years: equipment?.expected_lifetime_years?.toString() || "",
  });

  const [formData, setFormData] = useState(getInitialFormData);

  // Reset form when equipment changes
  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData());
    }
  }, [open, equipment]);

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

    const payload = {
      name: formData.name,
      description: formData.description || null,
      category_id: formData.category_id || null,
      department_id: formData.department_id || null,
      location_id: formData.location_id || null,
      supplier_id: formData.supplier_id || null,
      responsible_employee_id: formData.responsible_employee_id || null,
      brand: formData.brand || null,
      model: formData.model || null,
      serial_number: formData.serial_number || null,
      status: formData.status,
      criticality: formData.criticality,
      ownership_type: formData.ownership_type,
      location_description: formData.location_description || null,
      notes: formData.notes || null,
      purchase_date: formData.purchase_date || null,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
      warranty_months: formData.warranty_months ? parseInt(formData.warranty_months) : null,
      warranty_expires: formData.warranty_expires || null,
      lease_monthly_cost: formData.lease_monthly_cost ? parseFloat(formData.lease_monthly_cost) : null,
      lease_expires: formData.lease_expires || null,
      expected_lifetime_years: formData.expected_lifetime_years ? parseInt(formData.expected_lifetime_years) : null,
    };

    try {
      if (equipment) {
        await updateEquipment.mutateAsync({
          id: equipment.id,
          ...payload,
        });
        toast({
          title: "Oppdatert",
          description: "Utstyret ble oppdatert",
        });
      } else {
        await createEquipment.mutateAsync(payload);
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
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Grunndata</h3>
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

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="serial_number">Serienummer</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Kort beskrivelse av utstyret..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Status and Criticality */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Status</h3>
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
                <Label>Forventet levetid</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={formData.expected_lifetime_years}
                    onChange={(e) => setFormData({ ...formData, expected_lifetime_years: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">år</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Location and Responsibility */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Plassering & Ansvar</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Lokasjon</Label>
                <Select
                  value={formData.location_id}
                  onValueChange={(value) => setFormData({ ...formData, location_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg lokasjon" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_description">Nærmere plassering</Label>
                <Input
                  id="location_description"
                  value={formData.location_description}
                  onChange={(e) => setFormData({ ...formData, location_description: e.target.value })}
                  placeholder="F.eks. Ved vindu, første ovn i rekke"
                />
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
          </div>

          <Separator />

          {/* Purchase & Warranty */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Anskaffelse & Garanti</h3>
            <div className="grid gap-4 sm:grid-cols-2">
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

              <div className="space-y-2">
                <Label htmlFor="purchase_date">Innkjøpsdato</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase_price">Innkjøpspris</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="purchase_price"
                    type="number"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                  <span className="text-sm text-muted-foreground">kr</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="warranty_months">Garantitid</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="warranty_months"
                    type="number"
                    value={formData.warranty_months}
                    onChange={(e) => setFormData({ ...formData, warranty_months: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">måneder</span>
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="warranty_expires">Garanti utløper</Label>
                <Input
                  id="warranty_expires"
                  type="date"
                  value={formData.warranty_expires}
                  onChange={(e) => setFormData({ ...formData, warranty_expires: e.target.value })}
                />
              </div>
            </div>

            {/* Lease specific fields */}
            {formData.ownership_type === "leased" && (
              <div className="grid gap-4 sm:grid-cols-2 mt-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="lease_monthly_cost">Leasingkost/mnd</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="lease_monthly_cost"
                      type="number"
                      value={formData.lease_monthly_cost}
                      onChange={(e) => setFormData({ ...formData, lease_monthly_cost: e.target.value })}
                      placeholder="0"
                      min="0"
                    />
                    <span className="text-sm text-muted-foreground">kr</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lease_expires">Leasing utløper</Label>
                  <Input
                    id="lease_expires"
                    type="date"
                    value={formData.lease_expires}
                    onChange={(e) => setFormData({ ...formData, lease_expires: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Notes */}
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

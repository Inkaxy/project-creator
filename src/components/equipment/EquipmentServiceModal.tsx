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
import { useCreateService, type EquipmentServiceInterval } from "@/hooks/useEquipmentServices";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useAuth } from "@/contexts/AuthContext";
import { addDays, addMonths, addYears, format } from "date-fns";

interface EquipmentServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  intervals: EquipmentServiceInterval[];
}

export function EquipmentServiceModal({
  open,
  onOpenChange,
  equipmentId,
  intervals,
}: EquipmentServiceModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const createService = useCreateService();
  const { data: suppliers } = useSuppliers();

  const [formData, setFormData] = useState({
    service_type: "planned",
    service_interval_id: "",
    performed_date: format(new Date(), "yyyy-MM-dd"),
    performed_by_external: "",
    supplier_id: "",
    description: "",
    parts_replaced: "",
    cost_labor: "",
    cost_parts: "",
    invoice_number: "",
  });

  const calculateNextDue = (intervalId: string, performedDate: string) => {
    const interval = intervals.find((i) => i.id === intervalId);
    if (!interval) return null;
    
    const date = new Date(performedDate);
    switch (interval.interval_type) {
      case "days":
        return addDays(date, interval.interval_value);
      case "weeks":
        return addDays(date, interval.interval_value * 7);
      case "months":
        return addMonths(date, interval.interval_value);
      case "years":
        return addYears(date, interval.interval_value);
      default:
        return addDays(date, interval.interval_value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const nextServiceDate = formData.service_interval_id
        ? calculateNextDue(formData.service_interval_id, formData.performed_date)
        : null;

      await createService.mutateAsync({
        equipment_id: equipmentId,
        service_type: formData.service_type,
        service_interval_id: formData.service_interval_id || undefined,
        performed_date: formData.performed_date,
        performed_by_employee_id: user?.id,
        performed_by_external: formData.performed_by_external || undefined,
        supplier_id: formData.supplier_id || undefined,
        description: formData.description || undefined,
        parts_replaced: formData.parts_replaced || undefined,
        cost_labor: formData.cost_labor ? parseFloat(formData.cost_labor) : undefined,
        cost_parts: formData.cost_parts ? parseFloat(formData.cost_parts) : undefined,
        invoice_number: formData.invoice_number || undefined,
        next_service_date: nextServiceDate ? format(nextServiceDate, "yyyy-MM-dd") : undefined,
      });

      toast({
        title: "Service registrert",
        description: "Servicen ble lagret",
      });
      onOpenChange(false);
      
      // Reset form
      setFormData({
        service_type: "planned",
        service_interval_id: "",
        performed_date: format(new Date(), "yyyy-MM-dd"),
        performed_by_external: "",
        supplier_id: "",
        description: "",
        parts_replaced: "",
        cost_labor: "",
        cost_parts: "",
        invoice_number: "",
      });
    } catch (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke registrere service",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrer service</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type service</Label>
              <Select
                value={formData.service_type}
                onValueChange={(value) => setFormData({ ...formData, service_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planlagt</SelectItem>
                  <SelectItem value="preventive">Forebyggende</SelectItem>
                  <SelectItem value="repair">Reparasjon</SelectItem>
                  <SelectItem value="warranty">Garanti</SelectItem>
                  <SelectItem value="calibration">Kalibrering</SelectItem>
                  <SelectItem value="certification">Sertifisering</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Utført dato</Label>
              <Input
                type="date"
                value={formData.performed_date}
                onChange={(e) => setFormData({ ...formData, performed_date: e.target.value })}
              />
            </div>

            {intervals.length > 0 && (
              <div className="space-y-2 sm:col-span-2">
                <Label>Serviceintervall (valgfritt)</Label>
                <Select
                  value={formData.service_interval_id}
                  onValueChange={(value) => setFormData({ ...formData, service_interval_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg intervall" />
                  </SelectTrigger>
                  <SelectContent>
                    {intervals.map((interval) => (
                      <SelectItem key={interval.id} value={interval.id}>
                        {interval.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Utført av (ekstern)</Label>
              <Input
                value={formData.performed_by_external}
                onChange={(e) => setFormData({ ...formData, performed_by_external: e.target.value })}
                placeholder="Navn på tekniker"
              />
            </div>

            <div className="space-y-2">
              <Label>Leverandør</Label>
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
          </div>

          <div className="space-y-2">
            <Label>Beskrivelse</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Hva ble gjort?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Deler byttet</Label>
            <Input
              value={formData.parts_replaced}
              onChange={(e) => setFormData({ ...formData, parts_replaced: e.target.value })}
              placeholder="Liste over byttet deler"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Arbeidskostnad</Label>
              <Input
                type="number"
                value={formData.cost_labor}
                onChange={(e) => setFormData({ ...formData, cost_labor: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Delekostnad</Label>
              <Input
                type="number"
                value={formData.cost_parts}
                onChange={(e) => setFormData({ ...formData, cost_parts: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Fakturanummer</Label>
              <Input
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={createService.isPending}>
              Registrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

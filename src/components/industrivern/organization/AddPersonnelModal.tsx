import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmployees } from "@/hooks/useEmployees";
import { useAddIndustrivernPersonnel } from "@/hooks/useIndustrivernPersonnel";
import { INDUSTRIVERN_ROLE_LABELS, IndustrivernRole } from "@/types/industrivern";

interface AddPersonnelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPersonnelModal({ open, onOpenChange }: AddPersonnelModalProps) {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedRole, setSelectedRole] = useState<IndustrivernRole | "">("");
  const [isDeputy, setIsDeputy] = useState(false);
  const [emergencyPhone, setEmergencyPhone] = useState("");

  const { data: employees } = useEmployees();
  const addMutation = useAddIndustrivernPersonnel();

  const handleSubmit = async () => {
    if (!selectedEmployee || !selectedRole) return;

    await addMutation.mutateAsync({
      profile_id: selectedEmployee,
      role: selectedRole,
      is_deputy: isDeputy,
      emergency_phone: emergencyPhone || undefined,
    });

    // Reset form
    setSelectedEmployee("");
    setSelectedRole("");
    setIsDeputy(false);
    setEmergencyPhone("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Legg til personell</DialogTitle>
          <DialogDescription>
            Tildel en ansatt til en rolle i industrivernet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Ansatt</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Velg ansatt" />
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

          <div className="space-y-2">
            <Label>Rolle</Label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as IndustrivernRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Velg rolle" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(INDUSTRIVERN_ROLE_LABELS) as [IndustrivernRole, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nødtelefon (valgfritt)</Label>
            <Input
              type="tel"
              placeholder="912 34 567"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Overstyrer telefonnummer fra ansattprofilen for beredskapsvarsling
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Stedfortreder</Label>
              <p className="text-xs text-muted-foreground">
                Markér som stedfortreder for rollen
              </p>
            </div>
            <Switch checked={isDeputy} onCheckedChange={setIsDeputy} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedEmployee || !selectedRole || addMutation.isPending}
          >
            {addMutation.isPending ? "Legger til..." : "Legg til"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

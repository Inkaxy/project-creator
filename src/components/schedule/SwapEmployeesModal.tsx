import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { ShiftData } from "@/hooks/useShifts";
import { Users, ArrowRightLeft } from "lucide-react";

interface Employee {
  id: string;
  full_name: string;
}

interface SwapEmployeesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shifts: ShiftData[];
  employees: Employee[];
  onSwap: (newEmployeeId: string | null) => void;
}

export function SwapEmployeesModal({
  open,
  onOpenChange,
  shifts,
  employees,
  onSwap,
}: SwapEmployeesModalProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("unassigned");

  const handleSwap = () => {
    const employeeId = selectedEmployee === "unassigned" ? null : selectedEmployee;
    onSwap(employeeId);
    onOpenChange(false);
    setSelectedEmployee("unassigned");
  };

  // Get unique employees currently assigned to selected shifts
  const currentEmployees = shifts
    .filter(s => s.employee_id && s.profiles)
    .reduce((acc, shift) => {
      if (shift.profiles && !acc.find(e => e.id === shift.employee_id)) {
        acc.push({ id: shift.employee_id!, name: shift.profiles.full_name });
      }
      return acc;
    }, [] as { id: string; name: string }[]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Bytt ansatt på vakter
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground mb-2">
              {shifts.length} vakter valgt
            </p>
            {currentEmployees.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Nåværende ansatte:</p>
                <div className="flex flex-wrap gap-2">
                  {currentEmployees.map((emp) => (
                    <div key={emp.id} className="flex items-center gap-1 bg-background rounded px-2 py-1 text-xs">
                      <AvatarWithInitials name={emp.name} size="sm" />
                      <span>{emp.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newEmployee">Ny ansatt for alle valgte vakter</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger id="newEmployee">
                <SelectValue placeholder="Velg ansatt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Ledig vakt (ingen ansatt)</span>
                  </div>
                </SelectItem>
                {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                    <div className="flex items-center gap-2">
                      <AvatarWithInitials name={employee.full_name} size="sm" />
                      <span>{employee.full_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSwap}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Bytt ansatt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

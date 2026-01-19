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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmployees } from "@/hooks/useEmployees";
import { useAssignDeviation, Deviation } from "@/hooks/useDeviations";
import { UserPlus } from "lucide-react";

interface AssignDeviationModalProps {
  deviation: Deviation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignDeviationModal({
  deviation,
  open,
  onOpenChange,
}: AssignDeviationModalProps) {
  const { data: employees = [] } = useEmployees();
  const assignDeviation = useAssignDeviation();

  const [assignedTo, setAssignedTo] = useState("");
  const [requireConfirmation, setRequireConfirmation] = useState(false);
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = async () => {
    if (!deviation || !assignedTo) return;

    await assignDeviation.mutateAsync({
      id: deviation.id,
      assignedTo,
      requireClockOutConfirmation: requireConfirmation,
      dueDate: dueDate || undefined,
    });

    onOpenChange(false);
    setAssignedTo("");
    setRequireConfirmation(false);
    setDueDate("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Tildel avvik
          </DialogTitle>
        </DialogHeader>

        {deviation && (
          <div className="space-y-4">
            <div className="rounded-lg border p-3 bg-muted/50">
              <p className="font-medium">{deviation.title}</p>
              {deviation.description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {deviation.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee">Tildel til ansatt</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg ansatt" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Frist (valgfritt)</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="requireConfirmation"
                checked={requireConfirmation}
                onCheckedChange={(checked) => setRequireConfirmation(!!checked)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="requireConfirmation" className="cursor-pointer">
                  Krev bekreftelse ved utstempling
                </Label>
                <p className="text-sm text-muted-foreground">
                  Den ansatte må bekrefte at avviket er håndtert før de kan stemple ut
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!assignedTo || assignDeviation.isPending}
          >
            {assignDeviation.isPending ? "Tildeler..." : "Tildel avvik"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

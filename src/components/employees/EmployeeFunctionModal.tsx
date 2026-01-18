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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useFunctions } from "@/hooks/useFunctions";
import {
  useCreateEmployeeFunction,
  useEmployeeFunctions,
} from "@/hooks/useEmployeeFunctions";
import { Star } from "lucide-react";

interface EmployeeFunctionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
}

const PROFICIENCY_OPTIONS = [
  { value: "learning", label: "Lærling", stars: 1, description: "Under opplæring" },
  { value: "competent", label: "Kompetent", stars: 2, description: "Kan jobbe selvstendig" },
  { value: "expert", label: "Ekspert", stars: 3, description: "Kan lære opp andre" },
];

export function EmployeeFunctionModal({
  open,
  onOpenChange,
  employeeId,
  employeeName,
}: EmployeeFunctionModalProps) {
  const [functionId, setFunctionId] = useState("");
  const [proficiencyLevel, setProficiencyLevel] = useState("competent");
  const [notes, setNotes] = useState("");

  const { data: allFunctions } = useFunctions();
  const { data: employeeFunctions } = useEmployeeFunctions(employeeId);
  const createEmployeeFunction = useCreateEmployeeFunction();

  // Filter out already assigned functions
  const assignedFunctionIds = new Set(employeeFunctions?.map(ef => ef.function_id) || []);
  const availableFunctions = allFunctions?.filter(f => !assignedFunctionIds.has(f.id)) || [];

  const handleSubmit = async () => {
    if (!functionId) return;

    await createEmployeeFunction.mutateAsync({
      employee_id: employeeId,
      function_id: functionId,
      proficiency_level: proficiencyLevel,
      notes: notes || undefined,
    });

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setFunctionId("");
    setProficiencyLevel("competent");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Tildel funksjon til {employeeName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Function selection */}
          <div className="space-y-2">
            <Label htmlFor="function">Funksjon</Label>
            {availableFunctions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Alle funksjoner er allerede tildelt denne ansatte.
              </p>
            ) : (
              <Select value={functionId} onValueChange={setFunctionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg funksjon" />
                </SelectTrigger>
                <SelectContent>
                  {availableFunctions.map((func) => (
                    <SelectItem key={func.id} value={func.id}>
                      <div className="flex items-center gap-2">
                        {func.icon && <span>{func.icon}</span>}
                        <span>{func.name}</span>
                        {func.category && (
                          <Badge variant="outline" className="text-xs">
                            {func.category}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Proficiency level */}
          <div className="space-y-2">
            <Label htmlFor="proficiency">Kompetansenivå</Label>
            <Select value={proficiencyLevel} onValueChange={setProficiencyLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROFICIENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: opt.stars }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-3 w-3 fill-primary text-primary"
                          />
                        ))}
                        {Array.from({ length: 3 - opt.stars }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-3 w-3 text-muted-foreground"
                          />
                        ))}
                      </div>
                      <span>{opt.label}</span>
                      <span className="text-xs text-muted-foreground">
                        ({opt.description})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notater (valgfritt)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="f.eks. Godkjent etter opplæring 15. januar"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!functionId || createEmployeeFunction.isPending}
          >
            {createEmployeeFunction.isPending ? "Lagrer..." : "Tildel funksjon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

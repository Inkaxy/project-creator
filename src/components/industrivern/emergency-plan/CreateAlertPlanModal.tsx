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
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useCreateAlertPlan } from "@/hooks/useEmergencyPlans";
import { useActiveEmergencyPlan } from "@/hooks/useEmergencyPlans";

interface CreateAlertPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AlertStep {
  step: number;
  action: string;
  responsible: string | null;
}

const INCIDENT_TYPES = [
  { value: "brann", label: "Brann" },
  { value: "personskade", label: "Personskade" },
  { value: "kjemikalieuhell", label: "Kjemikalieuhell" },
  { value: "gasslekkasje", label: "Gasslekkasje" },
  { value: "eksplosjon", label: "Eksplosjon" },
  { value: "evakuering", label: "Evakuering" },
  { value: "trussel", label: "Trussel/sikkerhet" },
  { value: "annet", label: "Annet" },
];

export function CreateAlertPlanModal({ open, onOpenChange }: CreateAlertPlanModalProps) {
  const { data: activePlan } = useActiveEmergencyPlan();
  const createAlertPlan = useCreateAlertPlan();
  
  const [incidentType, setIncidentType] = useState("");
  const [notifyNeighbors, setNotifyNeighbors] = useState(false);
  const [neighborInstructions, setNeighborInstructions] = useState("");
  const [steps, setSteps] = useState<AlertStep[]>([
    { step: 1, action: "", responsible: null },
  ]);

  const handleAddStep = () => {
    setSteps([...steps, { step: steps.length + 1, action: "", responsible: null }]);
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, step: i + 1 }));
    setSteps(newSteps);
  };

  const handleStepChange = (index: number, field: keyof AlertStep, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value || null };
    setSteps(newSteps);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validSteps = steps.filter(s => s.action.trim());
    
    if (!incidentType || validSteps.length === 0) {
      return;
    }

    createAlertPlan.mutate(
      {
        emergency_plan_id: activePlan?.id,
        incident_type: incidentType,
        alert_sequence: validSteps,
        notify_neighbors: notifyNeighbors,
        neighbor_instructions: notifyNeighbors ? neighborInstructions : null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setIncidentType("");
    setNotifyNeighbors(false);
    setNeighborInstructions("");
    setSteps([{ step: 1, action: "", responsible: null }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ny varslingsplan</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="incident-type">Hendelsestype</Label>
            <select
              id="incident-type"
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
              required
            >
              <option value="">Velg type...</option>
              {INCIDENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Varslingstrinn</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddStep}>
                <Plus className="h-4 w-4 mr-1" />
                Legg til trinn
              </Button>
            </div>

            <div className="space-y-2">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start gap-2 p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 pt-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">
                      {step.step}
                    </span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Handling (f.eks. 'Ring 110')"
                      value={step.action}
                      onChange={(e) => handleStepChange(index, "action", e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Ansvarlig (valgfritt)"
                      value={step.responsible || ""}
                      onChange={(e) => handleStepChange(index, "responsible", e.target.value)}
                    />
                  </div>
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveStep(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <Label>Varsle nabovirksomheter</Label>
                <p className="text-sm text-muted-foreground">
                  Inkluder varsling til nabovirksomheter i varslingsplanen
                </p>
              </div>
              <Switch
                checked={notifyNeighbors}
                onCheckedChange={setNotifyNeighbors}
              />
            </div>

            {notifyNeighbors && (
              <div className="space-y-2">
                <Label htmlFor="neighbor-instructions">Instruksjoner til naboer</Label>
                <Textarea
                  id="neighbor-instructions"
                  placeholder="Beskriv hva nabovirksomheter skal gjøre ved denne hendelsen..."
                  value={neighborInstructions}
                  onChange={(e) => setNeighborInstructions(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={createAlertPlan.isPending}>
              {createAlertPlan.isPending ? "Oppretter..." : "Opprett varslingsplan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

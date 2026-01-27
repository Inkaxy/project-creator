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
import { Plus, Trash2 } from "lucide-react";
import { useCreateActionCard, useActiveEmergencyPlan } from "@/hooks/useEmergencyPlans";
import { INDUSTRIVERN_ROLE_LABELS, IndustrivernRole } from "@/types/industrivern";

interface CreateActionCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function CreateActionCardModal({ open, onOpenChange }: CreateActionCardModalProps) {
  const { data: activePlan } = useActiveEmergencyPlan();
  const createActionCard = useCreateActionCard();

  const [title, setTitle] = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [immediateActions, setImmediateActions] = useState<string[]>([""]);
  const [extendedActions, setExtendedActions] = useState<string[]>([]);
  const [equipmentNeeded, setEquipmentNeeded] = useState<string[]>([]);
  const [safetyConsiderations, setSafetyConsiderations] = useState<string[]>([]);

  const handleAddItem = (
    items: string[],
    setItems: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setItems([...items, ""]);
  };

  const handleRemoveItem = (
    index: number,
    items: string[],
    setItems: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    value: string,
    items: string[],
    setItems: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validImmediateActions = immediateActions.filter((a) => a.trim());
    if (!title || !incidentType || validImmediateActions.length === 0) {
      return;
    }

    createActionCard.mutate(
      {
        emergency_plan_id: activePlan?.id,
        title,
        incident_type: incidentType,
        target_role: targetRole || undefined,
        immediate_actions: validImmediateActions,
        extended_actions: extendedActions.filter((a) => a.trim()) || undefined,
        equipment_needed: equipmentNeeded.filter((e) => e.trim()) || undefined,
        safety_considerations: safetyConsiderations.filter((s) => s.trim()) || undefined,
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
    setTitle("");
    setIncidentType("");
    setTargetRole("");
    setImmediateActions([""]);
    setExtendedActions([]);
    setEquipmentNeeded([]);
    setSafetyConsiderations([]);
  };

  const renderListInput = (
    label: string,
    items: string[],
    setItems: React.Dispatch<React.SetStateAction<string[]>>,
    placeholder: string,
    required = false
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAddItem(items, setItems)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Legg til
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder={placeholder}
              value={item}
              onChange={(e) => handleItemChange(index, e.target.value, items, setItems)}
              required={required && index === 0}
            />
            {(items.length > 1 || !required) && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveItem(index, items, setItems)}
                className="text-destructive hover:text-destructive flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nytt tiltakskort</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tittel</Label>
              <Input
                id="title"
                placeholder="F.eks. 'Brannbekjempelse'"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

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
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-role">Målgruppe (rolle)</Label>
            <select
              id="target-role"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              <option value="">Alle roller</option>
              {Object.entries(INDUSTRIVERN_ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {renderListInput(
            "Umiddelbare tiltak *",
            immediateActions,
            setImmediateActions,
            "Handling som skal utføres umiddelbart",
            true
          )}

          {renderListInput(
            "Utvidede tiltak",
            extendedActions,
            setExtendedActions,
            "Tiltak etter umiddelbar respons"
          )}

          {renderListInput(
            "Nødvendig utstyr",
            equipmentNeeded,
            setEquipmentNeeded,
            "Utstyr som trengs for utførelse"
          )}

          {renderListInput(
            "Sikkerhetshensyn",
            safetyConsiderations,
            setSafetyConsiderations,
            "Sikkerhetshensyn å være oppmerksom på"
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={createActionCard.isPending}>
              {createActionCard.isPending ? "Oppretter..." : "Opprett tiltakskort"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

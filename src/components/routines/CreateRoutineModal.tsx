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
import { useCreateRoutine } from "@/hooks/useRoutines";
import { useDepartments } from "@/hooks/useEmployees";
import { useFunctions } from "@/hooks/useFunctions";
import { 
  ClipboardList, 
  ClipboardCheck, 
  FileText, 
  CheckSquare, 
  ListChecks,
  Calendar,
  Clock,
  Repeat,
} from "lucide-react";

interface CreateRoutineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ICONS = [
  { value: "clipboard-list", label: "Sjekkliste", icon: ClipboardList },
  { value: "clipboard-check", label: "Sjekk", icon: ClipboardCheck },
  { value: "file-text", label: "Dokument", icon: FileText },
  { value: "check-square", label: "Oppgave", icon: CheckSquare },
  { value: "list-checks", label: "Liste", icon: ListChecks },
];

const FREQUENCIES = [
  { value: "daily", label: "Daglig", description: "Nullstilles hver dag ved midnatt" },
  { value: "weekly", label: "Ukentlig", description: "Nullstilles hver mandag" },
  { value: "monthly", label: "Månedlig", description: "Nullstilles første dag i måneden" },
  { value: "shift", label: "Per vakt", description: "Nullstilles ved hver vaktstart" },
];

export function CreateRoutineModal({ open, onOpenChange }: CreateRoutineModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    frequency: "daily",
    icon: "clipboard-list",
    department_id: "",
    function_id: "",
  });

  const { data: departments = [] } = useDepartments();
  const { data: functions = [] } = useFunctions();
  const createRoutine = useCreateRoutine();

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    await createRoutine.mutateAsync({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      frequency: formData.frequency,
      icon: formData.icon,
      department_id: formData.department_id || undefined,
      function_id: formData.function_id || undefined,
    });

    // Reset form
    setFormData({
      name: "",
      description: "",
      frequency: "daily",
      icon: "clipboard-list",
      department_id: "",
      function_id: "",
    });
    onOpenChange(false);
  };

  const selectedFrequency = FREQUENCIES.find(f => f.value === formData.frequency);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Opprett ny rutineliste</DialogTitle>
          <DialogDescription>
            Definer en daglig, ukentlig eller skiftbasert rutine
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Navn</Label>
            <Input
              id="name"
              placeholder="F.eks. Åpningsrutine"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
            <Textarea
              id="description"
              placeholder="Kort beskrivelse av rutinen..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frekvens</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value) => setFormData({ ...formData, frequency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    <div className="flex items-center gap-2">
                      <Repeat className="h-4 w-4" />
                      {freq.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFrequency && (
              <p className="text-xs text-muted-foreground">
                {selectedFrequency.description}
              </p>
            )}
          </div>

          {/* Icon & Responsible Function */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ikon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICONS.map((icon) => (
                    <SelectItem key={icon.value} value={icon.value}>
                      <div className="flex items-center gap-2">
                        <icon.icon className="h-4 w-4" />
                        {icon.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ansvarlig vakttype</Label>
              <Select
                value={formData.function_id}
                onValueChange={(value) => setFormData({ ...formData, function_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Valgfritt" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Valgfritt</SelectItem>
                  {functions.map((func) => (
                    <SelectItem key={func.id} value={func.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: func.color || "#3B82F6" }} 
                        />
                        {func.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Department filter */}
          <div className="space-y-2">
            <Label>Avdeling (valgfritt)</Label>
            <Select
              value={formData.department_id}
              onValueChange={(value) => setFormData({ ...formData, department_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle avdelinger" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle avdelinger</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
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
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.name.trim() || createRoutine.isPending}
          >
            {createRoutine.isPending ? "Oppretter..." : "Opprett"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

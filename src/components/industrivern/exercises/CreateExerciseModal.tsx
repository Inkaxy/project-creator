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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateExercise } from "@/hooks/useIndustrivernExercises";
import { EXERCISE_TYPE_LABELS, ExerciseType } from "@/types/industrivern";

interface CreateExerciseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateExerciseModal({ open, onOpenChange }: CreateExerciseModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [exerciseType, setExerciseType] = useState<ExerciseType | "">("");
  const [plannedDate, setPlannedDate] = useState("");
  const [plannedStart, setPlannedStart] = useState("");
  const [plannedEnd, setPlannedEnd] = useState("");
  const [location, setLocation] = useState("");
  const [scenario, setScenario] = useState("");

  const createMutation = useCreateExercise();

  const handleSubmit = async () => {
    if (!title || !exerciseType || !plannedDate) return;

    await createMutation.mutateAsync({
      title,
      description: description || undefined,
      exercise_type: exerciseType,
      planned_date: plannedDate,
      planned_start: plannedStart || undefined,
      planned_end: plannedEnd || undefined,
      location: location || undefined,
      incident_scenario: scenario || undefined,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setExerciseType("");
    setPlannedDate("");
    setPlannedStart("");
    setPlannedEnd("");
    setLocation("");
    setScenario("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Planlegg øvelse</DialogTitle>
          <DialogDescription>
            Opprett en ny industrivernøvelse
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Tittel *</Label>
            <Input
              placeholder="F.eks. Brannøvelse Q1 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Type øvelse *</Label>
            <Select value={exerciseType} onValueChange={(v) => setExerciseType(v as ExerciseType)}>
              <SelectTrigger>
                <SelectValue placeholder="Velg type" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(EXERCISE_TYPE_LABELS) as [ExerciseType, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dato *</Label>
              <Input
                type="date"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Sted</Label>
              <Input
                placeholder="F.eks. Produksjonshall A"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Starttid</Label>
              <Input
                type="time"
                value={plannedStart}
                onChange={(e) => setPlannedStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Sluttid</Label>
              <Input
                type="time"
                value={plannedEnd}
                onChange={(e) => setPlannedEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Beskrivelse</Label>
            <Textarea
              placeholder="Kort beskrivelse av øvelsen"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Scenario</Label>
            <Textarea
              placeholder="Beskriv scenarioet som skal øves på..."
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!title || !exerciseType || !plannedDate || createMutation.isPending}
          >
            {createMutation.isPending ? "Oppretter..." : "Opprett øvelse"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

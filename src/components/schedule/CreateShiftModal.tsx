import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Badge } from "@/components/ui/badge";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { useQualifiedEmployees } from "@/hooks/useEmployeeFunctions";
import { useCreateShift } from "@/hooks/useShifts";
import { FunctionData } from "@/hooks/useFunctions";
import { AlertCircle, Star, Users } from "lucide-react";

interface CreateShiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  selectedFunction: FunctionData | null;
  functions: FunctionData[];
}

export function CreateShiftModal({
  open,
  onOpenChange,
  date,
  selectedFunction,
  functions,
}: CreateShiftModalProps) {
  const [functionId, setFunctionId] = useState<string>("");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("15:00");
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [notes, setNotes] = useState("");

  const { data: qualifiedEmployees, isLoading: loadingEmployees } = useQualifiedEmployees(functionId);
  const createShift = useCreateShift();

  // Set default values when function changes
  useEffect(() => {
    if (selectedFunction) {
      setFunctionId(selectedFunction.id);
      setStartTime(selectedFunction.default_start?.slice(0, 5) || "07:00");
      setEndTime(selectedFunction.default_end?.slice(0, 5) || "15:00");
      setBreakMinutes(selectedFunction.default_break_minutes || 30);
    }
  }, [selectedFunction]);

  // Update times when function is changed via dropdown
  useEffect(() => {
    if (functionId) {
      const func = functions.find(f => f.id === functionId);
      if (func) {
        setStartTime(func.default_start?.slice(0, 5) || "07:00");
        setEndTime(func.default_end?.slice(0, 5) || "15:00");
        setBreakMinutes(func.default_break_minutes || 30);
      }
    }
  }, [functionId, functions]);

  const handleSubmit = async () => {
    if (!functionId) return;

    await createShift.mutateAsync({
      date: date.toISOString().split("T")[0],
      function_id: functionId,
      employee_id: employeeId && employeeId !== "unassigned" ? employeeId : null,
      planned_start: startTime,
      planned_end: endTime,
      planned_break_minutes: breakMinutes,
      notes: notes || undefined,
      status: "draft",
    });

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setFunctionId(selectedFunction?.id || "");
    setEmployeeId("");
    setStartTime(selectedFunction?.default_start?.slice(0, 5) || "07:00");
    setEndTime(selectedFunction?.default_end?.slice(0, 5) || "15:00");
    setBreakMinutes(30);
    setNotes("");
  };

  const getProficiencyBadge = (level: string) => {
    const config = {
      expert: { label: "Ekspert", stars: 3, variant: "default" as const },
      competent: { label: "Kompetent", stars: 2, variant: "secondary" as const },
      learning: { label: "Lærling", stars: 1, variant: "outline" as const },
    };
    return config[level as keyof typeof config] || config.competent;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Opprett ny vakt</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date display */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">Dato</p>
            <p className="font-medium">
              {date.toLocaleDateString("nb-NO", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Function selection */}
          <div className="space-y-2">
            <Label htmlFor="function">Funksjon</Label>
            <Select value={functionId} onValueChange={setFunctionId}>
              <SelectTrigger>
                <SelectValue placeholder="Velg funksjon" />
              </SelectTrigger>
              <SelectContent>
                {functions.map((func) => (
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
          </div>

          {/* Employee selection */}
          <div className="space-y-2">
            <Label htmlFor="employee">Ansatt</Label>
            {!functionId ? (
              <p className="text-sm text-muted-foreground">
                Velg funksjon først
              </p>
            ) : loadingEmployees ? (
              <p className="text-sm text-muted-foreground">Laster ansatte...</p>
            ) : qualifiedEmployees && qualifiedEmployees.length > 0 ? (
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg ansatt (valgfritt)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Ledig vakt</span>
                    </div>
                  </SelectItem>
                  {qualifiedEmployees
                    .filter((ef) => !!ef.profiles?.id)
                    .map((ef) => {
                      const badge = getProficiencyBadge(ef.proficiency_level);
                      return (
                        <SelectItem key={ef.id} value={ef.profiles!.id}>
                          <div className="flex items-center gap-2">
                            <AvatarWithInitials
                              name={ef.profiles?.full_name || ""}
                              size="sm"
                            />
                            <span>{ef.profiles?.full_name}</span>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: badge.stars }).map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-3 w-3 fill-primary text-primary"
                                />
                              ))}
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>Ingen kvalifiserte ansatte for denne funksjonen</span>
              </div>
            )}
          </div>

          {/* Time inputs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Slutt</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="break">Pause (min)</Label>
              <Input
                id="break"
                type="number"
                min={0}
                max={120}
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notater (valgfritt)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Legg til notater..."
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
            disabled={!functionId || createShift.isPending}
          >
            {createShift.isPending ? "Oppretter..." : "Opprett vakt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

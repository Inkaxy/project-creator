import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addWeeks, startOfWeek } from "date-fns";
import { nb } from "date-fns/locale";
import {
  useRotationGroup,
  useRolloutRotation,
  previewRotationRollout,
  getWeekNumber,
  RotationGroup,
} from "@/hooks/useShiftTemplates";
import { Play, Calendar, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RolloutRotationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rotationGroup: RotationGroup | null;
  currentWeekDate: Date;
}

const ROTATION_NAMES = ["A", "B", "C", "D", "E", "F"];

export function RolloutRotationModal({
  open,
  onOpenChange,
  rotationGroup,
  currentWeekDate,
}: RolloutRotationModalProps) {
  const [startWeekOffset, setStartWeekOffset] = useState(0);
  const [numberOfCycles, setNumberOfCycles] = useState(2);
  const [startingSequence, setStartingSequence] = useState(1);
  const [keepEmployeeAssignments, setKeepEmployeeAssignments] = useState(true);
  const [skipHolidays, setSkipHolidays] = useState(true);
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  const { data: fullGroup } = useRotationGroup(rotationGroup?.id || null);
  const rollout = useRolloutRotation();

  const startWeekDate = useMemo(() => {
    const baseWeek = startOfWeek(currentWeekDate, { weekStartsOn: 1 });
    return addWeeks(baseWeek, startWeekOffset);
  }, [currentWeekDate, startWeekOffset]);

  const weekOptions = useMemo(() => {
    const options = [];
    const baseWeek = startOfWeek(currentWeekDate, { weekStartsOn: 1 });
    
    for (let i = 0; i <= 12; i++) {
      const weekDate = addWeeks(baseWeek, i);
      options.push({
        offset: i,
        label: `Uke ${getWeekNumber(weekDate)} (${format(weekDate, "d. MMM", { locale: nb })})`,
      });
    }
    return options;
  }, [currentWeekDate]);

  const preview = useMemo(() => {
    if (!fullGroup) return [];
    return previewRotationRollout(
      fullGroup,
      startWeekDate,
      numberOfCycles,
      startingSequence
    );
  }, [fullGroup, startWeekDate, numberOfCycles, startingSequence]);

  const totalShifts = preview.reduce((sum, w) => sum + w.shiftCount, 0);
  const totalCost = preview.reduce((sum, w) => sum + w.estimatedCost, 0);
  const totalWeeks = preview.length;

  const handleRollout = async () => {
    if (!rotationGroup) return;

    await rollout.mutateAsync({
      rotationGroupId: rotationGroup.id,
      startWeekDate,
      numberOfCycles,
      startingSequence,
      keepEmployeeAssignments,
      skipHolidays,
      overwriteExisting,
    });

    onOpenChange(false);
  };

  if (!rotationGroup) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Rull ut rotasjon: {rotationGroup.name}
          </DialogTitle>
          <DialogDescription>
            Rotasjonsmønster:{" "}
            {rotationGroup.templates?.map((t, i) => (
              <span key={t.id}>
                {i > 0 && " → "}
                <Badge variant="outline" className="mx-0.5">
                  {t.rotation_name || ROTATION_NAMES[i]}
                </Badge>
              </span>
            ))}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Fra uke</Label>
              <Select
                value={String(startWeekOffset)}
                onValueChange={(v) => setStartWeekOffset(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weekOptions.map((option) => (
                    <SelectItem key={option.offset} value={String(option.offset)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start med</Label>
              <Select
                value={String(startingSequence)}
                onValueChange={(v) => setStartingSequence(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rotationGroup.templates?.map((t, i) => (
                    <SelectItem key={t.id} value={String(i + 1)}>
                      Uke {t.rotation_name || ROTATION_NAMES[i]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Antall rotasjoner</Label>
              <Select
                value={String(numberOfCycles)}
                onValueChange={(v) => setNumberOfCycles(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} ({n * rotationGroup.rotation_length} uker)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="keepEmployees"
                checked={keepEmployeeAssignments}
                onCheckedChange={(c) => setKeepEmployeeAssignments(!!c)}
              />
              <Label htmlFor="keepEmployees" className="text-sm font-normal">
                Behold ansatte fra maler
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skipHolidays"
                checked={skipHolidays}
                onCheckedChange={(c) => setSkipHolidays(!!c)}
              />
              <Label htmlFor="skipHolidays" className="text-sm font-normal">
                Hopp over helligdager
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="overwrite"
                checked={overwriteExisting}
                onCheckedChange={(c) => setOverwriteExisting(!!c)}
              />
              <Label htmlFor="overwrite" className="text-sm font-normal text-amber-600">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                Overskriv eksisterende vakter
              </Label>
            </div>
          </div>

          {preview.length > 0 && (
            <div className="space-y-2">
              <Label>Forhåndsvisning:</Label>
              <ScrollArea className="h-[180px] border rounded-md">
                <div className="p-2 space-y-1">
                  {preview.map((week, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center justify-between p-2 rounded text-sm",
                        week.hasHoliday 
                          ? "bg-red-50 dark:bg-red-950/30" 
                          : "bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Uke {week.weekNumber}</span>
                        <Badge variant="outline" className="bg-primary/10">
                          {week.rotationName}
                        </Badge>
                        {week.hasHoliday && (
                          <Badge variant="destructive" className="text-xs">
                            Helligdag
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>{week.shiftCount} vakter</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="rounded-md bg-muted/50 p-3">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{totalWeeks}</div>
                <div className="text-xs text-muted-foreground">Uker</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{totalShifts}</div>
                <div className="text-xs text-muted-foreground">Vakter</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.round(totalCost).toLocaleString("nb-NO")} kr
                </div>
                <div className="text-xs text-muted-foreground">Est. kostnad</div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleRollout}
            disabled={rollout.isPending || totalShifts === 0}
          >
            {rollout.isPending 
              ? "Ruller ut..." 
              : `Rull ut ${totalShifts} vakter`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
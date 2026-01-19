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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addWeeks, startOfWeek, addDays } from "date-fns";
import { nb } from "date-fns/locale";
import { useCopyWeek, getWeekNumber } from "@/hooks/useShiftTemplates";
import { useShifts } from "@/hooks/useShifts";
import { Copy, ArrowRight, Loader2 } from "lucide-react";

interface CopyWeekModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceWeekDate: Date;
}

export function CopyWeekModal({
  open,
  onOpenChange,
  sourceWeekDate,
}: CopyWeekModalProps) {
  const [targetWeekOffset, setTargetWeekOffset] = useState(1);
  const [keepEmployees, setKeepEmployees] = useState(true);
  const [skipHolidays, setSkipHolidays] = useState(true);
  const [overwrite, setOverwrite] = useState(false);

  const copyWeek = useCopyWeek();

  const sourceWeekStart = startOfWeek(sourceWeekDate, { weekStartsOn: 1 });
  const sourceWeekEnd = addDays(sourceWeekStart, 6);
  const targetWeekStart = addWeeks(sourceWeekStart, targetWeekOffset);
  const targetWeekEnd = addDays(targetWeekStart, 6);

  // Hent vakter fra kildeuke for forhåndsvisning
  const { data: sourceShifts = [] } = useShifts(
    format(sourceWeekStart, "yyyy-MM-dd"),
    format(sourceWeekEnd, "yyyy-MM-dd")
  );

  const activeShifts = sourceShifts.filter((s) => s.status !== "cancelled");

  const handleCopy = () => {
    copyWeek.mutate(
      {
        sourceWeekStart,
        targetWeekStart,
        keepEmployees,
        skipHolidays,
        overwrite,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          // Reset form
          setTargetWeekOffset(1);
          setKeepEmployees(true);
          setSkipHolidays(true);
          setOverwrite(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Kopier uke
          </DialogTitle>
          <DialogDescription>
            Kopier alle vakter fra én uke til en annen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Fra/Til visning */}
          <div className="flex items-center gap-4">
            <div className="flex-1 rounded-lg border bg-muted/30 p-3 text-center">
              <p className="text-xs font-medium text-muted-foreground">Fra</p>
              <p className="text-lg font-bold">
                Uke {getWeekNumber(sourceWeekStart)}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(sourceWeekStart, "d. MMM", { locale: nb })} -{" "}
                {format(sourceWeekEnd, "d. MMM", { locale: nb })}
              </p>
              <p className="mt-1 text-sm font-medium text-primary">
                {activeShifts.length} vakter
              </p>
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

            <div className="flex-1 rounded-lg border bg-primary/5 p-3 text-center">
              <p className="text-xs font-medium text-muted-foreground">Til</p>
              <Select
                value={String(targetWeekOffset)}
                onValueChange={(v) => setTargetWeekOffset(Number(v))}
              >
                <SelectTrigger className="mt-1 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((offset) => {
                    const weekDate = addWeeks(sourceWeekStart, offset);
                    return (
                      <SelectItem key={offset} value={String(offset)}>
                        Uke {getWeekNumber(weekDate)} (
                        {format(weekDate, "d. MMM", { locale: nb })})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Alternativer */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="keepEmployees"
                checked={keepEmployees}
                onCheckedChange={(c) => setKeepEmployees(c === true)}
              />
              <Label htmlFor="keepEmployees" className="font-normal">
                Behold ansatt-tildelinger
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="skipHolidays"
                checked={skipHolidays}
                onCheckedChange={(c) => setSkipHolidays(c === true)}
              />
              <Label htmlFor="skipHolidays" className="font-normal">
                Hopp over helligdager
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="overwrite"
                checked={overwrite}
                onCheckedChange={(c) => setOverwrite(c === true)}
              />
              <Label htmlFor="overwrite" className="font-normal text-destructive">
                Overskriv eksisterende vakter (sletter draft-vakter)
              </Label>
            </div>
          </div>

          {activeShifts.length === 0 && (
            <div className="rounded-md bg-warning/10 p-3 text-center text-sm text-warning-foreground">
              ⚠️ Ingen vakter å kopiere i denne uken
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleCopy}
            disabled={activeShifts.length === 0 || copyWeek.isPending}
          >
            {copyWeek.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kopierer...
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Kopier {activeShifts.length} vakter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

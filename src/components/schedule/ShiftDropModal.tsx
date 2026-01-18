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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { useEmployees } from "@/hooks/useEmployees";
import { useEmployeeFunctions } from "@/hooks/useEmployeeFunctions";
import { Clock, Users, User, Copy, Move, ArrowRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShiftDropData {
  shiftId: string;
  originalDate: string;
  originalFunctionId: string | null;
  originalEmployeeId: string | null;
  plannedStart: string;
  plannedEnd: string;
  employeeName: string | null;
}

interface ShiftDropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dropData: ShiftDropData | null;
  targetDate: string;
  targetFunctionId: string;
  targetFunctionName: string;
  isCopy: boolean;
  onConfirm: (employeeId: string | null) => void;
}

export function ShiftDropModal({
  open,
  onOpenChange,
  dropData,
  targetDate,
  targetFunctionId,
  targetFunctionName,
  isCopy,
  onConfirm,
}: ShiftDropModalProps) {
  const [selectedOption, setSelectedOption] = useState<"keep" | "change" | "open">("keep");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  const { data: employees = [] } = useEmployees();
  const { data: employeeFunctions = [] } = useEmployeeFunctions();

  // Get employees certified for this function
  const certifiedEmployeeIds = employeeFunctions
    .filter(ef => ef.function_id === targetFunctionId && ef.is_active)
    .map(ef => ef.employee_id);

  const certifiedEmployees = employees.filter(e => certifiedEmployeeIds.includes(e.id));
  const otherEmployees = employees.filter(e => !certifiedEmployeeIds.includes(e.id));

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" });
  };

  const handleConfirm = () => {
    if (selectedOption === "keep") {
      onConfirm(dropData?.originalEmployeeId || null);
    } else if (selectedOption === "open") {
      onConfirm(null);
    } else {
      onConfirm(selectedEmployeeId);
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!dropData) return null;

  const isMovingToNewDate = dropData.originalDate !== targetDate;
  const isMovingToNewFunction = dropData.originalFunctionId !== targetFunctionId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCopy ? (
              <>
                <Copy className="h-5 w-5 text-primary" />
                Kopier vakt
              </>
            ) : (
              <>
                <Move className="h-5 w-5 text-primary" />
                Flytt vakt
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isCopy ? "Opprett en kopi av vakten" : "Bekreft flytting av vakten"}
          </DialogDescription>
        </DialogHeader>

        {/* Shift info summary */}
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{dropData.plannedStart?.slice(0, 5)} - {dropData.plannedEnd?.slice(0, 5)}</span>
          </div>
          
          {/* From -> To visualization */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex-1">
              <div className="font-medium text-foreground">{formatDisplayDate(dropData.originalDate)}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-primary" />
            <div className="flex-1 text-right">
              <div className="font-medium text-foreground">{formatDisplayDate(targetDate)}</div>
            </div>
          </div>

          {isMovingToNewFunction && (
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Ny funksjon:</span>
              <span className="font-medium text-foreground">{targetFunctionName}</span>
            </div>
          )}
        </div>

        {/* Employee selection */}
        <div className="space-y-3">
          <Label>Velg ansatt for vakten</Label>
          <RadioGroup
            value={selectedOption}
            onValueChange={(value) => setSelectedOption(value as "keep" | "change" | "open")}
            className="space-y-2"
          >
            {/* Keep current employee */}
            {dropData.originalEmployeeId && dropData.employeeName && (
              <div className={cn(
                "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                selectedOption === "keep" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              )}
              onClick={() => setSelectedOption("keep")}
              >
                <RadioGroupItem value="keep" id="keep" />
                <AvatarWithInitials name={dropData.employeeName} size="sm" />
                <div className="flex-1">
                  <Label htmlFor="keep" className="cursor-pointer font-medium">
                    {dropData.employeeName}
                  </Label>
                  <p className="text-xs text-muted-foreground">Behold nåværende ansatt</p>
                </div>
              </div>
            )}

            {/* Make open shift */}
            <div className={cn(
              "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
              selectedOption === "open" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
            )}
            onClick={() => setSelectedOption("open")}
            >
              <RadioGroupItem value="open" id="open" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <Label htmlFor="open" className="cursor-pointer font-medium">Ledig vakt</Label>
                <p className="text-xs text-muted-foreground">Gjør vakten tilgjengelig for søknad</p>
              </div>
            </div>

            {/* Select another employee */}
            <div className={cn(
              "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
              selectedOption === "change" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
            )}
            onClick={() => setSelectedOption("change")}
            >
              <RadioGroupItem value="change" id="change" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <Label htmlFor="change" className="cursor-pointer font-medium">Velg annen ansatt</Label>
                <p className="text-xs text-muted-foreground">Tildel vakten til en annen</p>
              </div>
            </div>
          </RadioGroup>

          {/* Employee list when "change" is selected */}
          {selectedOption === "change" && (
            <ScrollArea className="h-48 rounded-lg border border-border">
              <div className="p-2 space-y-1">
                {certifiedEmployees.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                      Sertifiserte for {targetFunctionName}
                    </div>
                    {certifiedEmployees.map((employee) => (
                      <div
                        key={employee.id}
                        onClick={() => setSelectedEmployeeId(employee.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-md p-2 cursor-pointer transition-colors",
                          selectedEmployeeId === employee.id 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-muted"
                        )}
                      >
                        <AvatarWithInitials name={employee.full_name} size="sm" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{employee.full_name}</p>
                          <p className="text-xs text-muted-foreground">{employee.functions?.name || "Ingen funksjon"}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                
                {otherEmployees.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase mt-2">
                      Andre ansatte
                    </div>
                    {otherEmployees.map((employee) => (
                      <div
                        key={employee.id}
                        onClick={() => setSelectedEmployeeId(employee.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-md p-2 cursor-pointer transition-colors",
                          selectedEmployeeId === employee.id 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-muted"
                        )}
                      >
                        <AvatarWithInitials name={employee.full_name} size="sm" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{employee.full_name}</p>
                          <p className="text-xs text-muted-foreground">{employee.functions?.name || "Ingen funksjon"}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {employees.length === 0 && (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    Ingen ansatte tilgjengelig
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Avbryt
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedOption === "change" && !selectedEmployeeId}
          >
            {isCopy ? "Kopier vakt" : "Flytt vakt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

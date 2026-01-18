import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FunctionData {
  id: string;
  name: string;
  short_name?: string | null;
  color?: string | null;
  icon?: string | null;
}

interface FunctionFilterButtonsProps {
  functions: FunctionData[];
  activeFunctions: string[];
  onToggle: (functionId: string) => void;
  onToggleAll: () => void;
  showAllActive: boolean;
  showOnlyDepartmentEmployees: boolean;
  onToggleDepartmentFilter: () => void;
  hasDepartmentSelected: boolean;
}

export function FunctionFilterButtons({
  functions,
  activeFunctions,
  onToggle,
  onToggleAll,
  showAllActive,
  showOnlyDepartmentEmployees,
  onToggleDepartmentFilter,
  hasDepartmentSelected,
}: FunctionFilterButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Vis:</span>

      {/* All functions toggle */}
      <Button
        variant={showAllActive ? "default" : "outline"}
        size="sm"
        onClick={onToggleAll}
      >
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Alle funksjoner
      </Button>

      {/* Individual function toggles */}
      {functions.map((func) => {
        const isActive = activeFunctions.includes(func.id);
        return (
          <Button
            key={func.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle(func.id)}
            className={cn(
              "gap-1",
              isActive && "text-white"
            )}
            style={{
              backgroundColor: isActive ? func.color || undefined : undefined,
              borderColor: func.color || undefined,
            }}
          >
            {func.icon && <span>{func.icon}</span>}
            {func.short_name || func.name}
          </Button>
        );
      })}

      {/* Separator */}
      <div className="h-6 w-px bg-border mx-2" />

      {/* Department employees filter */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="dept-employees"
          checked={showOnlyDepartmentEmployees}
          onCheckedChange={() => onToggleDepartmentFilter()}
          disabled={!hasDepartmentSelected}
        />
        <Label
          htmlFor="dept-employees"
          className={cn(
            "text-sm",
            !hasDepartmentSelected && "text-muted-foreground"
          )}
        >
          Kun ansatte på avdeling
        </Label>
      </div>
    </div>
  );
}

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRequiredChecklistsForClockOut, ChecklistTemplate } from "@/hooks/useChecklists";
import { AlertTriangle, ClipboardCheck } from "lucide-react";

interface ClockOutBlockerProps {
  shiftId: string;
  onOpenChecklist: (template: ChecklistTemplate) => void;
}

export function ClockOutBlocker({ shiftId, onOpenChecklist }: ClockOutBlockerProps) {
  const { data } = useRequiredChecklistsForClockOut(shiftId);

  if (!data || data.pendingCount === 0) return null;

  const pendingTemplates = data.templates.filter(
    (t) => !data.completedIds.includes(t.id)
  );

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Kan ikke stemple ut</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>
          Du må fullføre følgende sjekklister før du kan stemple ut:
        </p>
        <div className="flex flex-wrap gap-2">
          {pendingTemplates.map((template) => (
            <Button
              key={template.id}
              size="sm"
              variant="outline"
              onClick={() => onOpenChecklist(template)}
              className="bg-background"
            >
              <ClipboardCheck className="mr-1 h-3 w-3" />
              {template.name}
            </Button>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function useCanClockOut(shiftId: string | null | undefined): {
  canClockOut: boolean;
  pendingCount: number;
  isLoading: boolean;
} {
  const { data, isLoading } = useRequiredChecklistsForClockOut(shiftId);

  return {
    canClockOut: !data || data.pendingCount === 0,
    pendingCount: data?.pendingCount || 0,
    isLoading,
  };
}

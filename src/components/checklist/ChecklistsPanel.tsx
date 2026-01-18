import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ChecklistTemplate,
  useChecklistTemplates,
  useRequiredChecklistsForClockOut,
} from "@/hooks/useChecklists";
import { ChecklistFillModal } from "./ChecklistFillModal";
import {
  ClipboardCheck,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Thermometer,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistsPanelProps {
  shiftId?: string | null;
  compact?: boolean;
  onChecklistComplete?: () => void;
}

const getCategoryIcon = (category: string | null) => {
  switch (category) {
    case "temperature":
      return <Thermometer className="h-4 w-4" />;
    case "opening":
      return <Sun className="h-4 w-4" />;
    case "closing":
      return <Moon className="h-4 w-4" />;
    case "cleaning":
      return <Sparkles className="h-4 w-4" />;
    default:
      return <ClipboardList className="h-4 w-4" />;
  }
};

const getCategoryLabel = (category: string | null) => {
  switch (category) {
    case "temperature":
      return "Temperatur";
    case "opening":
      return "Åpning";
    case "closing":
      return "Stenging";
    case "cleaning":
      return "Renhold";
    case "hygiene":
      return "Hygiene";
    default:
      return "Generell";
  }
};

export function ChecklistsPanel({
  shiftId,
  compact = false,
  onChecklistComplete,
}: ChecklistsPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [fillModalOpen, setFillModalOpen] = useState(false);

  const { data: templates = [], isLoading } = useChecklistTemplates();
  const { data: requiredData } = useRequiredChecklistsForClockOut(shiftId);

  const handleOpenChecklist = (template: ChecklistTemplate) => {
    setSelectedTemplate(template);
    setFillModalOpen(true);
  };

  const requiredTemplates = requiredData?.templates || [];
  const completedIds = requiredData?.completedIds || [];
  const pendingCount = requiredData?.pendingCount || 0;

  const completionPercent =
    requiredTemplates.length > 0
      ? (completedIds.length / requiredTemplates.length) * 100
      : 100;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Laster sjekklister...
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Ingen sjekklister tilgjengelig.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              IK-Mat Sjekklister
            </CardTitle>
            {shiftId && requiredTemplates.length > 0 && (
              <Badge variant={pendingCount > 0 ? "destructive" : "default"}>
                {completedIds.length}/{requiredTemplates.length} fullført
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Required checklists alert */}
          {shiftId && pendingCount > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Påkrevde sjekklister</AlertTitle>
              <AlertDescription>
                Du må fullføre {pendingCount} sjekkliste{pendingCount > 1 ? "r" : ""} før du kan
                stemple ut.
              </AlertDescription>
            </Alert>
          )}

          {/* Progress bar for required checklists */}
          {shiftId && requiredTemplates.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fremgang</span>
                <span className="font-medium">{Math.round(completionPercent)}%</span>
              </div>
              <Progress value={completionPercent} className="h-2" />
            </div>
          )}

          {/* Checklist list */}
          <div className={cn("space-y-2", compact && "max-h-[300px] overflow-y-auto pr-2")}>
            {templates.map((template) => {
              const isCompleted = completedIds.includes(template.id);
              const isRequired = template.is_required_for_clock_out;

              return (
                <div
                  key={template.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3 transition-colors",
                    isCompleted
                      ? "border-success/50 bg-success/5"
                      : isRequired
                      ? "border-destructive/30 bg-destructive/5"
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        isCompleted
                          ? "bg-success/20 text-success"
                          : isRequired
                          ? "bg-destructive/20 text-destructive"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        getCategoryIcon(template.category)
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{template.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{getCategoryLabel(template.category)}</span>
                        {isRequired && !isCompleted && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            Påkrevd
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={isCompleted ? "outline" : isRequired ? "destructive" : "default"}
                    onClick={() => handleOpenChecklist(template)}
                    disabled={isCompleted}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Fullført
                      </>
                    ) : (
                      <>
                        <ClipboardList className="mr-1 h-3 w-3" />
                        Fyll ut
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <ChecklistFillModal
        open={fillModalOpen}
        onOpenChange={setFillModalOpen}
        template={selectedTemplate}
        shiftId={shiftId}
        onComplete={onChecklistComplete}
      />
    </>
  );
}

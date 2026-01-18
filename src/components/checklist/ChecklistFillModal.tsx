import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChecklistTemplate,
  ChecklistItem,
  useChecklistItems,
  useCreateChecklistCompletion,
} from "@/hooks/useChecklists";
import { useAuth } from "@/contexts/AuthContext";
import {
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistFillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ChecklistTemplate | null;
  shiftId?: string | null;
  onComplete?: () => void;
}

interface ResponseState {
  [itemId: string]: {
    checked: boolean;
    value: string;
    notes: string;
    isFlagged: boolean;
  };
}

export function ChecklistFillModal({
  open,
  onOpenChange,
  template,
  shiftId,
  onComplete,
}: ChecklistFillModalProps) {
  const { user } = useAuth();
  const { data: items = [], isLoading } = useChecklistItems(template?.id || null);
  const createCompletion = useCreateChecklistCompletion();
  
  const [responses, setResponses] = useState<ResponseState>({});
  const [notes, setNotes] = useState("");

  const handleResponseChange = (
    itemId: string,
    field: keyof ResponseState[string],
    value: boolean | string
  ) => {
    setResponses((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const validateTemperature = (item: ChecklistItem, value: string): boolean => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;
    if (item.min_value !== null && numValue < item.min_value) return false;
    if (item.max_value !== null && numValue > item.max_value) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!template || !user) return;

    const responseData = items.map((item) => {
      const response = responses[item.id] || { checked: false, value: "", notes: "", isFlagged: false };
      const isFlagged =
        item.item_type === "temperature" || item.item_type === "number"
          ? !validateTemperature(item, response.value || "")
          : false;

      return {
        itemId: item.id,
        checked: response.checked ?? false,
        value: response.value ?? null,
        notes: response.notes ?? null,
        isFlagged,
      };
    });

    await createCompletion.mutateAsync({
      templateId: template.id,
      employeeId: user.id,
      shiftId,
      responses: responseData,
      notes,
    });

    // Reset form
    setResponses({});
    setNotes("");
    onOpenChange(false);
    onComplete?.();
  };

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case "temperature":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "opening":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "closing":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "cleaning":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const criticalItemsCompleted = items
    .filter((item) => item.is_critical)
    .every((item) => {
      const response = responses[item.id] || { checked: false, value: "", notes: "", isFlagged: false };
      if (item.item_type === "checkbox") {
        return response.checked;
      }
      if (item.item_type === "temperature" || item.item_type === "number") {
        return response.value && validateTemperature(item, response.value);
      }
      return response.value;
    });

  const allItemsCompleted = items.every((item) => {
    const response = responses[item.id] || { checked: false, value: "", notes: "", isFlagged: false };
    if (item.item_type === "checkbox") {
      return response.checked;
    }
    return response.value;
  });

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            <div>
              <DialogTitle>{template.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getCategoryColor(template.category)}>
                  {template.category || "Generell"}
                </Badge>
                {template.is_required_for_clock_out && (
                  <Badge variant="destructive">Påkrevd for utstempling</Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {template.description && (
          <p className="text-sm text-muted-foreground">{template.description}</p>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-4">
              {items.map((item) => {
                const defaultResponse = { checked: false, value: "", notes: "", isFlagged: false };
                const response = responses[item.id] || defaultResponse;
                const isTemperature =
                  item.item_type === "temperature" || item.item_type === "number";
                const responseValue = response.value || "";
                const isOutOfRange =
                  isTemperature && responseValue && !validateTemperature(item, responseValue);

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-lg border p-4 transition-colors",
                      item.is_critical && "border-destructive/50 bg-destructive/5",
                      isOutOfRange && "border-warning bg-warning/10"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {item.item_type === "checkbox" ? (
                        <Checkbox
                          id={item.id}
                          checked={response.checked || false}
                          onCheckedChange={(checked) =>
                            handleResponseChange(item.id, "checked", !!checked)
                          }
                          className="mt-1"
                        />
                      ) : (
                        <Thermometer className="h-5 w-5 mt-0.5 text-primary" />
                      )}

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor={item.id}
                            className={cn(
                              "font-medium",
                              item.is_critical && "text-destructive"
                            )}
                          >
                            {item.title}
                            {item.is_critical && (
                              <span className="ml-1 text-destructive">*</span>
                            )}
                          </Label>
                        </div>

                        {item.description && (
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        )}

                        {isTemperature && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.1"
                              placeholder={`${item.min_value ?? ""} - ${item.max_value ?? ""}`}
                              value={responseValue}
                              onChange={(e) =>
                                handleResponseChange(item.id, "value", e.target.value)
                              }
                              className={cn(
                                "w-24",
                                isOutOfRange && "border-warning focus-visible:ring-warning"
                              )}
                            />
                            <span className="text-sm text-muted-foreground">
                              {item.unit === "celsius" ? "°C" : item.unit}
                            </span>
                            {item.min_value !== null && item.max_value !== null && (
                              <span className="text-xs text-muted-foreground">
                                (Gyldig: {item.min_value} - {item.max_value})
                              </span>
                            )}
                            {isOutOfRange && (
                              <AlertTriangle className="h-4 w-4 text-warning" />
                            )}
                          </div>
                        )}

                        {item.item_type === "text" && (
                          <Input
                            placeholder="Skriv inn..."
                            value={responseValue}
                            onChange={(e) =>
                              handleResponseChange(item.id, "value", e.target.value)
                            }
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <div className="space-y-3">
          <div>
            <Label htmlFor="notes">Kommentar (valgfritt)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Legg til eventuelle merknader..."
              rows={2}
            />
          </div>

          {!criticalItemsCompleted && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Alle kritiske punkter (merket med *) må fullføres.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!criticalItemsCompleted || createCompletion.isPending}
          >
            {createCompletion.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Fullfør sjekkliste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

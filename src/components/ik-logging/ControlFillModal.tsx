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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  CheckCircle2,
  Thermometer,
  Camera,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  IKControlTemplate,
  IKControlItem,
  useIKControlItems,
  useCreateControlLog,
} from "@/hooks/useIKControls";

interface ControlFillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: IKControlTemplate | null;
}

interface ItemResponse {
  itemId: string;
  checked: boolean;
  value: string;
  numericValue: number | null;
  notes: string;
  isDeviation: boolean;
  deviationAction: string;
}

export function ControlFillModal({
  open,
  onOpenChange,
  template,
}: ControlFillModalProps) {
  const [responses, setResponses] = useState<Record<string, ItemResponse>>({});
  const [generalNotes, setGeneralNotes] = useState("");

  const { data: items = [] } = useIKControlItems(template?.id || null);
  const createLog = useCreateControlLog();

  // Reset form when template changes
  useEffect(() => {
    if (template && items.length > 0) {
      const initialResponses: Record<string, ItemResponse> = {};
      items.forEach((item) => {
        initialResponses[item.id] = {
          itemId: item.id,
          checked: false,
          value: "",
          numericValue: null,
          notes: "",
          isDeviation: false,
          deviationAction: "",
        };
      });
      setResponses(initialResponses);
      setGeneralNotes("");
    }
  }, [template, items]);

  const updateResponse = (itemId: string, updates: Partial<ItemResponse>) => {
    setResponses((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...updates },
    }));
  };

  const checkForDeviation = (item: IKControlItem, value: number) => {
    if (item.min_value !== null && value < item.min_value) return true;
    if (item.max_value !== null && value > item.max_value) return true;
    return false;
  };

  const handleNumericChange = (item: IKControlItem, value: string) => {
    const numValue = parseFloat(value);
    const isDeviation = !isNaN(numValue) && checkForDeviation(item, numValue);

    updateResponse(item.id, {
      value,
      numericValue: isNaN(numValue) ? null : numValue,
      isDeviation,
    });
  };

  const handleSubmit = () => {
    if (!template) return;

    const responseList = Object.values(responses);
    createLog.mutate(
      {
        templateId: template.id,
        responses: responseList,
        notes: generalNotes || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const hasDeviations = Object.values(responses).some((r) => r.isDeviation);
  const allCriticalChecked = items
    .filter((item) => item.is_critical)
    .every((item) => {
      const response = responses[item.id];
      if (!response) return false;
      if (item.item_type === "checkbox") return response.checked;
      if (item.item_type === "number" || item.item_type === "temperature") {
        return response.numericValue !== null;
      }
      return true;
    });

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            {template.name}
          </DialogTitle>
          {template.description && (
            <p className="text-sm text-muted-foreground">{template.description}</p>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4">
            {items.map((item) => {
              const response = responses[item.id];
              if (!response) return null;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-lg border p-4 space-y-3",
                    response.isDeviation && "border-destructive bg-destructive/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium">{item.title}</Label>
                        {item.is_critical && (
                          <Badge variant="destructive" className="text-xs">
                            Kritisk
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Checkbox type */}
                  {item.item_type === "checkbox" && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={response.checked}
                        onCheckedChange={(checked) =>
                          updateResponse(item.id, { checked: checked === true })
                        }
                      />
                      <span className="text-sm">Utført / OK</span>
                    </div>
                  )}

                  {/* Number/Temperature type */}
                  {(item.item_type === "number" || item.item_type === "temperature") && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {item.item_type === "temperature" && (
                          <Thermometer className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Input
                          type="number"
                          step="0.1"
                          placeholder={`Verdi${item.unit ? ` (${item.unit})` : ""}`}
                          value={response.value}
                          onChange={(e) => handleNumericChange(item, e.target.value)}
                          className={cn(
                            "w-32",
                            response.isDeviation && "border-destructive"
                          )}
                        />
                        {item.unit && (
                          <span className="text-sm text-muted-foreground">
                            {item.unit}
                          </span>
                        )}
                      </div>
                      {(item.min_value !== null || item.max_value !== null) && (
                        <p className="text-xs text-muted-foreground">
                          Grenser:{" "}
                          {item.min_value !== null && `Min: ${item.min_value}`}
                          {item.min_value !== null && item.max_value !== null && " - "}
                          {item.max_value !== null && `Max: ${item.max_value}`}
                          {item.unit && ` ${item.unit}`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Text type */}
                  {item.item_type === "text" && (
                    <Textarea
                      placeholder="Skriv inn verdi..."
                      value={response.value}
                      onChange={(e) => updateResponse(item.id, { value: e.target.value })}
                      rows={2}
                    />
                  )}

                  {/* Deviation alert and action */}
                  {response.isDeviation && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="space-y-2">
                        <p>Verdien er utenfor akseptable grenser!</p>
                        <Textarea
                          placeholder="Beskriv tiltak som er iverksatt..."
                          value={response.deviationAction}
                          onChange={(e) =>
                            updateResponse(item.id, { deviationAction: e.target.value })
                          }
                          rows={2}
                        />
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Notes */}
                  <Input
                    placeholder="Notater (valgfritt)"
                    value={response.notes}
                    onChange={(e) => updateResponse(item.id, { notes: e.target.value })}
                  />
                </div>
              );
            })}

            {/* General notes */}
            <div className="space-y-2">
              <Label>Generelle merknader</Label>
              <Textarea
                placeholder="Eventuelle kommentarer til denne kontrollen..."
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </ScrollArea>

        {hasDeviations && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Denne kontrollen inneholder avvik. Sørg for at tiltak er dokumentert.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createLog.isPending || (items.some((i) => i.is_critical) && !allCriticalChecked)}
          >
            {createLog.isPending ? (
              "Lagrer..."
            ) : hasDeviations ? (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Registrer med avvik
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Registrer kontroll
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

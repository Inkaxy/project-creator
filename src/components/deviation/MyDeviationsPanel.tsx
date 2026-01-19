import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  useMyAssignedDeviations,
  useConfirmDeviation,
  Deviation,
} from "@/hooks/useDeviations";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lightbulb,
  AlertOctagon,
  Camera,
} from "lucide-react";

const categoryIcons: Record<string, React.ElementType> = {
  idea: Lightbulb,
  concern: AlertTriangle,
  accident: AlertOctagon,
};

const severityColors: Record<string, string> = {
  low: "secondary",
  medium: "warning",
  high: "destructive",
  critical: "destructive",
};

interface MyDeviationsPanelProps {
  showOnlyPending?: boolean;
}

export function MyDeviationsPanel({ showOnlyPending = false }: MyDeviationsPanelProps) {
  const { user } = useAuth();
  const { data: deviations = [], isLoading } = useMyAssignedDeviations(user?.id);
  const confirmDeviation = useConfirmDeviation();

  const [selectedDeviation, setSelectedDeviation] = useState<Deviation | null>(null);
  const [confirmNotes, setConfirmNotes] = useState("");

  const filteredDeviations = showOnlyPending
    ? deviations.filter((d) => d.require_clock_out_confirmation && !d.confirmed_at)
    : deviations;

  const handleConfirm = async () => {
    if (!selectedDeviation || !user?.id) return;

    await confirmDeviation.mutateAsync({
      id: selectedDeviation.id,
      confirmedBy: user.id,
      notes: confirmNotes || undefined,
    });

    setSelectedDeviation(null);
    setConfirmNotes("");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Laster...
        </CardContent>
      </Card>
    );
  }

  if (filteredDeviations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Mine avvik
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          Du har ingen tildelte avvik
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Mine tildelte avvik
            {filteredDeviations.length > 0 && (
              <Badge variant="destructive">{filteredDeviations.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredDeviations.map((deviation) => {
            const Icon = categoryIcons[deviation.category] || AlertTriangle;
            const needsConfirmation =
              deviation.require_clock_out_confirmation && !deviation.confirmed_at;

            return (
              <div
                key={deviation.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{deviation.title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {format(new Date(deviation.created_at), "d. MMM", {
                          locale: nb,
                        })}
                      </span>
                      {deviation.department?.name && (
                        <>
                          <span>•</span>
                          <span>{deviation.department.name}</span>
                        </>
                      )}
                      {deviation.due_date && (
                        <>
                          <span>•</span>
                          <span className="text-warning">
                            Frist: {format(new Date(deviation.due_date), "d. MMM", { locale: nb })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={severityColors[deviation.severity] as "secondary" | "warning" | "destructive"}>
                    {deviation.severity === "low" && "Lav"}
                    {deviation.severity === "medium" && "Medium"}
                    {deviation.severity === "high" && "Høy"}
                    {deviation.severity === "critical" && "Kritisk"}
                  </Badge>
                  {needsConfirmation ? (
                    <Button
                      size="sm"
                      onClick={() => setSelectedDeviation(deviation)}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Bekreft
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedDeviation(deviation)}
                    >
                      Se detaljer
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={!!selectedDeviation}
        onOpenChange={(open) => !open && setSelectedDeviation(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDeviation?.require_clock_out_confirmation &&
              !selectedDeviation?.confirmed_at
                ? "Bekreft at avviket er håndtert"
                : "Avviksdetaljer"}
            </DialogTitle>
          </DialogHeader>

          {selectedDeviation && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">{selectedDeviation.title}</h4>
                {selectedDeviation.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedDeviation.description}
                  </p>
                )}
              </div>

              {selectedDeviation.department?.name && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Avdeling:</span>
                  <span>{selectedDeviation.department.name}</span>
                </div>
              )}

              {selectedDeviation.location && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Plassering:</span>
                  <span>{selectedDeviation.location}</span>
                </div>
              )}

              {selectedDeviation.require_clock_out_confirmation &&
                !selectedDeviation.confirmed_at && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmNotes">
                      Beskriv hva du har gjort for å løse avviket
                    </Label>
                    <Textarea
                      id="confirmNotes"
                      value={confirmNotes}
                      onChange={(e) => setConfirmNotes(e.target.value)}
                      placeholder="Beskriv tiltak..."
                      rows={3}
                    />
                    <Button variant="outline" size="sm" disabled>
                      <Camera className="mr-2 h-4 w-4" />
                      Last opp bilde (kommer snart)
                    </Button>
                  </div>
                )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDeviation(null)}>
              Avbryt
            </Button>
            {selectedDeviation?.require_clock_out_confirmation &&
              !selectedDeviation?.confirmed_at && (
                <Button
                  onClick={handleConfirm}
                  disabled={confirmDeviation.isPending}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {confirmDeviation.isPending ? "Bekrefter..." : "Bekreft utført"}
                </Button>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

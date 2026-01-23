import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardCheck,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Thermometer,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  usePendingControls,
  useTodayControlLogs,
  IKControlTemplate,
} from "@/hooks/useIKControls";
import { ControlFillModal } from "./ControlFillModal";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface TodayControlsPanelProps {
  departmentId?: string | null;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "temperature":
      return <Thermometer className="h-4 w-4" />;
    case "hygiene":
      return <Sparkles className="h-4 w-4" />;
    case "safety":
      return <ShieldCheck className="h-4 w-4" />;
    default:
      return <ClipboardList className="h-4 w-4" />;
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case "temperature":
      return "Temperatur";
    case "hygiene":
      return "Hygiene";
    case "safety":
      return "Sikkerhet";
    case "equipment":
      return "Utstyr";
    default:
      return "Generell";
  }
};

const getFrequencyLabel = (frequency: string) => {
  switch (frequency) {
    case "daily":
      return "Daglig";
    case "weekly":
      return "Ukentlig";
    case "monthly":
      return "Månedlig";
    case "shift":
      return "Per vakt";
    default:
      return frequency;
  }
};

export function TodayControlsPanel({ departmentId }: TodayControlsPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<IKControlTemplate | null>(null);
  const [fillModalOpen, setFillModalOpen] = useState(false);

  const { data: pendingData, isLoading } = usePendingControls(departmentId);
  const { data: todayLogs = [] } = useTodayControlLogs(departmentId);

  const handleOpenControl = (template: IKControlTemplate) => {
    setSelectedTemplate(template);
    setFillModalOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Laster kontroller...
        </CardContent>
      </Card>
    );
  }

  const templates = pendingData?.templates || [];
  const pending = pendingData?.pending || [];
  const completed = pendingData?.completed || [];
  const completionPercent =
    templates.length > 0
      ? ((templates.length - pending.length) / templates.length) * 100
      : 100;

  return (
    <>
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fullført i dag</p>
                  <p className="text-2xl font-bold">
                    {completed.length}/{templates.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Venter</p>
                  <p className="text-2xl font-bold">{pending.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avvik i dag</p>
                  <p className="text-2xl font-bold">
                    {todayLogs.filter((l) => l.has_deviations).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Fremgang i dag</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(completionPercent)}%
              </span>
            </div>
            <Progress value={completionPercent} className="h-2" />
          </CardContent>
        </Card>

        {/* Pending controls */}
        {pending.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-warning" />
                Venter på utfylling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pending.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/20 text-warning">
                      {getCategoryIcon(template.category)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{template.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{getCategoryLabel(template.category)}</span>
                        <span>•</span>
                        <span>{getFrequencyLabel(template.frequency)}</span>
                        {template.departments && (
                          <>
                            <span>•</span>
                            <Badge
                              variant="outline"
                              className="text-xs px-1 py-0"
                              style={{
                                borderColor: template.departments.color || undefined,
                                color: template.departments.color || undefined,
                              }}
                            >
                              {template.departments.name}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleOpenControl(template)}>
                    <ClipboardList className="mr-1 h-3 w-3" />
                    Fyll ut
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Completed controls */}
        {completed.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Fullført i dag
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayLogs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3",
                    log.has_deviations
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-success/30 bg-success/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        log.has_deviations
                          ? "bg-destructive/20 text-destructive"
                          : "bg-success/20 text-success"
                      )}
                    >
                      {log.has_deviations ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {log.ik_control_templates?.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{log.profiles?.full_name}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(log.logged_at), "HH:mm", { locale: nb })}
                        </span>
                        {log.has_deviations && (
                          <Badge variant="destructive" className="text-xs px-1 py-0">
                            Avvik
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Se detaljer
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {templates.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                Ingen kontrollpunkter er satt opp ennå.
              </p>
              <p className="text-sm text-muted-foreground">
                Gå til Oppsett-fanen for å legge til kontrollpunkter.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <ControlFillModal
        open={fillModalOpen}
        onOpenChange={setFillModalOpen}
        template={selectedTemplate}
      />
    </>
  );
}

import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { WorkTimeViolation, ViolationLevel } from "@/hooks/useWorkTimeRules";

interface WorkTimeAlertsPanelProps {
  violations: WorkTimeViolation[];
  onDismiss?: () => void;
  compact?: boolean;
}

const levelConfig: Record<ViolationLevel, { icon: typeof AlertCircle; color: string; bgColor: string; label: string }> = {
  critical: {
    icon: AlertCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10 border-destructive/20",
    label: "Kritisk",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-warning",
    bgColor: "bg-warning/10 border-warning/20",
    label: "Advarsel",
  },
  info: {
    icon: Info,
    color: "text-primary",
    bgColor: "bg-primary/10 border-primary/20",
    label: "Info",
  },
};

export function WorkTimeAlertsPanel({ violations, onDismiss, compact = false }: WorkTimeAlertsPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (violations.length === 0) return null;

  const criticalCount = violations.filter((v) => v.level === "critical").length;
  const warningCount = violations.filter((v) => v.level === "warning").length;
  const infoCount = violations.filter((v) => v.level === "info").length;

  const groupedViolations = violations.reduce((acc, v) => {
    if (!acc[v.level]) acc[v.level] = [];
    acc[v.level].push(v);
    return acc;
  }, {} as Record<ViolationLevel, WorkTimeViolation[]>);

  if (compact) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className={cn(
          "border",
          criticalCount > 0 ? "border-destructive/30 bg-destructive/5" : 
          warningCount > 0 ? "border-warning/30 bg-warning/5" : 
          "border-primary/30 bg-primary/5"
        )}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className={cn(
                    "h-4 w-4",
                    criticalCount > 0 ? "text-destructive" : 
                    warningCount > 0 ? "text-warning" : 
                    "text-primary"
                  )} />
                  <CardTitle className="text-sm font-medium">
                    Arbeidstidsvarsler
                  </CardTitle>
                  <div className="flex gap-1">
                    {criticalCount > 0 && (
                      <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                        {criticalCount}
                      </Badge>
                    )}
                    {warningCount > 0 && (
                      <Badge className="h-5 bg-warning px-1.5 text-xs text-warning-foreground">
                        {warningCount}
                      </Badge>
                    )}
                    {infoCount > 0 && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {infoCount}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onDismiss && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismiss();
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <ScrollArea className="max-h-[140px]">
                <div className="space-y-2 pr-3">
                  {violations.slice(0, Math.max(violations.length, 2)).map((violation) => (
                    <ViolationItem key={violation.id} violation={violation} />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Arbeidstidsvarsler
          </CardTitle>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive">
                {criticalCount} kritiske
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-warning text-warning-foreground">
                {warningCount} advarsler
              </Badge>
            )}
            {infoCount > 0 && (
              <Badge variant="secondary">
                {infoCount} info
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-4">
            {(["critical", "warning", "info"] as ViolationLevel[]).map((level) => {
              const levelViolations = groupedViolations[level];
              if (!levelViolations?.length) return null;

              const config = levelConfig[level];
              const Icon = config.icon;

              return (
                <div key={level} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", config.color)} />
                    <span className={cn("text-sm font-medium", config.color)}>
                      {config.label.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-2 pl-6">
                    {levelViolations.map((violation) => (
                      <ViolationItem key={violation.id} violation={violation} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ViolationItem({ violation }: { violation: WorkTimeViolation }) {
  const config = levelConfig[violation.level];

  return (
    <div className={cn(
      "rounded-lg border p-2 text-sm",
      config.bgColor
    )}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="font-medium text-foreground">
            {violation.employeeName}
          </p>
          <p className="text-muted-foreground">
            {violation.message}
          </p>
          {violation.date && (
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(violation.date).toLocaleDateString("nb-NO", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </p>
          )}
        </div>
        {violation.details && (
          <Badge variant="outline" className="shrink-0 text-xs">
            {violation.details.actual.toFixed(1)}/{violation.details.limit} {violation.details.unit}
          </Badge>
        )}
      </div>
    </div>
  );
}

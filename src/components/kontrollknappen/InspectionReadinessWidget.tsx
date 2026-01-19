import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ClipboardCheck, 
  Shield, 
  Flame, 
  Wine,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Loader2
} from "lucide-react";
import { 
  InspectionType, 
  InspectionReadiness,
  useMattilsynetReadiness, 
  useArbeidstilsynetReadiness, 
  useBranntilsynReadiness, 
  useSkjenkekontrollReadiness,
} from "@/hooks/useInspections";
import { cn } from "@/lib/utils";

interface InspectionReadinessWidgetProps {
  inspectionType: InspectionType;
  onGenerateReport?: () => void;
}

const TYPE_CONFIG = {
  mattilsynet: { 
    title: "Mattilsynet", 
    icon: ClipboardCheck, 
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  arbeidstilsynet: { 
    title: "Arbeidstilsynet", 
    icon: Shield, 
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  branntilsyn: { 
    title: "Branntilsyn", 
    icon: Flame, 
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  },
  skjenkekontroll: { 
    title: "Skjenkekontroll", 
    icon: Wine, 
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
};

export function InspectionReadinessWidget({ inspectionType, onGenerateReport }: InspectionReadinessWidgetProps) {
  const config = TYPE_CONFIG[inspectionType];
  const Icon = config.icon;

  // Fetch the right readiness based on type
  const { data: mattilsynet, isLoading: loadingMat } = useMattilsynetReadiness();
  const { data: arbeidstilsynet, isLoading: loadingArb } = useArbeidstilsynetReadiness();
  const { data: branntilsyn, isLoading: loadingBrann } = useBranntilsynReadiness();
  const { data: skjenkekontroll, isLoading: loadingSkjenke } = useSkjenkekontrollReadiness();

  const readiness: InspectionReadiness | undefined = {
    mattilsynet,
    arbeidstilsynet,
    branntilsyn,
    skjenkekontroll,
  }[inspectionType];

  const isLoading = {
    mattilsynet: loadingMat,
    arbeidstilsynet: loadingArb,
    branntilsyn: loadingBrann,
    skjenkekontroll: loadingSkjenke,
  }[inspectionType];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-success";
    if (score >= 50) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("rounded-lg p-2", config.bgColor)}>
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            <div>
              <CardTitle className="text-base">{config.title}</CardTitle>
              <CardDescription>Tilsynsberedskap</CardDescription>
            </div>
          </div>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : readiness ? (
            <span className={cn("text-2xl font-bold", getScoreColor(readiness.overallScore))}>
              {readiness.overallScore}%
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="h-20 animate-pulse rounded bg-muted" />
        ) : readiness ? (
          <>
            <Progress 
              value={readiness.overallScore} 
              className="h-2"
            />

            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <div className="flex items-center gap-1 text-sm">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>{readiness.greenCount}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span>{readiness.yellowCount}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span>{readiness.redCount}</span>
                </div>
              </div>
            </div>

            {/* Show critical issues */}
            {readiness.sections.filter(s => s.status === "red").length > 0 && (
              <div className="space-y-1">
                {readiness.sections
                  .filter(s => s.status === "red")
                  .slice(0, 2)
                  .map((section) => (
                    <div 
                      key={section.id}
                      className="flex items-center gap-2 text-sm text-destructive"
                    >
                      <XCircle className="h-3 w-3" />
                      <span>{section.action || section.title}</span>
                    </div>
                  ))
                }
              </div>
            )}

            {onGenerateReport && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={onGenerateReport}
              >
                <FileText className="mr-2 h-4 w-4" />
                Generer rapport
              </Button>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Kunne ikke laste data</p>
        )}
      </CardContent>
    </Card>
  );
}

// Combined widget showing all inspection types
export function AllInspectionsWidget({ onOpenKontrollknappen }: { onOpenKontrollknappen: () => void }) {
  const { data: mattilsynet } = useMattilsynetReadiness();
  const { data: arbeidstilsynet } = useArbeidstilsynetReadiness();
  const { data: branntilsyn } = useBranntilsynReadiness();
  const { data: skjenkekontroll } = useSkjenkekontrollReadiness();

  const allReadiness = [
    { type: "mattilsynet" as InspectionType, data: mattilsynet },
    { type: "arbeidstilsynet" as InspectionType, data: arbeidstilsynet },
    { type: "branntilsyn" as InspectionType, data: branntilsyn },
    { type: "skjenkekontroll" as InspectionType, data: skjenkekontroll },
  ];

  const getStatusIcon = (score?: number) => {
    if (!score) return null;
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-success" />;
    if (score >= 50) return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Kontrollknappen™
            </CardTitle>
            <CardDescription>Tilsynsberedskap oversikt</CardDescription>
          </div>
          <Button onClick={onOpenKontrollknappen}>
            Generer rapport
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {allReadiness.map(({ type, data }) => {
            const config = TYPE_CONFIG[type];
            const Icon = config.icon;
            
            return (
              <div 
                key={type}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className={cn("rounded-lg p-2", config.bgColor)}>
                  <Icon className={cn("h-5 w-5", config.color)} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{config.title}</p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(data?.overallScore)}
                    <span className="text-lg font-bold">
                      {data?.overallScore ?? "-"}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

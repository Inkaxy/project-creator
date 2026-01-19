import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ClipboardCheck, 
  Shield, 
  Flame, 
  Wine,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Download,
  ArrowRight,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { 
  InspectionType, 
  useMattilsynetReadiness, 
  useArbeidstilsynetReadiness, 
  useBranntilsynReadiness, 
  useSkjenkekontrollReadiness,
  useCreateInspectionReport,
  InspectionReadiness,
  SectionStatus
} from "@/hooks/useInspections";
import { format, subMonths } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface KontrollknappenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INSPECTION_TYPES = [
  { 
    id: "mattilsynet" as InspectionType, 
    title: "Mattilsynet", 
    icon: ClipboardCheck, 
    color: "text-green-600",
    description: "IK-Mat, HACCP, temperatur, hygiene"
  },
  { 
    id: "arbeidstilsynet" as InspectionType, 
    title: "Arbeidstilsynet", 
    icon: Shield, 
    color: "text-blue-600",
    description: "HMS, vernerunder, risikovurdering"
  },
  { 
    id: "branntilsyn" as InspectionType, 
    title: "Branntilsyn", 
    icon: Flame, 
    color: "text-orange-600",
    description: "Brannøvelser, utstyr, instrukser"
  },
  { 
    id: "skjenkekontroll" as InspectionType, 
    title: "Skjenkekontroll", 
    icon: Wine, 
    color: "text-purple-600",
    description: "Bevilling, kunnskapsprøve, rutiner"
  },
];

const PERIOD_OPTIONS = [
  { value: "3", label: "Siste 3 måneder" },
  { value: "6", label: "Siste 6 måneder" },
  { value: "12", label: "Siste 12 måneder" },
];

export function KontrollknappenModal({ isOpen, onClose }: KontrollknappenModalProps) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<InspectionType | null>(null);
  const [period, setPeriod] = useState("3");
  const [notes, setNotes] = useState("");

  // Fetch readiness for all types
  const { data: mattilsynetReadiness, isLoading: loadingMat } = useMattilsynetReadiness();
  const { data: arbeidstilsynetReadiness, isLoading: loadingArb } = useArbeidstilsynetReadiness();
  const { data: branntilsynReadiness, isLoading: loadingBrann } = useBranntilsynReadiness();
  const { data: skjenkekontrollReadiness, isLoading: loadingSkjenke } = useSkjenkekontrollReadiness();

  const createReport = useCreateInspectionReport();

  const getReadiness = (type: InspectionType): InspectionReadiness | undefined => {
    switch (type) {
      case "mattilsynet": return mattilsynetReadiness;
      case "arbeidstilsynet": return arbeidstilsynetReadiness;
      case "branntilsyn": return branntilsynReadiness;
      case "skjenkekontroll": return skjenkekontrollReadiness;
    }
  };

  const isLoading = loadingMat || loadingArb || loadingBrann || loadingSkjenke;

  const handleGenerate = async () => {
    if (!selectedType) return;

    const periodMonths = parseInt(period);
    const periodTo = new Date();
    const periodFrom = subMonths(periodTo, periodMonths);

    const readiness = getReadiness(selectedType);

    await createReport.mutateAsync({
      inspection_type: selectedType,
      period_from: format(periodFrom, "yyyy-MM-dd"),
      period_to: format(periodTo, "yyyy-MM-dd"),
      metadata: {
        score: readiness?.overallScore,
        greenCount: readiness?.greenCount,
        yellowCount: readiness?.yellowCount,
        redCount: readiness?.redCount,
        sections: readiness?.sections,
      },
      notes,
    });

    // Reset and close
    setStep(1);
    setSelectedType(null);
    setPeriod("3");
    setNotes("");
    onClose();
  };

  const handleClose = () => {
    setStep(1);
    setSelectedType(null);
    setPeriod("3");
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Kontrollknappen™
          </DialogTitle>
          <DialogDescription>
            Generer tilsynsrapport med ett trykk
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                step >= s 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              )}>
                {s}
              </div>
              {s < 3 && (
                <div className={cn(
                  "h-0.5 w-8",
                  step > s ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Choose inspection type */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Velg tilsynstype</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {INSPECTION_TYPES.map((type) => {
                const readiness = getReadiness(type.id);
                const Icon = type.icon;
                
                return (
                  <Card 
                    key={type.id}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary",
                      selectedType === type.id && "border-primary ring-1 ring-primary"
                    )}
                    onClick={() => setSelectedType(type.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-5 w-5", type.color)} />
                          <CardTitle className="text-base">{type.title}</CardTitle>
                        </div>
                        {readiness && (
                          <Badge 
                            variant={readiness.overallScore >= 80 ? "success" : readiness.overallScore >= 50 ? "warning" : "destructive"}
                            className={cn(
                              readiness.overallScore >= 80 ? "bg-success/10 text-success" : 
                              readiness.overallScore >= 50 ? "bg-warning/10 text-warning" : 
                              "bg-destructive/10 text-destructive"
                            )}
                          >
                            {readiness.overallScore}%
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{type.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Laster...
                        </div>
                      ) : readiness ? (
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-success">
                            <CheckCircle className="h-4 w-4" />
                            {readiness.greenCount}
                          </div>
                          <div className="flex items-center gap-1 text-warning">
                            <AlertTriangle className="h-4 w-4" />
                            {readiness.yellowCount}
                          </div>
                          <div className="flex items-center gap-1 text-destructive">
                            <XCircle className="h-4 w-4" />
                            {readiness.redCount}
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Configure and preview */}
        {step === 2 && selectedType && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label>Periode</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ReadinessPreview readiness={getReadiness(selectedType)} />

            <div className="space-y-2">
              <Label>Notater (valgfritt)</Label>
              <Textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Legg til notater til rapporten..."
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Step 3: Confirm and generate */}
        {step === 3 && selectedType && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bekreft rapportgenerering</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tilsynstype:</span>
                    <span className="font-medium">
                      {INSPECTION_TYPES.find(t => t.id === selectedType)?.title}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Periode:</span>
                    <span className="font-medium">
                      {PERIOD_OPTIONS.find(p => p.value === period)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Beredskap:</span>
                    <span className="font-medium">
                      {getReadiness(selectedType)?.overallScore}%
                    </span>
                  </div>
                </div>

                {getReadiness(selectedType)?.redCount && getReadiness(selectedType)!.redCount > 0 && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">
                        {getReadiness(selectedType)?.redCount} kritiske mangler
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Vurder å utbedre manglene før tilsyn
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tilbake
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button 
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !selectedType}
            >
              Neste
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleGenerate}
              disabled={createReport.isPending}
            >
              {createReport.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Genererer...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generer rapport
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReadinessPreview({ readiness }: { readiness?: InspectionReadiness }) {
  if (!readiness) return null;

  return (
    <div className="space-y-4">
      {/* Overall score */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total beredskap</p>
              <p className="text-3xl font-bold">{readiness.overallScore}%</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <p className="mt-1 text-lg font-semibold">{readiness.greenCount}</p>
              </div>
              <div className="text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <p className="mt-1 text-lg font-semibold">{readiness.yellowCount}</p>
              </div>
              <div className="text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <p className="mt-1 text-lg font-semibold">{readiness.redCount}</p>
              </div>
            </div>
          </div>
          <Progress 
            value={readiness.overallScore} 
            className="mt-4 h-2"
          />
        </CardContent>
      </Card>

      {/* Section details */}
      <div className="space-y-2">
        <h4 className="font-medium">Seksjoner</h4>
        <div className="space-y-2">
          {readiness.sections.map((section) => (
            <SectionRow key={section.id} section={section} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionRow({ section }: { section: SectionStatus }) {
  const statusConfig = {
    green: { icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
    yellow: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
    red: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  };

  const config = statusConfig[section.status];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className={cn("rounded-lg p-2", config.bg)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        <div>
          <p className="font-medium">{section.title}</p>
          <p className="text-sm text-muted-foreground">{section.details}</p>
        </div>
      </div>
      {section.action && (
        <Badge variant="outline" className="text-xs">
          {section.action}
        </Badge>
      )}
    </div>
  );
}

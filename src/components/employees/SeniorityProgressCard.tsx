import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  TrendingUp,
  Target,
  Clock,
  DollarSign,
  Plus,
  ChevronDown,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { WageLadder, calculateCurrentLevel } from "@/hooks/useWageLadders";
import { useSeniorityLog, useAddSeniorityHours, senioritySourceLabels } from "@/hooks/useSeniorityLog";
import { useAuth } from "@/contexts/AuthContext";

interface SeniorityProgressCardProps {
  employeeId: string;
  employeeName: string;
  accumulatedHours: number;
  wageLadder: WageLadder | null | undefined;
  contractedHoursPerWeek?: number;
  showAdminControls?: boolean;
}

export function SeniorityProgressCard({
  employeeId,
  employeeName,
  accumulatedHours,
  wageLadder,
  contractedHoursPerWeek = 37.5,
  showAdminControls = false,
}: SeniorityProgressCardProps) {
  const { isAdminOrManager } = useAuth();
  const { data: seniorityLog = [] } = useSeniorityLog(employeeId);
  const addHours = useAddSeniorityHours();

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustmentHours, setAdjustmentHours] = useState<string>("");
  const [adjustmentNotes, setAdjustmentNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  // Calculate seniority progress
  const seniorityProgress = wageLadder
    ? calculateCurrentLevel(wageLadder, accumulatedHours)
    : null;

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!seniorityProgress || !wageLadder?.levels) return 100;
    
    const currentLevelData = wageLadder.levels.find(l => l.level === seniorityProgress.level);
    if (!currentLevelData) return 100;
    
    const hoursInCurrentLevel = accumulatedHours - currentLevelData.min_hours;
    const hoursNeededForLevel = seniorityProgress.hoursToNextLevel
      ? hoursInCurrentLevel + seniorityProgress.hoursToNextLevel
      : 0;
    
    if (hoursNeededForLevel === 0) return 100;
    return Math.min(100, (hoursInCurrentLevel / hoursNeededForLevel) * 100);
  };

  // Estimate time to next level
  const estimateTimeToNextLevel = () => {
    if (!seniorityProgress?.hoursToNextLevel) return null;
    
    const hoursPerMonth = contractedHoursPerWeek * 4.33; // Average weeks per month
    const monthsToNextLevel = seniorityProgress.hoursToNextLevel / hoursPerMonth;
    
    if (monthsToNextLevel < 1) {
      return `~${Math.ceil(monthsToNextLevel * 4)} uker`;
    } else if (monthsToNextLevel < 12) {
      return `~${Math.ceil(monthsToNextLevel)} måneder`;
    } else {
      const years = Math.floor(monthsToNextLevel / 12);
      const months = Math.ceil(monthsToNextLevel % 12);
      return `~${years} år${months > 0 ? ` ${months} mnd` : ""}`;
    }
  };

  const handleAdjustHours = async () => {
    const hours = parseFloat(adjustmentHours);
    if (isNaN(hours) || hours === 0) return;

    await addHours.mutateAsync({
      employeeId,
      hours,
      source: "manual",
      notes: adjustmentNotes || undefined,
    });

    setShowAdjustModal(false);
    setAdjustmentHours("");
    setAdjustmentNotes("");
  };

  if (!wageLadder) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-6 text-center text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Ingen lønnsstige tilknyttet</p>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = getProgressPercentage();
  const timeEstimate = estimateTimeToNextLevel();
  const totalLevels = wageLadder.levels?.length || 0;

  return (
    <>
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Ansiennitet</span>
            </div>
            {isAdminOrManager() && showAdminControls && (
              <Button variant="outline" size="sm" onClick={() => setShowAdjustModal(true)}>
                <Plus className="h-3 w-3 mr-1" />
                Juster timer
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Level Info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">
                Nivå {seniorityProgress?.level || 1}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  av {totalLevels}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                {wageLadder.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {seniorityProgress?.hourlyRate || 0} kr/t
              </p>
              <p className="text-sm text-muted-foreground">Timelønn</p>
            </div>
          </div>

          {/* Accumulated Hours */}
          <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Akkumulerte timer</p>
              <p className="text-lg font-semibold text-foreground">
                {accumulatedHours.toLocaleString("nb-NO")} timer
              </p>
            </div>
          </div>

          {/* Progress to Next Level */}
          {seniorityProgress?.nextLevel && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Nivå {seniorityProgress.level} → Nivå {seniorityProgress.nextLevel}
                </span>
                <span className="font-medium text-foreground">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <div className="text-sm">
                    <p className="text-muted-foreground">Timer til neste nivå</p>
                    <p className="font-semibold text-foreground">
                      {seniorityProgress.hoursToNextLevel?.toLocaleString("nb-NO")} t
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div className="text-sm">
                    <p className="text-muted-foreground">Neste timelønn</p>
                    <p className="font-semibold text-foreground">
                      {seniorityProgress.nextHourlyRate} kr/t
                      <Badge variant="secondary" className="ml-1 text-xs">
                        +{(seniorityProgress.nextHourlyRate || 0) - seniorityProgress.hourlyRate} kr
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>

              {timeEstimate && (
                <p className="text-sm text-muted-foreground pt-2 border-t border-border/50">
                  ⏱️ Estimert tid til neste nivå: <span className="font-medium">{timeEstimate}</span>
                </p>
              )}
            </div>
          )}

          {/* At max level */}
          {!seniorityProgress?.nextLevel && (
            <div className="p-3 bg-green-500/10 rounded-lg text-center">
              <Badge variant="default" className="bg-green-600">
                🎉 Høyeste nivå oppnådd!
              </Badge>
            </div>
          )}

          {/* History Toggle */}
          <Collapsible open={showHistory} onOpenChange={setShowHistory}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Historikk
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showHistory ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              {seniorityLog.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Ingen historikk ennå
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {seniorityLog.slice(0, 10).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded"
                    >
                      <div>
                        <span className={entry.hours_added >= 0 ? "text-green-600" : "text-destructive"}>
                          {entry.hours_added >= 0 ? "+" : ""}{entry.hours_added.toLocaleString("nb-NO")} t
                        </span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {senioritySourceLabels[entry.source]}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {format(new Date(entry.created_at), "dd.MM.yy HH:mm", { locale: nb })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Adjust Hours Modal */}
      <Dialog open={showAdjustModal} onOpenChange={setShowAdjustModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Juster akkumulerte timer</DialogTitle>
            <DialogDescription>
              Legg til eller trekk fra timer for {employeeName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Antall timer (negativt for å trekke fra)</Label>
              <Input
                type="number"
                value={adjustmentHours}
                onChange={(e) => setAdjustmentHours(e.target.value)}
                placeholder="F.eks. 100 eller -50"
              />
            </div>

            <div className="space-y-2">
              <Label>Begrunnelse</Label>
              <Textarea
                value={adjustmentNotes}
                onChange={(e) => setAdjustmentNotes(e.target.value)}
                placeholder="Beskriv hvorfor timene justeres..."
              />
            </div>

            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="text-muted-foreground">Nåværende timer:</p>
              <p className="font-semibold">{accumulatedHours.toLocaleString("nb-NO")} t</p>
              {adjustmentHours && !isNaN(parseFloat(adjustmentHours)) && (
                <>
                  <p className="text-muted-foreground mt-2">Ny total:</p>
                  <p className="font-semibold">
                    {(accumulatedHours + parseFloat(adjustmentHours)).toLocaleString("nb-NO")} t
                  </p>
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustModal(false)}>
              Avbryt
            </Button>
            <Button
              onClick={handleAdjustHours}
              disabled={!adjustmentHours || isNaN(parseFloat(adjustmentHours)) || addHours.isPending}
            >
              {addHours.isPending ? "Lagrer..." : "Lagre justering"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

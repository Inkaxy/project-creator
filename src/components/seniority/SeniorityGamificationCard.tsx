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
  Calendar,
  Award,
  Zap,
} from "lucide-react";
import { format, addMonths } from "date-fns";
import { nb } from "date-fns/locale";
import { WageLadder, calculateCurrentLevel } from "@/hooks/useWageLadders";
import {
  useSeniorityLog,
  useAddSeniorityHours,
  senioritySourceLabels,
} from "@/hooks/useSeniorityLog";
import { useAuth } from "@/contexts/AuthContext";
import { LadderLevelsTable } from "./LadderLevelsTable";

interface SeniorityGamificationCardProps {
  employeeId: string;
  employeeName: string;
  accumulatedHours: number;
  wageLadder: WageLadder | null | undefined;
  contractedHoursPerWeek?: number;
  showAdminControls?: boolean;
}

export function SeniorityGamificationCard({
  employeeId,
  employeeName,
  accumulatedHours,
  wageLadder,
  contractedHoursPerWeek = 37.5,
  showAdminControls = false,
}: SeniorityGamificationCardProps) {
  const { isAdminOrManager } = useAuth();
  const { data: seniorityLog = [] } = useSeniorityLog(employeeId);
  const addHours = useAddSeniorityHours();

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustmentHours, setAdjustmentHours] = useState<string>("");
  const [adjustmentNotes, setAdjustmentNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showLevelsTable, setShowLevelsTable] = useState(false);

  // Calculate seniority progress
  const seniorityProgress = wageLadder
    ? calculateCurrentLevel(wageLadder, accumulatedHours)
    : null;

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!seniorityProgress || !wageLadder?.levels) return 100;

    const currentLevelData = wageLadder.levels.find(
      (l) => l.level === seniorityProgress.level
    );
    if (!currentLevelData) return 100;

    const hoursInCurrentLevel = accumulatedHours - currentLevelData.min_hours;
    const hoursNeededForLevel = seniorityProgress.hoursToNextLevel
      ? hoursInCurrentLevel + seniorityProgress.hoursToNextLevel
      : 0;

    if (hoursNeededForLevel === 0) return 100;
    return Math.min(100, (hoursInCurrentLevel / hoursNeededForLevel) * 100);
  };

  // Calculate average hours per month based on weekly contracted hours
  const hoursPerMonth = contractedHoursPerWeek * 4.33;

  // Estimate date to next level
  const estimateDateToNextLevel = (): Date | null => {
    if (!seniorityProgress?.hoursToNextLevel || hoursPerMonth <= 0) return null;
    const monthsToNextLevel = seniorityProgress.hoursToNextLevel / hoursPerMonth;
    return addMonths(new Date(), Math.ceil(monthsToNextLevel));
  };

  // Estimate time string
  const estimateTimeToNextLevel = () => {
    if (!seniorityProgress?.hoursToNextLevel) return null;

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

  // Calculate monthly gain from next level
  const calculateMonthlyGain = () => {
    if (!seniorityProgress?.nextHourlyRate) return null;
    const rateIncrease =
      seniorityProgress.nextHourlyRate - seniorityProgress.hourlyRate;
    return Math.round(rateIncrease * hoursPerMonth);
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
        <CardContent className="py-8 text-center text-muted-foreground">
          <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Ingen lønnsstige tilknyttet</p>
          <p className="text-sm mt-1">
            Tilknytt en lønnsstige for å spore ansiennitet
          </p>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = getProgressPercentage();
  const timeEstimate = estimateTimeToNextLevel();
  const estimatedDate = estimateDateToNextLevel();
  const monthlyGain = calculateMonthlyGain();
  const totalLevels = wageLadder.levels?.length || 0;
  const isMaxLevel = !seniorityProgress?.nextLevel;
  const rateIncrease = seniorityProgress?.nextHourlyRate
    ? seniorityProgress.nextHourlyRate - (seniorityProgress?.hourlyRate || 0)
    : 0;

  return (
    <>
      <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/10 border-primary/20 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="text-lg">Din ansiennitet</span>
                <p className="text-sm font-normal text-muted-foreground">
                  {wageLadder.name}
                </p>
              </div>
            </div>
            {isAdminOrManager() && showAdminControls && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdjustModal(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Juster timer
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Main Level Display */}
          <div className="flex items-center justify-between p-4 bg-background/60 rounded-xl border border-border/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-foreground">
                  Nivå {seniorityProgress?.level || 1}
                </span>
                <Badge variant="secondary" className="text-xs">
                  av {totalLevels}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {accumulatedHours.toLocaleString("nb-NO")} timer akkumulert
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <DollarSign className="h-6 w-6 text-primary" />
                <span className="text-3xl font-bold text-primary">
                  {seniorityProgress?.hourlyRate || 0}
                </span>
                <span className="text-lg text-muted-foreground">kr/t</span>
              </div>
              <p className="text-sm text-muted-foreground">Timelønn</p>
            </div>
          </div>

          {/* Progress to Next Level */}
          {!isMaxLevel && seniorityProgress?.hoursToNextLevel && (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    Fremgang til Nivå {seniorityProgress.nextLevel}
                  </span>
                  <span className="font-bold text-primary">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <div className="relative">
                  <Progress
                    value={progressPercentage}
                    className="h-4 bg-muted"
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center text-xs font-medium"
                    style={{ color: progressPercentage > 50 ? "white" : "inherit" }}
                  >
                    {seniorityProgress.hoursToNextLevel.toLocaleString("nb-NO")} t
                    igjen
                  </div>
                </div>
              </div>

              {/* Gamification Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-background/50 rounded-lg border border-border/50 text-center">
                  <Target className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">
                    {seniorityProgress.hoursToNextLevel.toLocaleString("nb-NO")}
                  </p>
                  <p className="text-xs text-muted-foreground">Timer til mål</p>
                </div>

                {estimatedDate && (
                  <div className="p-3 bg-background/50 rounded-lg border border-border/50 text-center">
                    <Calendar className="h-5 w-5 text-secondary-foreground mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">
                      {format(estimatedDate, "MMM yyyy", { locale: nb })}
                    </p>
                    <p className="text-xs text-muted-foreground">Estimert dato</p>
                  </div>
                )}

                {monthlyGain && monthlyGain > 0 && (
                  <div className="p-3 bg-background/50 rounded-lg border border-border/50 text-center">
                    <Zap className="h-5 w-5 text-accent-foreground mx-auto mb-1" />
                    <p className="text-lg font-bold text-primary">
                      +{monthlyGain.toLocaleString("nb-NO")}
                    </p>
                    <p className="text-xs text-muted-foreground">kr/mnd ekstra</p>
                  </div>
                )}
              </div>

              {/* Next Level Info */}
              <div className="flex items-center justify-between p-3 bg-accent/20 rounded-lg border border-accent/30">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Neste nivå: {seniorityProgress.nextHourlyRate} kr/t
                  </span>
                </div>
                <Badge variant="default">
                  +{rateIncrease} kr/t
                </Badge>
              </div>

              {timeEstimate && (
                <p className="text-sm text-center text-muted-foreground">
                  ⏱️ Estimert tid: <span className="font-medium">{timeEstimate}</span>
                  {" basert på "}
                  {contractedHoursPerWeek}t/uke
                </p>
              )}
            </div>
          )}

          {/* Max Level Celebration */}
          {isMaxLevel && (
            <div className="p-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl border border-primary/30 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <Badge variant="default" className="text-sm px-3 py-1">
                Høyeste nivå oppnådd!
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Gratulerer! Du har nådd toppen av lønnsstigen.
              </p>
            </div>
          )}

          {/* Levels Table Toggle */}
          <Collapsible open={showLevelsTable} onOpenChange={setShowLevelsTable}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between hover:bg-muted/50"
              >
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Alle nivåer i {wageLadder.name}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    showLevelsTable ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              {wageLadder.levels && wageLadder.levels.length > 0 && (
                <LadderLevelsTable
                  levels={wageLadder.levels}
                  currentLevel={seniorityProgress?.level || 1}
                  currentHours={accumulatedHours}
                />
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* History Toggle */}
          <Collapsible open={showHistory} onOpenChange={setShowHistory}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between hover:bg-muted/50"
              >
                <span className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Historikk
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    showHistory ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              {seniorityLog.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Ingen historikk ennå
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {seniorityLog.slice(0, 10).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            entry.hours_added >= 0
                              ? "text-primary font-medium"
                              : "text-destructive font-medium"
                          }
                        >
                          {entry.hours_added >= 0 ? "+" : ""}
                          {entry.hours_added.toLocaleString("nb-NO")} t
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {senioritySourceLabels[entry.source]}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {format(new Date(entry.created_at), "dd.MM.yy HH:mm", {
                          locale: nb,
                        })}
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
              <p className="font-semibold">
                {accumulatedHours.toLocaleString("nb-NO")} t
              </p>
              {adjustmentHours && !isNaN(parseFloat(adjustmentHours)) && (
                <>
                  <p className="text-muted-foreground mt-2">Ny total:</p>
                  <p className="font-semibold">
                    {(accumulatedHours + parseFloat(adjustmentHours)).toLocaleString(
                      "nb-NO"
                    )}{" "}
                    t
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
              disabled={
                !adjustmentHours ||
                isNaN(parseFloat(adjustmentHours)) ||
                addHours.isPending
              }
            >
              {addHours.isPending ? "Lagrer..." : "Lagre justering"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Wallet, 
  Percent, 
  Coffee, 
  XCircle,
  TrendingUp,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  DeviationDistribution, 
  useHandleDeviationWithAccount,
  deviationTypeLabels,
} from "@/hooks/useTimesheetApproval";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface DeviationDetail {
  type: string;
  minutes: number;
  label: string;
}

interface DeviationHandlerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeEntryId: string;
  employeeId: string;
  employeeName: string;
  date: string;
  totalDeviationMinutes: number;
  deviations: DeviationDetail[];
  onApprove?: () => void;
}

export function DeviationHandlerModal({
  open,
  onOpenChange,
  timeEntryId,
  employeeId,
  employeeName,
  date,
  totalDeviationMinutes,
  deviations,
  onApprove,
}: DeviationHandlerModalProps) {
  const [distribution, setDistribution] = useState<DeviationDistribution>({
    time_bank_minutes: 0,
    overtime_50_minutes: 0,
    overtime_100_minutes: 0,
    comp_time_minutes: 0,
    ignore_minutes: 0,
  });
  const [notes, setNotes] = useState("");
  const [activeSlider, setActiveSlider] = useState<keyof DeviationDistribution | null>(null);
  
  const handleDeviation = useHandleDeviationWithAccount();

  const isPositiveDeviation = totalDeviationMinutes > 0;
  const absMinutes = Math.abs(totalDeviationMinutes);

  // Reset distribution when modal opens
  useEffect(() => {
    if (open) {
      // Default: all to time bank for positive, all to ignore for negative
      setDistribution({
        time_bank_minutes: isPositiveDeviation ? absMinutes : 0,
        overtime_50_minutes: 0,
        overtime_100_minutes: 0,
        comp_time_minutes: 0,
        ignore_minutes: isPositiveDeviation ? 0 : absMinutes,
      });
      setNotes("");
    }
  }, [open, totalDeviationMinutes, isPositiveDeviation, absMinutes]);

  const totalDistributed = 
    distribution.time_bank_minutes +
    distribution.overtime_50_minutes +
    distribution.overtime_100_minutes +
    distribution.comp_time_minutes +
    distribution.ignore_minutes;

  const remaining = absMinutes - totalDistributed;
  const isFullyDistributed = remaining === 0;

  const handleSliderChange = (key: keyof DeviationDistribution, value: number[]) => {
    const newValue = value[0];
    const currentValue = distribution[key];
    const diff = newValue - currentValue;
    
    // Calculate what's available from other categories
    const availableFromOthers = Object.entries(distribution)
      .filter(([k]) => k !== key)
      .reduce((sum, [, v]) => sum + v, 0);
    
    // If increasing, take from remaining or reduce others proportionally
    if (diff > 0) {
      const canTake = Math.min(diff, remaining + availableFromOthers);
      if (canTake > 0) {
        const newDistribution = { ...distribution };
        newDistribution[key] = currentValue + canTake;
        
        // If taking more than remaining, reduce others
        if (canTake > remaining) {
          const takeFromOthers = canTake - remaining;
          const otherKeys = Object.keys(distribution).filter(k => k !== key) as (keyof DeviationDistribution)[];
          let toTake = takeFromOthers;
          
          for (const otherKey of otherKeys) {
            if (toTake <= 0) break;
            const canTakeFromThis = Math.min(distribution[otherKey], toTake);
            newDistribution[otherKey] -= canTakeFromThis;
            toTake -= canTakeFromThis;
          }
        }
        
        setDistribution(newDistribution);
      }
    } else {
      // If decreasing, just update the value
      setDistribution(prev => ({
        ...prev,
        [key]: newValue,
      }));
    }
  };

  const quickDistribute = (target: keyof DeviationDistribution) => {
    setDistribution({
      time_bank_minutes: 0,
      overtime_50_minutes: 0,
      overtime_100_minutes: 0,
      comp_time_minutes: 0,
      ignore_minutes: 0,
      [target]: absMinutes,
    });
  };

  const handleConfirm = async () => {
    await handleDeviation.mutateAsync({
      timeEntryId,
      employeeId,
      distribution,
      notes: notes || undefined,
    });
    onOpenChange(false);
    onApprove?.();
  };

  const distributionOptions = [
    {
      key: "time_bank_minutes" as const,
      label: "Tidsbank",
      icon: Wallet,
      color: "text-primary",
      bgColor: "bg-primary/10",
      description: "Spar til avspasering senere",
    },
    {
      key: "overtime_50_minutes" as const,
      label: "Overtid 50%",
      icon: Percent,
      color: "text-warning",
      bgColor: "bg-warning/10",
      description: "Utbetales med 50% tillegg",
    },
    {
      key: "overtime_100_minutes" as const,
      label: "Overtid 100%",
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
      description: "Utbetales med 100% tillegg",
    },
    {
      key: "comp_time_minutes" as const,
      label: "Avspasering",
      icon: Coffee,
      color: "text-info",
      bgColor: "bg-info/10",
      description: "Tas ut som fri senere",
    },
    {
      key: "ignore_minutes" as const,
      label: "Ignorer",
      icon: XCircle,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      description: "Ingen kompensasjon",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Håndter avvik
          </DialogTitle>
          <DialogDescription>
            {employeeName} - {format(new Date(date), "EEEE d. MMMM yyyy", { locale: nb })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <Card className={cn(
            "border-2",
            isPositiveDeviation ? "border-success/50 bg-success/5" : "border-destructive/50 bg-destructive/5"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isPositiveDeviation ? (
                    <TrendingUp className="h-8 w-8 text-success" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isPositiveDeviation ? "Ekstratid" : "Manglende tid"}
                    </p>
                    <p className="text-2xl font-bold">
                      {isPositiveDeviation ? "+" : "-"}{absMinutes} minutter
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {(absMinutes / 60).toFixed(1)} timer
                </div>
              </div>

              {/* Deviation details */}
              {deviations.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {deviations.map((dev, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {dev.label}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick distribution buttons */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Hurtigvalg</Label>
            <div className="flex flex-wrap gap-2">
              {distributionOptions.slice(0, isPositiveDeviation ? 4 : 5).map((opt) => (
                <Button
                  key={opt.key}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-2",
                    distribution[opt.key] === absMinutes && opt.bgColor
                  )}
                  onClick={() => quickDistribute(opt.key)}
                >
                  <opt.icon className={cn("h-4 w-4", opt.color)} />
                  Alt til {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Distribution sliders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Fordel tiden</Label>
              <Badge variant={isFullyDistributed ? "default" : "destructive"}>
                {isFullyDistributed ? (
                  <><CheckCircle className="mr-1 h-3 w-3" /> Fullt fordelt</>
                ) : (
                  <>{remaining} min gjenstår</>
                )}
              </Badge>
            </div>

            {/* Progress bar showing distribution */}
            <div className="h-4 rounded-full bg-muted overflow-hidden flex">
              {distributionOptions.map((opt) => {
                const percentage = (distribution[opt.key] / absMinutes) * 100;
                if (percentage === 0) return null;
                return (
                  <div
                    key={opt.key}
                    className={cn("h-full transition-all", opt.bgColor)}
                    style={{ width: `${percentage}%` }}
                  />
                );
              })}
            </div>

            <div className="space-y-6">
              {distributionOptions.map((opt) => (
                <div key={opt.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <opt.icon className={cn("h-4 w-4", opt.color)} />
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {opt.description}
                      </span>
                    </div>
                    <Badge variant="secondary">
                      {distribution[opt.key]} min ({((distribution[opt.key] / 60).toFixed(1))}t)
                    </Badge>
                  </div>
                  <Slider
                    value={[distribution[opt.key]]}
                    max={absMinutes}
                    step={5}
                    onValueChange={(value) => handleSliderChange(opt.key, value)}
                    className={cn(
                      "cursor-pointer",
                      activeSlider === opt.key && "ring-2 ring-offset-2"
                    )}
                    onPointerDown={() => setActiveSlider(opt.key)}
                    onPointerUp={() => setActiveSlider(null)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Kommentar (valgfritt)</Label>
            <Textarea
              id="notes"
              placeholder="Legg til en kommentar til håndteringen..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isFullyDistributed || handleDeviation.isPending}
          >
            {handleDeviation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lagrer...</>
            ) : (
              <><CheckCircle className="mr-2 h-4 w-4" /> Godkjenn og lagre</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

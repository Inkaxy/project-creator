import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Calculator, 
  Clock, 
  DollarSign, 
  Moon, 
  Sun,
  Calendar,
  TrendingUp,
  AlertCircle,
  Check,
} from "lucide-react";
import { useWageLadders, WageLadder, calculateCurrentLevel } from "@/hooks/useWageLadders";
import { useWageSupplements, WageSupplement } from "@/hooks/useWageSupplements";
import { cn } from "@/lib/utils";

interface WorkScheduleEntry {
  week: number;
  day: string;
  start: string;
  end: string;
  breakMinutes: number;
}

interface CalculatorResult {
  hourlyRate: number;
  nightSupplementRate: number;
  totalOrdinaryHours: number;
  totalNightHours: number;
  ordinaryPay: number;
  nightPay: number;
  totalFourWeeks: number;
  fixedMonthlySalary: number;
  fixedMonthlySalaryWithHoliday: number;
  employmentPercentage: number;
  effectiveHourlyRate: number;
  selectedLevel: number;
  adjustedAccumulatedHours: number;
}

interface FixedSalaryCalculatorProps {
  employeeId: string;
  employeeName: string;
  competenceLevel: "ufaglaert" | "faglaert" | "laerling";
  accumulatedHours?: number;
  currentWageLadderId?: string;
  currentSeniorityLevel?: number;
  fullTimeHoursPerWeek?: number;
  nightStart?: string;
  nightEnd?: string;
  onApply?: (result: CalculatorResult) => void;
}

const DAYS = ["Man.", "Tirs.", "Ons.", "Tor.", "Fre.", "Lør.", "Søn."];
const DEFAULT_FULL_TIME_HOURS = 37.5;
const HOLIDAY_PAY_FACTOR = 1.12; // 12% feriepenger

// Parse time string to hours
const timeToHours = (time: string): number => {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return h + m / 60;
};

// Calculate night hours for a shift
const calculateNightHours = (
  start: string,
  end: string,
  nightStart: string,
  nightEnd: string
): number => {
  if (!start || !end) return 0;
  
  const shiftStart = timeToHours(start);
  let shiftEnd = timeToHours(end);
  const nightStartHour = timeToHours(nightStart);
  const nightEndHour = timeToHours(nightEnd);
  
  // Handle overnight shift
  if (shiftEnd <= shiftStart) shiftEnd += 24;
  
  let nightHours = 0;
  
  // Night period crosses midnight (e.g., 21:00 - 06:00)
  if (nightStartHour > nightEndHour) {
    // First part: nightStart to midnight
    const overlapEvening = Math.max(0, 
      Math.min(shiftEnd, 24) - Math.max(shiftStart, nightStartHour)
    );
    // Second part: midnight to nightEnd
    const adjustedStart = shiftStart > 12 ? 0 : shiftStart;
    const adjustedEnd = shiftEnd > 24 ? shiftEnd - 24 : (shiftEnd > 12 ? 0 : shiftEnd);
    const overlapMorning = Math.max(0, 
      Math.min(adjustedEnd, nightEndHour) - Math.max(adjustedStart, 0)
    );
    nightHours = overlapEvening + overlapMorning;
  } else {
    // Regular daytime night period
    nightHours = Math.max(0, 
      Math.min(shiftEnd, nightEndHour) - Math.max(shiftStart, nightStartHour)
    );
  }
  
  return Math.max(0, nightHours);
};

export function FixedSalaryCalculator({
  employeeId,
  employeeName,
  competenceLevel,
  accumulatedHours = 0,
  currentWageLadderId,
  currentSeniorityLevel,
  fullTimeHoursPerWeek = DEFAULT_FULL_TIME_HOURS,
  nightStart = "21:00",
  nightEnd = "06:00",
  onApply,
}: FixedSalaryCalculatorProps) {
  const { data: wageLadders = [] } = useWageLadders();
  const { data: supplements = [] } = useWageSupplements();

  // Selected wage ladder
  const [selectedLadderId, setSelectedLadderId] = useState(currentWageLadderId || "");
  
  // Manual level and hours override
  const [manualLevel, setManualLevel] = useState<number | null>(currentSeniorityLevel || null);
  const [adjustedHours, setAdjustedHours] = useState<string>(String(accumulatedHours));
  // Work schedule (4 weeks)
  const [schedule, setSchedule] = useState<WorkScheduleEntry[]>(() => {
    const entries: WorkScheduleEntry[] = [];
    for (let week = 1; week <= 4; week++) {
      for (const day of DAYS) {
        entries.push({
          week,
          day,
          start: "",
          end: "",
          breakMinutes: 30,
        });
      }
    }
    return entries;
  });

  // Custom night supplement rate (can be overridden)
  const [nightStartCustom, setNightStartCustom] = useState(nightStart);
  const [nightEndCustom, setNightEndCustom] = useState(nightEnd);

  // Get selected wage ladder
  const selectedLadder = useMemo(() => {
    return wageLadders.find(l => l.id === selectedLadderId);
  }, [wageLadders, selectedLadderId]);

  // Get the effective level - either manual selection or calculated from hours
  const effectiveLevel = useMemo(() => {
    if (!selectedLadder?.levels || selectedLadder.levels.length === 0) return null;
    
    const sortedLevels = [...selectedLadder.levels].sort((a, b) => a.level - b.level);
    
    // If manual level is set, use that
    if (manualLevel !== null) {
      const level = sortedLevels.find(l => l.level === manualLevel);
      if (level) {
        return {
          level: level.level,
          hourlyRate: level.hourly_rate,
          minHours: level.min_hours,
          maxHours: level.max_hours,
        };
      }
    }
    
    // Otherwise calculate from adjusted hours
    const hours = parseFloat(adjustedHours) || 0;
    for (let i = sortedLevels.length - 1; i >= 0; i--) {
      if (hours >= sortedLevels[i].min_hours) {
        const level = sortedLevels[i];
        const nextLevel = sortedLevels[i + 1];
        return {
          level: level.level,
          hourlyRate: level.hourly_rate,
          minHours: level.min_hours,
          maxHours: level.max_hours,
          nextLevel: nextLevel?.level || null,
          hoursToNextLevel: nextLevel ? nextLevel.min_hours - hours : null,
        };
      }
    }
    
    // Default to first level
    const firstLevel = sortedLevels[0];
    return {
      level: firstLevel.level,
      hourlyRate: firstLevel.hourly_rate,
      minHours: firstLevel.min_hours,
      maxHours: firstLevel.max_hours,
    };
  }, [selectedLadder, manualLevel, adjustedHours]);

  // When level changes manually, update hours to minimum for that level
  const handleLevelChange = (newLevel: string) => {
    const levelNum = parseInt(newLevel);
    setManualLevel(levelNum);
    
    const level = selectedLadder?.levels?.find(l => l.level === levelNum);
    if (level) {
      setAdjustedHours(String(level.min_hours));
    }
  };
  const nightSupplement = useMemo(() => {
    // Find night supplement matching competence level
    const competenceMatch = supplements.find(s => 
      s.applies_to === "night" && 
      s.name.toLowerCase().includes(competenceLevel === "faglaert" ? "faglært" : "ufaglært")
    );
    // Fallback to any night supplement
    return competenceMatch || supplements.find(s => s.applies_to === "night");
  }, [supplements, competenceLevel]);

  // Calculate results
  const result = useMemo((): CalculatorResult | null => {
    if (!effectiveLevel) return null;

    const hourlyRate = effectiveLevel.hourlyRate;
    const nightSupplementRate = nightSupplement?.amount || 0;
    const nightTimeRate = hourlyRate + nightSupplementRate;

    let totalOrdinaryHours = 0;
    let totalNightHours = 0;

    schedule.forEach(entry => {
      if (!entry.start || !entry.end) return;
      
      const startH = timeToHours(entry.start);
      let endH = timeToHours(entry.end);
      if (endH <= startH) endH += 24;
      
      const grossHours = endH - startH;
      const netHours = grossHours - entry.breakMinutes / 60;
      
      const nightHours = calculateNightHours(
        entry.start, 
        entry.end, 
        nightStartCustom, 
        nightEndCustom
      );
      
      const ordinaryHours = Math.max(0, netHours - nightHours);
      
      totalOrdinaryHours += ordinaryHours;
      totalNightHours += nightHours;
    });

    const ordinaryPay = totalOrdinaryHours * hourlyRate;
    const nightPay = totalNightHours * nightTimeRate;
    const totalFourWeeks = ordinaryPay + nightPay;
    
    // Calculate monthly salary (4 weeks to monthly factor: 4.33)
    const monthlyFactor = 4.33 / 4;
    const fixedMonthlySalary = totalFourWeeks * monthlyFactor;
    const fixedMonthlySalaryWithHoliday = fixedMonthlySalary * HOLIDAY_PAY_FACTOR;

    // Employment percentage
    const avgHoursPerWeek = (totalOrdinaryHours + totalNightHours) / 4;
    const employmentPercentage = (avgHoursPerWeek / fullTimeHoursPerWeek) * 100;

    // Effective hourly rate (what the monthly salary translates to per hour)
    const monthlyHours = avgHoursPerWeek * 4.33;
    const effectiveHourlyRate = monthlyHours > 0 ? fixedMonthlySalary / monthlyHours : 0;

    return {
      hourlyRate,
      nightSupplementRate,
      totalOrdinaryHours,
      totalNightHours,
      ordinaryPay,
      nightPay,
      totalFourWeeks,
      fixedMonthlySalary,
      fixedMonthlySalaryWithHoliday,
      employmentPercentage,
      effectiveHourlyRate,
      selectedLevel: effectiveLevel.level,
      adjustedAccumulatedHours: parseFloat(adjustedHours) || 0,
    };
  }, [effectiveLevel, schedule, nightSupplement, nightStartCustom, nightEndCustom, fullTimeHoursPerWeek, adjustedHours]);

  // Update schedule entry
  const updateScheduleEntry = (week: number, day: string, field: keyof WorkScheduleEntry, value: string | number) => {
    setSchedule(prev => prev.map(entry => {
      if (entry.week === week && entry.day === day) {
        return { ...entry, [field]: value };
      }
      return entry;
    }));
  };

  // Copy week to other weeks
  const copyWeekToAll = (sourceWeek: number) => {
    const sourceEntries = schedule.filter(e => e.week === sourceWeek);
    setSchedule(prev => prev.map(entry => {
      if (entry.week === sourceWeek) return entry;
      const source = sourceEntries.find(s => s.day === entry.day);
      if (source) {
        return { ...entry, start: source.start, end: source.end, breakMinutes: source.breakMinutes };
      }
      return entry;
    }));
  };

  // Get week summary
  const getWeekSummary = (weekNum: number) => {
    const weekEntries = schedule.filter(e => e.week === weekNum && e.start && e.end);
    let hours = 0;
    let nightHours = 0;
    
    weekEntries.forEach(entry => {
      const startH = timeToHours(entry.start);
      let endH = timeToHours(entry.end);
      if (endH <= startH) endH += 24;
      const netHours = (endH - startH) - entry.breakMinutes / 60;
      const night = calculateNightHours(entry.start, entry.end, nightStartCustom, nightEndCustom);
      hours += netHours;
      nightHours += night;
    });
    
    return { hours: hours.toFixed(1), nightHours: nightHours.toFixed(1) };
  };

  const getCompetenceLabel = (level: string) => {
    const labels: Record<string, string> = {
      ufaglaert: "Ufaglært",
      faglaert: "Faglært",
      laerling: "Lærling",
    };
    return labels[level] || level;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Fastlønn-kalkulator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Beregn fastlønn basert på arbeidstidsplan og lønnsstige. Timelønn og tillegg hentes automatisk.
          </p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Settings */}
        <div className="space-y-4">
          {/* Wage Ladder Selection */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Lønnsstige
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Velg lønnsstige</Label>
                <Select value={selectedLadderId} onValueChange={setSelectedLadderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg lønnsstige" />
                  </SelectTrigger>
                  <SelectContent>
                    {wageLadders.map((ladder) => (
                      <SelectItem key={ladder.id} value={ladder.id}>
                        {ladder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Level Selection */}
              {selectedLadder && selectedLadder.levels && selectedLadder.levels.length > 0 && (
                <div className="space-y-2">
                  <Label>Velg nivå</Label>
                  <Select 
                    value={effectiveLevel?.level?.toString() || ""} 
                    onValueChange={handleLevelChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg nivå" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...selectedLadder.levels]
                        .sort((a, b) => a.level - b.level)
                        .map((level) => (
                          <SelectItem key={level.id} value={level.level.toString()}>
                            Nivå {level.level} - {level.hourly_rate.toFixed(2)} kr/t ({level.min_hours.toLocaleString("nb-NO")}+ timer)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Accumulated Hours */}
              {selectedLadder && (
                <div className="space-y-2">
                  <Label>Akkumulerte timer på nivå</Label>
                  <Input 
                    type="number"
                    value={adjustedHours}
                    onChange={(e) => {
                      setAdjustedHours(e.target.value);
                      setManualLevel(null); // Reset manual level so it recalculates
                    }}
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground">
                    Timer opparbeidet på dette nivået
                  </p>
                </div>
              )}

              {selectedLadder && effectiveLevel && (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valgt nivå:</span>
                    <Badge variant="outline">Nivå {effectiveLevel.level}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Timer på nivå:</span>
                    <span className="font-medium">{parseFloat(adjustedHours).toLocaleString("nb-NO")} t</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timelønn:</span>
                    <span className="font-bold text-lg text-primary">
                      {effectiveLevel.hourlyRate.toFixed(2)} kr
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Night Settings */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Moon className="h-4 w-4" />
                Natt-innstillinger
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Natt starter kl:</Label>
                  <Input 
                    type="time" 
                    value={nightStartCustom} 
                    onChange={(e) => setNightStartCustom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Natt slutter kl:</Label>
                  <Input 
                    type="time" 
                    value={nightEndCustom} 
                    onChange={(e) => setNightEndCustom(e.target.value)}
                  />
                </div>
              </div>

              {nightSupplement && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Natt-tillegg ({getCompetenceLabel(competenceLevel)}):</span>
                    <span className="font-bold text-primary">
                      {nightSupplement.amount.toFixed(2)} kr/t
                    </span>
                  </div>
                </div>
              )}

              {!nightSupplement && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Ingen natt-tillegg funnet</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent rounded" />
                <span>Inputfelt - kan endres</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-secondary rounded" />
                <span>Beregnet - auto-oppdatert</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded" />
                <span>Nøkkeltall - viktige verdier</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle: Work Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Arbeidstidsplan (4 uker)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[1, 2, 3, 4].map(weekNum => {
                  const summary = getWeekSummary(weekNum);
                  return (
                    <div key={weekNum} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Uke {weekNum}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {summary.hours}t ({summary.nightHours}t natt)
                          </span>
                          {weekNum === 1 && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => copyWeekToAll(1)}
                            >
                              Kopier til alle
                            </Button>
                          )}
                        </div>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-20">Dag</TableHead>
                            <TableHead>Start</TableHead>
                            <TableHead>Slutt</TableHead>
                            <TableHead className="w-20">Pause</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {DAYS.map(day => {
                            const entry = schedule.find(e => e.week === weekNum && e.day === day);
                            if (!entry) return null;
                            return (
                              <TableRow key={`${weekNum}-${day}`}>
                                <TableCell className="font-medium">{day}</TableCell>
                                <TableCell>
                                  <Input
                                    type="time"
                                    value={entry.start}
                                    onChange={(e) => updateScheduleEntry(weekNum, day, "start", e.target.value)}
                                    className="w-24"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="time"
                                    value={entry.end}
                                    onChange={(e) => updateScheduleEntry(weekNum, day, "end", e.target.value)}
                                    className="w-24"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={entry.breakMinutes}
                                    onChange={(e) => updateScheduleEntry(weekNum, day, "breakMinutes", parseInt(e.target.value) || 0)}
                                    className="w-16"
                                    min={0}
                                    step={5}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results */}
      {result && result.totalOrdinaryHours + result.totalNightHours > 0 && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Resultat og lønnsberegning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Summary */}
              <div className="space-y-3">
                <h4 className="font-medium text-muted-foreground">Oppsummering (4 uker)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Ordinære timer:</span>
                    <span className="font-medium">{result.totalOrdinaryHours.toFixed(1)} t</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Natt-timer:</span>
                    <span className="font-medium">{result.totalNightHours.toFixed(1)} t</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span>Gj.snitt timer/uke:</span>
                    <span className="font-medium">
                      {((result.totalOrdinaryHours + result.totalNightHours) / 4).toFixed(1)} t
                    </span>
                  </div>
                </div>
              </div>

              {/* Pay Breakdown */}
              <div className="space-y-3">
                <h4 className="font-medium text-muted-foreground">Lønnsberegning (4 uker)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Ord. timer × {result.hourlyRate.toFixed(2)} kr:</span>
                    <span className="font-medium">{result.ordinaryPay.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kr</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Natt × {(result.hourlyRate + result.nightSupplementRate).toFixed(2)} kr:</span>
                    <span className="font-medium">{result.nightPay.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kr</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Sum (4 uker):</span>
                    <span>{result.totalFourWeeks.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kr</span>
                  </div>
                </div>
              </div>

              {/* Monthly Salary */}
              <div className="space-y-3">
                <h4 className="font-medium text-muted-foreground">Fastlønn (månedlig)</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Uten feriepenger:</p>
                    <p className="text-xl font-bold text-primary">
                      {result.fixedMonthlySalary.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kr
                    </p>
                  </div>
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Inkl. feriepenger (12%):</p>
                    <p className="text-xl font-bold text-secondary-foreground">
                      {result.fixedMonthlySalaryWithHoliday.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kr
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="space-y-3">
                <h4 className="font-medium text-muted-foreground">Nøkkeltall</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Stillingsprosent:</p>
                    <p className="text-lg font-bold">
                      {result.employmentPercentage.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Effektiv timelønn:</p>
                    <p className="text-lg font-bold">
                      {result.effectiveHourlyRate.toFixed(2)} kr/t
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Natt-tillegg verdi:</p>
                    <p className="text-lg font-bold">
                      {(result.nightPay - (result.totalNightHours * result.hourlyRate)).toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kr/mnd
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            {onApply && (
              <div className="mt-6 flex justify-end">
                <Button onClick={() => onApply(result)} className="gap-2">
                  <Check className="h-4 w-4" />
                  Bruk denne fastlønnen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

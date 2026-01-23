import { useState, useMemo, useEffect, useCallback } from "react";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Copy,
  GripVertical,
  X,
} from "lucide-react";
import { useWageLadders, WageLadder, calculateCurrentLevel } from "@/hooks/useWageLadders";
import { useWageSupplements, WageSupplement } from "@/hooks/useWageSupplements";
import { cn } from "@/lib/utils";

// Unique identifier for a day entry
interface DayIdentifier {
  week: number;
  day: string;
}

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

  // Copy mode state - innovative click-to-copy system
  const [copySource, setCopySource] = useState<DayIdentifier | null>(null);
  const [copyTargets, setCopyTargets] = useState<DayIdentifier[]>([]);

  // Check if a day has time data
  const hasTimeData = useCallback((week: number, day: string) => {
    const entry = schedule.find(e => e.week === week && e.day === day);
    return entry && entry.start && entry.end;
  }, [schedule]);

  // Get time data for display
  const getTimeDisplay = useCallback((week: number, day: string) => {
    const entry = schedule.find(e => e.week === week && e.day === day);
    if (!entry?.start || !entry?.end) return null;
    return `${entry.start}-${entry.end}`;
  }, [schedule]);

  // Handle clicking on a day row for copy mode
  const handleDayClick = useCallback((week: number, day: string, e: React.MouseEvent) => {
    // Don't trigger if clicking on inputs
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    
    const clickedDay: DayIdentifier = { week, day };
    
    // If no source selected, and this day has data, set as source
    if (!copySource) {
      if (hasTimeData(week, day)) {
        setCopySource(clickedDay);
        setCopyTargets([]);
      }
      return;
    }
    
    // If clicking on source again, cancel copy mode
    if (copySource.week === week && copySource.day === day) {
      setCopySource(null);
      setCopyTargets([]);
      return;
    }
    
    // Toggle target selection
    const isTarget = copyTargets.some(t => t.week === week && t.day === day);
    if (isTarget) {
      setCopyTargets(prev => prev.filter(t => !(t.week === week && t.day === day)));
    } else {
      setCopyTargets(prev => [...prev, clickedDay]);
    }
  }, [copySource, copyTargets, hasTimeData]);

  // Execute copy operation
  const executeCopy = useCallback(() => {
    if (!copySource || copyTargets.length === 0) return;
    
    const sourceEntry = schedule.find(e => e.week === copySource.week && e.day === copySource.day);
    if (!sourceEntry) return;
    
    setSchedule(prev => prev.map(entry => {
      const isTarget = copyTargets.some(t => t.week === entry.week && t.day === entry.day);
      if (isTarget) {
        return {
          ...entry,
          start: sourceEntry.start,
          end: sourceEntry.end,
          breakMinutes: sourceEntry.breakMinutes,
        };
      }
      return entry;
    }));
    
    // Reset copy mode
    setCopySource(null);
    setCopyTargets([]);
  }, [copySource, copyTargets, schedule]);

  // Cancel copy mode
  const cancelCopyMode = useCallback(() => {
    setCopySource(null);
    setCopyTargets([]);
  }, []);

  // Select all same weekdays as target (smart copy)
  const selectSameWeekdays = useCallback(() => {
    if (!copySource) return;
    
    const targets: DayIdentifier[] = [];
    for (let week = 1; week <= 4; week++) {
      if (week !== copySource.week) {
        targets.push({ week, day: copySource.day });
      }
    }
    setCopyTargets(targets);
  }, [copySource]);

  // Select entire week as target
  const selectEntireWeek = useCallback((weekNum: number) => {
    if (!copySource) return;
    
    const targets: DayIdentifier[] = [];
    DAYS.forEach(day => {
      if (!(weekNum === copySource.week && day === copySource.day)) {
        targets.push({ week: weekNum, day });
      }
    });
    setCopyTargets(prev => {
      // Toggle - if all days in week are selected, deselect them
      const weekDays = targets.filter(t => t.week === weekNum);
      const allSelected = weekDays.every(wd => 
        prev.some(p => p.week === wd.week && p.day === wd.day)
      );
      if (allSelected) {
        return prev.filter(p => p.week !== weekNum);
      }
      // Add all week days
      const filtered = prev.filter(p => p.week !== weekNum);
      return [...filtered, ...weekDays];
    });
  }, [copySource]);

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

  // Calculate day breakdown
  const getDayBreakdown = (entry: WorkScheduleEntry) => {
    if (!entry.start || !entry.end) {
      return { nightHours: 0, ordHours: 0, pause: 0, netOrd: 0, totalHours: 0 };
    }
    
    const startH = timeToHours(entry.start);
    let endH = timeToHours(entry.end);
    if (endH <= startH) endH += 24;
    
    const grossHours = endH - startH;
    const pauseHours = entry.breakMinutes / 60;
    const nightHours = calculateNightHours(entry.start, entry.end, nightStartCustom, nightEndCustom);
    const ordHours = grossHours; // Total hours before deductions
    const netOrd = Math.max(0, grossHours - pauseHours - nightHours);
    const totalHours = grossHours - pauseHours;
    
    return { nightHours, ordHours, pause: pauseHours, netOrd, totalHours };
  };

  // Get week summary
  const getWeekSummary = (weekNum: number) => {
    const weekEntries = schedule.filter(e => e.week === weekNum);
    let nightHours = 0;
    let ordHours = 0;
    let pause = 0;
    let netOrd = 0;
    let totalHours = 0;
    
    weekEntries.forEach(entry => {
      const breakdown = getDayBreakdown(entry);
      nightHours += breakdown.nightHours;
      ordHours += breakdown.ordHours;
      pause += breakdown.pause;
      netOrd += breakdown.netOrd;
      totalHours += breakdown.totalHours;
    });
    
    return { nightHours, ordHours, pause, netOrd, totalHours };
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
          {/* Copy Mode Toolbar */}
          {copySource && (
            <Card className="border-primary bg-primary/5 animate-in slide-in-from-top-2">
              <CardContent className="py-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Badge variant="default" className="gap-1">
                      <Copy className="h-3 w-3" />
                      Kopier-modus
                    </Badge>
                    <span className="text-sm">
                      Kilde: <strong>Uke {copySource.week}, {copySource.day}</strong>
                      <span className="text-muted-foreground ml-1">
                        ({getTimeDisplay(copySource.week, copySource.day)})
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={selectSameWeekdays}
                        >
                          Samme ukedag
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Velg alle {copySource.day} i andre uker
                      </TooltipContent>
                    </Tooltip>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={executeCopy}
                      disabled={copyTargets.length === 0}
                      className="gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Kopier til {copyTargets.length} {copyTargets.length === 1 ? 'dag' : 'dager'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={cancelCopyMode}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Klikk på dager for å velge mål. Klikk på ukeoverskrift for å velge hele uken.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Arbeidstidsplan (4 uker)
                </CardTitle>
                {!copySource && (
                  <p className="text-xs text-muted-foreground">
                    Klikk på en rad med tider for å kopiere
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                {[1, 2, 3, 4].map(weekNum => {
                  const summary = getWeekSummary(weekNum);
                  const isSourceWeek = copySource?.week === weekNum;
                  return (
                    <div key={weekNum} className="space-y-2">
                      <div 
                        className={cn(
                          "flex items-center justify-between p-2 -mx-2 rounded-md transition-colors",
                          copySource && !isSourceWeek && "hover:bg-primary/10 cursor-pointer"
                        )}
                        onClick={() => copySource && !isSourceWeek && selectEntireWeek(weekNum)}
                      >
                        <h4 className="font-medium flex items-center gap-2">
                          Uke {weekNum}
                          {copySource && !isSourceWeek && (
                            <span className="text-xs text-muted-foreground">(klikk for hele uken)</span>
                          )}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {summary.totalHours.toFixed(1)}t ({summary.nightHours.toFixed(1)}t natt)
                          </span>
                          {weekNum === 1 && !copySource && (
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
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-8"></TableHead>
                              <TableHead className="w-16">Dag</TableHead>
                              <TableHead className="w-24">Start</TableHead>
                              <TableHead className="w-24">Slutt</TableHead>
                              <TableHead className="w-20 text-right">Natt-t</TableHead>
                              <TableHead className="w-20 text-right">Ord. t</TableHead>
                              <TableHead className="w-16 text-center">Pause</TableHead>
                              <TableHead className="w-20 text-right">Nto. ord</TableHead>
                              <TableHead className="w-20 text-right">Tot. t</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {DAYS.map(day => {
                              const entry = schedule.find(e => e.week === weekNum && e.day === day);
                              if (!entry) return null;
                              const breakdown = getDayBreakdown(entry);
                              const hasData = entry.start && entry.end;
                              
                              // Copy mode states
                              const isSource = copySource?.week === weekNum && copySource?.day === day;
                              const isTarget = copyTargets.some(t => t.week === weekNum && t.day === day);
                              const canBeSource = hasData && !copySource;
                              const canBeTarget = copySource && !isSource;
                              
                              return (
                                <TableRow 
                                  key={`${weekNum}-${day}`}
                                  className={cn(
                                    "transition-colors",
                                    isSource && "bg-primary/20 border-l-4 border-l-primary",
                                    isTarget && "bg-accent border-l-4 border-l-accent-foreground",
                                    canBeSource && "hover:bg-muted cursor-pointer",
                                    canBeTarget && "hover:bg-accent/50 cursor-pointer"
                                  )}
                                  onClick={(e) => handleDayClick(weekNum, day, e)}
                                >
                                  <TableCell className="p-1 w-8">
                                    {isSource && (
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                                            <Copy className="h-3 w-3 text-primary-foreground" />
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Kilde</TooltipContent>
                                      </Tooltip>
                                    )}
                                    {isTarget && (
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <div className="w-6 h-6 bg-accent-foreground rounded flex items-center justify-center">
                                            <Check className="h-3 w-3 text-accent" />
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Mål</TooltipContent>
                                      </Tooltip>
                                    )}
                                    {canBeSource && !copySource && hasData && (
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <div className="w-6 h-6 hover:bg-muted-foreground/20 rounded flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity">
                                            <GripVertical className="h-3 w-3" />
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Klikk for å kopiere</TooltipContent>
                                      </Tooltip>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-medium text-primary">{day}</TableCell>
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
                                  <TableCell className="text-right tabular-nums">
                                    <span className={hasData && breakdown.nightHours > 0 ? "font-medium text-primary" : "text-muted-foreground"}>
                                      {hasData ? breakdown.nightHours.toFixed(2) : "0,00"}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    <span className={hasData ? "font-medium" : "text-muted-foreground"}>
                                      {hasData ? breakdown.ordHours.toFixed(2) : "0,00"}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Input
                                      type="number"
                                      value={entry.breakMinutes / 60}
                                      onChange={(e) => updateScheduleEntry(weekNum, day, "breakMinutes", (parseFloat(e.target.value) || 0) * 60)}
                                      className="w-16 text-center"
                                      min={0}
                                      step={0.5}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    <span className={hasData ? "font-medium" : "text-muted-foreground"}>
                                      {hasData ? breakdown.netOrd.toFixed(2) : "0,00"}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    <span className={hasData ? "font-bold" : "text-muted-foreground"}>
                                      {hasData ? breakdown.totalHours.toFixed(2) : "0,00"}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            {/* SUM row */}
                            <TableRow className="bg-muted/50 font-semibold">
                              <TableCell></TableCell>
                              <TableCell colSpan={3} className="text-right">SUM</TableCell>
                              <TableCell className="text-right tabular-nums text-primary">
                                {summary.nightHours.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {summary.ordHours.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center tabular-nums">
                                {summary.pause.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {summary.netOrd.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-primary">
                                {summary.totalHours.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
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

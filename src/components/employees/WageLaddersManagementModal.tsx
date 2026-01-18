import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  Loader2,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { format, isBefore, startOfDay } from "date-fns";
import { nb } from "date-fns/locale";
import {
  useWageLadders,
  useCreateWageLadder,
  useUpdateWageLadder,
  useDeleteWageLadder,
  useCreateWageLadderLevel,
  useUpdateWageLadderLevel,
  useDeleteWageLadderLevel,
  WageLadder,
  WageLadderLevel,
} from "@/hooks/useWageLadders";
import {
  useCreateWageLadderHistory,
  useCreateWageAdjustments,
  calculateBackPayForLadder,
  BackPayCalculation,
} from "@/hooks/useWageAdjustments";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface WageLaddersManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COMPETENCE_OPTIONS = [
  { value: "ufaglaert", label: "Ufaglært" },
  { value: "faglaert", label: "Faglært" },
  { value: "laerling", label: "Lærling" },
];

interface LadderFormState {
  name: string;
  description: string;
  competence_level: "ufaglaert" | "faglaert" | "laerling";
}

interface LevelFormState {
  level: number;
  min_hours: number;
  max_hours: number | null;
  hourly_rate: number;
  effective_from: Date;
}

export function WageLaddersManagementModal({
  open,
  onOpenChange,
}: WageLaddersManagementModalProps) {
  const { data: wageLadders, isLoading } = useWageLadders();
  const createLadder = useCreateWageLadder();
  const updateLadder = useUpdateWageLadder();
  const deleteLadder = useDeleteWageLadder();
  const createLevel = useCreateWageLadderLevel();
  const updateLevel = useUpdateWageLadderLevel();
  const deleteLevel = useDeleteWageLadderLevel();
  const createHistory = useCreateWageLadderHistory();
  const createAdjustments = useCreateWageAdjustments();

  // UI state
  const [view, setView] = useState<"list" | "ladder-form" | "level-form">("list");
  const [editingLadder, setEditingLadder] = useState<WageLadder | null>(null);
  const [editingLevel, setEditingLevel] = useState<WageLadderLevel | null>(null);
  const [selectedLadderId, setSelectedLadderId] = useState<string | null>(null);

  // Form state
  const [ladderForm, setLadderForm] = useState<LadderFormState>({
    name: "",
    description: "",
    competence_level: "ufaglaert",
  });
  const [levelForm, setLevelForm] = useState<LevelFormState>({
    level: 1,
    min_hours: 0,
    max_hours: null,
    hourly_rate: 0,
    effective_from: new Date(),
  });

  // Back pay preview state
  const [backPayCalculations, setBackPayCalculations] = useState<BackPayCalculation[]>([]);
  const [isCalculatingBackPay, setIsCalculatingBackPay] = useState(false);
  const [showBackPayPreview, setShowBackPayPreview] = useState(false);

  // Reset forms when view changes
  useEffect(() => {
    if (view === "list") {
      setEditingLadder(null);
      setEditingLevel(null);
      setBackPayCalculations([]);
      setShowBackPayPreview(false);
    }
  }, [view]);

  const handleCreateLadder = () => {
    setEditingLadder(null);
    setLadderForm({
      name: "",
      description: "",
      competence_level: "ufaglaert",
    });
    setView("ladder-form");
  };

  const handleEditLadder = (ladder: WageLadder) => {
    setEditingLadder(ladder);
    setLadderForm({
      name: ladder.name,
      description: ladder.description || "",
      competence_level: ladder.competence_level as "ufaglaert" | "faglaert" | "laerling",
    });
    setView("ladder-form");
  };

  const handleDeleteLadder = async (ladderId: string) => {
    if (!confirm("Er du sikker på at du vil slette denne lønnsstigen?")) return;
    await deleteLadder.mutateAsync(ladderId);
  };

  const handleSaveLadder = async () => {
    if (!ladderForm.name.trim()) {
      toast.error("Navn er påkrevd");
      return;
    }

    try {
      if (editingLadder) {
        await updateLadder.mutateAsync({
          id: editingLadder.id,
          name: ladderForm.name,
          description: ladderForm.description || null,
          competence_level: ladderForm.competence_level,
        });
      } else {
        await createLadder.mutateAsync({
          name: ladderForm.name,
          description: ladderForm.description || null,
          competence_level: ladderForm.competence_level,
        });
      }
      setView("list");
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleAddLevel = (ladder: WageLadder) => {
    setSelectedLadderId(ladder.id);
    setEditingLevel(null);

    // Auto-suggest next level values
    const levels = ladder.levels || [];
    const nextLevelNum = levels.length > 0 ? Math.max(...levels.map(l => l.level)) + 1 : 1;
    const lastLevel = levels.find(l => l.level === nextLevelNum - 1);
    const suggestedMinHours = lastLevel?.max_hours || 0;

    setLevelForm({
      level: nextLevelNum,
      min_hours: suggestedMinHours,
      max_hours: null,
      hourly_rate: lastLevel ? lastLevel.hourly_rate + 10 : 200,
      effective_from: new Date(),
    });
    setBackPayCalculations([]);
    setShowBackPayPreview(false);
    setView("level-form");
  };

  const handleEditLevel = (ladder: WageLadder, level: WageLadderLevel) => {
    setSelectedLadderId(ladder.id);
    setEditingLevel(level);
    setLevelForm({
      level: level.level,
      min_hours: level.min_hours,
      max_hours: level.max_hours,
      hourly_rate: level.hourly_rate,
      effective_from: level.effective_from ? new Date(level.effective_from) : new Date(),
    });
    setBackPayCalculations([]);
    setShowBackPayPreview(false);
    setView("level-form");
  };

  const handleDeleteLevel = async (levelId: string) => {
    if (!confirm("Er du sikker på at du vil slette dette nivået?")) return;
    await deleteLevel.mutateAsync(levelId);
  };

  // Calculate back pay when editing and rate changes
  const handleCalculateBackPay = async () => {
    if (!selectedLadderId || !editingLevel) return;

    const effectiveDate = startOfDay(levelForm.effective_from);
    const today = startOfDay(new Date());

    // Only calculate if date is in the past and rate changed
    if (!isBefore(effectiveDate, today)) {
      setBackPayCalculations([]);
      setShowBackPayPreview(false);
      return;
    }

    if (levelForm.hourly_rate === editingLevel.hourly_rate) {
      setBackPayCalculations([]);
      setShowBackPayPreview(false);
      return;
    }

    setIsCalculatingBackPay(true);
    try {
      const calculations = await calculateBackPayForLadder(
        selectedLadderId,
        levelForm.level,
        editingLevel.hourly_rate,
        levelForm.hourly_rate,
        effectiveDate
      );
      setBackPayCalculations(calculations);
      setShowBackPayPreview(calculations.length > 0);
    } catch (error) {
      console.error("Error calculating back pay:", error);
      toast.error("Kunne ikke beregne etterbetaling");
    } finally {
      setIsCalculatingBackPay(false);
    }
  };

  const handleSaveLevel = async () => {
    if (levelForm.hourly_rate <= 0) {
      toast.error("Timelønn må være større enn 0");
      return;
    }

    if (!selectedLadderId) return;

    try {
      const effectiveFromStr = format(levelForm.effective_from, "yyyy-MM-dd");

      if (editingLevel) {
        // Check if we need to create back pay
        const hasBackPay = backPayCalculations.length > 0;
        const rateChanged = levelForm.hourly_rate !== editingLevel.hourly_rate;

        if (rateChanged && hasBackPay) {
          // Create history entry
          const history = await createHistory.mutateAsync({
            ladder_id: selectedLadderId,
            level: levelForm.level,
            old_hourly_rate: editingLevel.hourly_rate,
            new_hourly_rate: levelForm.hourly_rate,
            effective_from: effectiveFromStr,
          });

          // Create wage adjustments for affected employees
          const adjustments = backPayCalculations.map(calc => ({
            employee_id: calc.employeeId,
            period_start: effectiveFromStr,
            period_end: format(new Date(), "yyyy-MM-dd"),
            total_hours: calc.totalHours,
            old_rate: calc.oldRate,
            new_rate: calc.newRate,
            difference_per_hour: calc.differencePerHour,
            total_adjustment: calc.totalAdjustment,
            ladder_history_id: history.id,
          }));

          await createAdjustments.mutateAsync(adjustments);
        }

        // Update the level
        await updateLevel.mutateAsync({
          id: editingLevel.id,
          level: levelForm.level,
          min_hours: levelForm.min_hours,
          max_hours: levelForm.max_hours,
          hourly_rate: levelForm.hourly_rate,
          effective_from: effectiveFromStr,
        });
      } else {
        // Create new level
        await createLevel.mutateAsync({
          ladder_id: selectedLadderId,
          level: levelForm.level,
          min_hours: levelForm.min_hours,
          max_hours: levelForm.max_hours,
          hourly_rate: levelForm.hourly_rate,
          effective_from: effectiveFromStr,
        });
      }
      setView("list");
    } catch (error) {
      // Error handled in hooks
    }
  };

  const getCompetenceLabel = (value: string) => {
    return COMPETENCE_OPTIONS.find(o => o.value === value)?.label || value;
  };

  const formatHours = (hours: number | null) => {
    if (hours === null) return "∞";
    return hours.toLocaleString("nb-NO");
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("nb-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " kr";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {view === "list" && "Lønnsstiger"}
            {view === "ladder-form" && (editingLadder ? "Rediger lønnsstige" : "Ny lønnsstige")}
            {view === "level-form" && (editingLevel ? "Rediger nivå" : "Legg til nivå")}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {/* List View */}
          {view === "list" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {wageLadders?.length || 0} lønnsstige{wageLadders?.length !== 1 ? "r" : ""}
                </p>
                <Button onClick={handleCreateLadder} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ny lønnsstige
                </Button>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : wageLadders?.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Ingen lønnsstiger opprettet ennå.
                  </CardContent>
                </Card>
              ) : (
                <Accordion type="single" collapsible className="space-y-2">
                  {wageLadders?.map((ladder) => (
                    <AccordionItem
                      key={ladder.id}
                      value={ladder.id}
                      className="border rounded-lg px-4"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="font-medium">{ladder.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {getCompetenceLabel(ladder.competence_level)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {ladder.levels?.length || 0} nivå{(ladder.levels?.length || 0) !== 1 ? "er" : ""}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          {ladder.description && (
                            <p className="text-sm text-muted-foreground">
                              {ladder.description}
                            </p>
                          )}

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditLadder(ladder)}
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Rediger
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteLadder(ladder.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Slett
                            </Button>
                          </div>

                          <Separator />

                          {/* Levels Table */}
                          <div className="space-y-2">
                            <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground px-2">
                              <span>Nivå</span>
                              <span>Timer fra</span>
                              <span>Timer til</span>
                              <span>Timelønn</span>
                              <span>Gjelder fra</span>
                            </div>

                            {ladder.levels?.sort((a, b) => a.level - b.level).map((level) => (
                              <div
                                key={level.id}
                                className="grid grid-cols-5 gap-2 items-center text-sm bg-muted/50 rounded-md px-2 py-2 group"
                              >
                                <span className="font-medium">{level.level}</span>
                                <span>{formatHours(level.min_hours)}</span>
                                <span>{formatHours(level.max_hours)}</span>
                                <span className="font-medium">{formatCurrency(level.hourly_rate)}</span>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {level.effective_from 
                                      ? format(new Date(level.effective_from), "dd.MM.yyyy")
                                      : "-"}
                                  </span>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => handleEditLevel(ladder, level)}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteLevel(level.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}

                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-2"
                              onClick={() => handleAddLevel(ladder)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Legg til nivå
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          )}

          {/* Ladder Form */}
          {view === "ladder-form" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ladder-name">Navn *</Label>
                  <Input
                    id="ladder-name"
                    value={ladderForm.name}
                    onChange={(e) => setLadderForm({ ...ladderForm, name: e.target.value })}
                    placeholder="F.eks. Faglært Baker"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="competence">Kompetansenivå *</Label>
                  <Select
                    value={ladderForm.competence_level}
                    onValueChange={(value) => setLadderForm({ ...ladderForm, competence_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPETENCE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
                <Textarea
                  id="description"
                  value={ladderForm.description}
                  onChange={(e) => setLadderForm({ ...ladderForm, description: e.target.value })}
                  placeholder="Kort beskrivelse av lønnsstigen"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setView("list")}>
                  Avbryt
                </Button>
                <Button
                  onClick={handleSaveLadder}
                  disabled={createLadder.isPending || updateLadder.isPending}
                >
                  {(createLadder.isPending || updateLadder.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingLadder ? "Lagre endringer" : "Opprett stige"}
                </Button>
              </div>
            </div>
          )}

          {/* Level Form */}
          {view === "level-form" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level-num">Nivå</Label>
                  <Input
                    id="level-num"
                    type="number"
                    value={levelForm.level}
                    onChange={(e) => setLevelForm({ ...levelForm, level: parseInt(e.target.value) || 1 })}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-hours">Timer fra</Label>
                  <Input
                    id="min-hours"
                    type="number"
                    value={levelForm.min_hours}
                    onChange={(e) => setLevelForm({ ...levelForm, min_hours: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-hours">Timer til (tom = ∞)</Label>
                  <Input
                    id="max-hours"
                    type="number"
                    value={levelForm.max_hours ?? ""}
                    onChange={(e) => setLevelForm({ 
                      ...levelForm, 
                      max_hours: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    min={0}
                    placeholder="∞"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourly-rate">Timelønn (kr)</Label>
                  <Input
                    id="hourly-rate"
                    type="number"
                    value={levelForm.hourly_rate}
                    onChange={(e) => setLevelForm({ ...levelForm, hourly_rate: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>

              {/* Effective From Date */}
              <div className="space-y-2">
                <Label>Gjelder fra</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !levelForm.effective_from && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {levelForm.effective_from
                        ? format(levelForm.effective_from, "PPP", { locale: nb })
                        : "Velg dato"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={levelForm.effective_from}
                      onSelect={(date) => {
                        if (date) {
                          setLevelForm({ ...levelForm, effective_from: date });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Back Pay Preview */}
              {editingLevel && levelForm.hourly_rate !== editingLevel.hourly_rate && (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={handleCalculateBackPay}
                    disabled={isCalculatingBackPay}
                    className="w-full"
                  >
                    {isCalculatingBackPay ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <DollarSign className="h-4 w-4 mr-2" />
                    )}
                    Beregn etterbetaling
                  </Button>
                </div>
              )}

              {showBackPayPreview && backPayCalculations.length > 0 && (
                <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-200">
                      <AlertTriangle className="h-4 w-4" />
                      Etterbetaling vil beregnes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Ny sats gjelder fra {format(levelForm.effective_from, "dd.MM.yyyy")} • 
                      Forrige sats: {formatCurrency(editingLevel?.hourly_rate || 0)} • 
                      Differanse: {levelForm.hourly_rate > (editingLevel?.hourly_rate || 0) ? "+" : ""}
                      {formatCurrency(levelForm.hourly_rate - (editingLevel?.hourly_rate || 0))}/t
                    </p>
                    <Separator />
                    <div className="space-y-1">
                      {backPayCalculations.map((calc) => (
                        <div key={calc.employeeId} className="flex justify-between text-sm">
                          <span>{calc.employeeName}</span>
                          <span className="text-muted-foreground">
                            {calc.totalHours.toLocaleString("nb-NO")} t → 
                            <span className="font-medium text-foreground ml-1">
                              +{formatCurrency(calc.totalAdjustment)}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Totalt</span>
                      <span>
                        +{formatCurrency(backPayCalculations.reduce((sum, c) => sum + c.totalAdjustment, 0))}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setView("list")}>
                  Avbryt
                </Button>
                <Button
                  onClick={handleSaveLevel}
                  disabled={createLevel.isPending || updateLevel.isPending || createAdjustments.isPending}
                >
                  {(createLevel.isPending || updateLevel.isPending || createAdjustments.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingLevel 
                    ? backPayCalculations.length > 0 
                      ? "Lagre og opprett etterbetalinger" 
                      : "Lagre endringer"
                    : "Legg til nivå"}
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

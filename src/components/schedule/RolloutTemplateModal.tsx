import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, addWeeks, startOfWeek } from "date-fns";
import { nb } from "date-fns/locale";
import {
  useShiftTemplates,
  useShiftTemplate,
  useRolloutTemplate,
  useRolloutPreview,
  previewRolloutCost,
  getWeekNumber,
  ShiftTemplate,
} from "@/hooks/useShiftTemplates";
import { RolloutPreviewGrid } from "./RolloutPreviewGrid";
import { Play, AlertTriangle, Calendar, Clock, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";

interface RolloutTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWeekDate: Date;
  preselectedTemplate?: ShiftTemplate;
}

export function RolloutTemplateModal({
  open,
  onOpenChange,
  currentWeekDate,
  preselectedTemplate,
}: RolloutTemplateModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [startWeekOffset, setStartWeekOffset] = useState<number>(0);
  const [numberOfWeeks, setNumberOfWeeks] = useState<number>(1);
  const [keepEmployeeAssignments, setKeepEmployeeAssignments] = useState(true);
  const [skipHolidays, setSkipHolidays] = useState(true);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("settings");
  const [previewWeekIndex, setPreviewWeekIndex] = useState(0);

  const { data: templates = [], isLoading: templatesLoading } = useShiftTemplates();
  const { data: selectedTemplate } = useShiftTemplate(selectedTemplateId || null);
  const rollout = useRolloutTemplate();

  // Calculate start week date
  const startWeekDate = useMemo(() => {
    const baseWeek = startOfWeek(currentWeekDate, { weekStartsOn: 1 });
    return addWeeks(baseWeek, startWeekOffset);
  }, [currentWeekDate, startWeekOffset]);

  // Rollout preview with conflict detection
  const { data: previews = [], isLoading: previewLoading } = useRolloutPreview(
    selectedTemplateId || null,
    startWeekDate,
    numberOfWeeks,
    { skipHolidays, overwriteExisting }
  );

  // Set preselected template when opening
  useEffect(() => {
    if (open && preselectedTemplate) {
      setSelectedTemplateId(preselectedTemplate.id);
    }
  }, [open, preselectedTemplate]);

  // Reset preview week when number of weeks changes
  useEffect(() => {
    if (previewWeekIndex >= numberOfWeeks) {
      setPreviewWeekIndex(0);
    }
  }, [numberOfWeeks, previewWeekIndex]);

  // Generate week options (current week + next 12 weeks)
  const weekOptions = useMemo(() => {
    const options = [];
    const baseWeek = startOfWeek(currentWeekDate, { weekStartsOn: 1 });
    
    for (let i = 0; i <= 12; i++) {
      const weekDate = addWeeks(baseWeek, i);
      options.push({
        offset: i,
        label: `Uke ${getWeekNumber(weekDate)} (${format(weekDate, "d. MMM", { locale: nb })})`,
      });
    }
    return options;
  }, [currentWeekDate]);

  // Calculate cost preview (fallback when rollout preview isn't loaded)
  const costPreview = useMemo(() => {
    if (!selectedTemplate?.template_shifts) return [];
    return previewRolloutCost(
      selectedTemplate.template_shifts,
      startWeekDate,
      numberOfWeeks
    );
  }, [selectedTemplate, startWeekDate, numberOfWeeks]);

  // Calculate totals from previews or cost preview
  const totals = useMemo(() => {
    if (previews.length > 0) {
      return {
        shifts: previews.reduce((sum, w) => sum + w.shiftCount, 0),
        hours: previews.reduce((sum, w) => sum + w.totalHours, 0),
        cost: previews.reduce((sum, w) => sum + w.estimatedCost, 0),
        conflicts: previews.reduce((sum, w) => sum + w.conflictCount, 0),
      };
    }
    return {
      shifts: costPreview.reduce((sum, week) => sum + week.shiftCount, 0),
      hours: costPreview.reduce((sum, week) => sum + week.totalHours, 0),
      cost: costPreview.reduce((sum, week) => sum + week.estimatedCost, 0),
      conflicts: 0,
    };
  }, [previews, costPreview]);

  const handleRollout = async () => {
    if (!selectedTemplateId) return;

    await rollout.mutateAsync({
      templateId: selectedTemplateId,
      startWeekDate,
      numberOfWeeks,
      keepEmployeeAssignments,
      skipHolidays,
      overwriteExisting,
    });

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedTemplateId("");
    setStartWeekOffset(0);
    setNumberOfWeeks(1);
    setKeepEmployeeAssignments(true);
    setSkipHolidays(true);
    setOverwriteExisting(false);
    setActiveTab("settings");
    setPreviewWeekIndex(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Rull ut vaktmal
          </DialogTitle>
          <DialogDescription>
            Velg en mal og rull den ut til én eller flere uker. Du kan
            forhåndsvise vaktene før du bekrefter.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Innstillinger</TabsTrigger>
            <TabsTrigger value="preview" disabled={!selectedTemplateId}>
              📅 Forhåndsvisning
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4 py-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Velg mal</Label>
              <Select
                value={selectedTemplateId || "_placeholder"}
                onValueChange={(v) => setSelectedTemplateId(v === "_placeholder" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg en vaktmal..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_placeholder" disabled>
                    Velg en vaktmal...
                  </SelectItem>
                  {templatesLoading ? (
                    <SelectItem value="_loading" disabled>
                      Laster maler...
                    </SelectItem>
                  ) : templates.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      Ingen maler opprettet ennå
                    </SelectItem>
                  ) : (
                    templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <span>{template.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {template.shift_count} vakter
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Start Week */}
              <div className="space-y-2">
                <Label>Fra uke</Label>
                <Select
                  value={String(startWeekOffset)}
                  onValueChange={(v) => setStartWeekOffset(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weekOptions.map((option) => (
                      <SelectItem key={option.offset} value={String(option.offset)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Number of Weeks */}
              <div className="space-y-2">
                <Label>Antall uker</Label>
                <Select
                  value={String(numberOfWeeks)}
                  onValueChange={(v) => setNumberOfWeeks(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 6, 8, 10, 12].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} {n === 1 ? "uke" : "uker"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="keepEmployees"
                  checked={keepEmployeeAssignments}
                  onCheckedChange={(checked) =>
                    setKeepEmployeeAssignments(checked === true)
                  }
                />
                <Label htmlFor="keepEmployees" className="font-normal">
                  Behold ansatt-tildelinger fra malen
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skipHolidays"
                  checked={skipHolidays}
                  onCheckedChange={(checked) => setSkipHolidays(checked === true)}
                />
                <Label htmlFor="skipHolidays" className="font-normal">
                  Hopp over helligdager
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="overwrite"
                  checked={overwriteExisting}
                  onCheckedChange={(checked) =>
                    setOverwriteExisting(checked === true)
                  }
                />
                <Label htmlFor="overwrite" className="font-normal text-destructive">
                  Overskrive eksisterende vakter (utkast)
                </Label>
              </div>
            </div>

            <Separator />

            {/* Cost Preview */}
            {selectedTemplate && costPreview.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Kostnadsforhåndsvisning
                </Label>
                <ScrollArea className="h-40 rounded-md border">
                  <div className="p-3 space-y-2">
                    {costPreview.map((week) => (
                      <div
                        key={week.weekNumber}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            Uke {getWeekNumber(week.weekStart)}:{" "}
                            {format(week.weekStart, "d. MMM", { locale: nb })} -{" "}
                            {format(week.weekEnd, "d. MMM", { locale: nb })}
                          </span>
                          {week.hasHoliday && (
                            <Badge variant="outline" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Helligdag
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <span className="text-muted-foreground">
                            {week.shiftCount} vakter
                          </span>
                          <span className="font-medium">
                            {Math.round(week.estimatedCost).toLocaleString("nb-NO")} kr
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Totals */}
                <div className="rounded-md bg-muted/50 p-3">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{totals.shifts}</div>
                      <div className="text-xs text-muted-foreground">Vakter</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {Math.round(totals.hours)}t
                      </div>
                      <div className="text-xs text-muted-foreground">Timer</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {Math.round(totals.cost).toLocaleString("nb-NO")} kr
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Estimert kostnad
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-4 py-4">
            {previewLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Laster forhåndsvisning...
              </div>
            ) : previews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Velg en mal for å se forhåndsvisning
              </div>
            ) : (
              <>
                {/* Week navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewWeekIndex(Math.max(0, previewWeekIndex - 1))}
                    disabled={previewWeekIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-center">
                    <div className="font-medium">
                      Uke {previews[previewWeekIndex]?.weekNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(previews[previewWeekIndex]?.weekStart, "d. MMM", { locale: nb })} - 
                      {format(previews[previewWeekIndex]?.weekEnd, "d. MMM yyyy", { locale: nb })}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewWeekIndex(Math.min(previews.length - 1, previewWeekIndex + 1))}
                    disabled={previewWeekIndex === previews.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Preview grid */}
                <RolloutPreviewGrid preview={previews[previewWeekIndex]} />

                {/* Summary */}
                <div className="rounded-md bg-muted/50 p-3">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold">{totals.shifts}</div>
                      <div className="text-xs text-muted-foreground">Vakter</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold">{Math.round(totals.hours)}t</div>
                      <div className="text-xs text-muted-foreground">Timer</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold">
                        {Math.round(totals.cost).toLocaleString("nb-NO")} kr
                      </div>
                      <div className="text-xs text-muted-foreground">Est. kostnad</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold">{numberOfWeeks}</div>
                      <div className="text-xs text-muted-foreground">Uker</div>
                    </div>
                  </div>
                  {totals.conflicts > 0 && (
                    <div className="mt-3 text-center text-sm text-yellow-600 dark:text-yellow-400">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      {totals.conflicts} konflikter funnet
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleRollout}
            disabled={!selectedTemplateId || rollout.isPending}
          >
            {rollout.isPending ? "Ruller ut..." : `Rull ut ${totals.shifts} vakter`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
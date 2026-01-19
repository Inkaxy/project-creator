import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Clock, Coffee, Moon, AlertTriangle } from "lucide-react";
import { useWorkTimeRules } from "@/hooks/useWorkTimeRules";
import { useUpdateWorkTimeRules } from "@/hooks/useSettingsMutations";

export function WorkTimeRulesPanel() {
  const { data: rules, isLoading } = useWorkTimeRules();
  const updateMutation = useUpdateWorkTimeRules();

  const [formData, setFormData] = useState({
    max_hours_per_day: 9,
    max_hours_per_day_extended: 10,
    min_rest_between_shifts: 11,
    max_hours_per_week: 40,
    max_hours_per_week_average: 48,
    averaging_period_weeks: 8,
    overtime_threshold_daily: 9,
    max_overtime_per_week: 10,
    max_overtime_per_year: 200,
    break_required_after_hours: 5.5,
    min_break_minutes: 30,
    break_required_after_hours_long: 8,
    min_break_minutes_long: 45,
    require_sunday_off: true,
    sunday_off_frequency_weeks: 3,
    warn_at_percent_of_max: 90,
  });

  useEffect(() => {
    if (rules) {
      setFormData({
        max_hours_per_day: rules.max_hours_per_day,
        max_hours_per_day_extended: rules.max_hours_per_day_extended,
        min_rest_between_shifts: rules.min_rest_between_shifts,
        max_hours_per_week: rules.max_hours_per_week,
        max_hours_per_week_average: rules.max_hours_per_week_average,
        averaging_period_weeks: rules.averaging_period_weeks,
        overtime_threshold_daily: rules.overtime_threshold_daily,
        max_overtime_per_week: rules.max_overtime_per_week,
        max_overtime_per_year: rules.max_overtime_per_year,
        break_required_after_hours: rules.break_required_after_hours,
        min_break_minutes: rules.min_break_minutes,
        break_required_after_hours_long: rules.break_required_after_hours_long,
        min_break_minutes_long: rules.min_break_minutes_long,
        require_sunday_off: rules.require_sunday_off,
        sunday_off_frequency_weeks: rules.sunday_off_frequency_weeks,
        warn_at_percent_of_max: rules.warn_at_percent_of_max,
      });
    }
  }, [rules]);

  const handleSave = () => {
    if (!rules) return;
    updateMutation.mutate({ id: rules.id, ...formData });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Daglige grenser
          </CardTitle>
          <CardDescription>
            Innstillinger for maksimal arbeidstid per dag
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Maks timer per dag</Label>
            <Input
              type="number"
              step="0.5"
              value={formData.max_hours_per_day}
              onChange={(e) => setFormData({ ...formData, max_hours_per_day: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">Normal grense (AML § 10-4)</p>
          </div>
          <div className="space-y-2">
            <Label>Maks timer (utvidet)</Label>
            <Input
              type="number"
              step="0.5"
              value={formData.max_hours_per_day_extended}
              onChange={(e) => setFormData({ ...formData, max_hours_per_day_extended: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">Absolutt grense med avtale</p>
          </div>
          <div className="space-y-2">
            <Label>Min hviletid mellom vakter (timer)</Label>
            <Input
              type="number"
              step="0.5"
              value={formData.min_rest_between_shifts}
              onChange={(e) => setFormData({ ...formData, min_rest_between_shifts: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">AML § 10-8</p>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Ukentlige grenser
          </CardTitle>
          <CardDescription>
            Innstillinger for maksimal arbeidstid per uke
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Maks timer per uke</Label>
            <Input
              type="number"
              step="0.5"
              value={formData.max_hours_per_week}
              onChange={(e) => setFormData({ ...formData, max_hours_per_week: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">Normal grense</p>
          </div>
          <div className="space-y-2">
            <Label>Maks gjennomsnitt per uke</Label>
            <Input
              type="number"
              step="0.5"
              value={formData.max_hours_per_week_average}
              onChange={(e) => setFormData({ ...formData, max_hours_per_week_average: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">Inkl. overtid (§ 10-6)</p>
          </div>
          <div className="space-y-2">
            <Label>Utjevningsperiode (uker)</Label>
            <Input
              type="number"
              value={formData.averaging_period_weeks}
              onChange={(e) => setFormData({ ...formData, averaging_period_weeks: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">For gjennomsnittsberegning</p>
          </div>
        </CardContent>
      </Card>

      {/* Overtime */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Overtid
          </CardTitle>
          <CardDescription>
            Grenser og terskler for overtidsberegning
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Overtidsterskel (daglig)</Label>
            <Input
              type="number"
              step="0.5"
              value={formData.overtime_threshold_daily}
              onChange={(e) => setFormData({ ...formData, overtime_threshold_daily: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">Timer før 50% tillegg</p>
          </div>
          <div className="space-y-2">
            <Label>Maks overtid per uke</Label>
            <Input
              type="number"
              step="0.5"
              value={formData.max_overtime_per_week}
              onChange={(e) => setFormData({ ...formData, max_overtime_per_week: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Maks overtid per år</Label>
            <Input
              type="number"
              value={formData.max_overtime_per_year}
              onChange={(e) => setFormData({ ...formData, max_overtime_per_year: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">AML § 10-6</p>
          </div>
        </CardContent>
      </Card>

      {/* Breaks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            Pauser
          </CardTitle>
          <CardDescription>
            Krav til pauser basert på vaktlengde
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            <h4 className="font-medium">Korte vakter</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Pause kreves etter (timer)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.break_required_after_hours}
                  onChange={(e) => setFormData({ ...formData, break_required_after_hours: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum pause (minutter)</Label>
                <Input
                  type="number"
                  value={formData.min_break_minutes}
                  onChange={(e) => setFormData({ ...formData, min_break_minutes: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-medium">Lange vakter</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Pause kreves etter (timer)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.break_required_after_hours_long}
                  onChange={(e) => setFormData({ ...formData, break_required_after_hours_long: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum pause (minutter)</Label>
                <Input
                  type="number"
                  value={formData.min_break_minutes_long}
                  onChange={(e) => setFormData({ ...formData, min_break_minutes_long: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Andre innstillinger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Krev søndagsfri</Label>
              <p className="text-sm text-muted-foreground">
                Sjekk om ansatte har tilstrekkelig søndagsfri
              </p>
            </div>
            <Switch
              checked={formData.require_sunday_off}
              onCheckedChange={(checked) => setFormData({ ...formData, require_sunday_off: checked })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Søndagsfri frekvens (uker)</Label>
              <Input
                type="number"
                value={formData.sunday_off_frequency_weeks}
                onChange={(e) => setFormData({ ...formData, sunday_off_frequency_weeks: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Minst 1 av X søndager fri</p>
            </div>
            <div className="space-y-2">
              <Label>Advarselsnivå (%)</Label>
              <Input
                type="number"
                value={formData.warn_at_percent_of_max}
                onChange={(e) => setFormData({ ...formData, warn_at_percent_of_max: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Varsle når denne % av maks nås</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending} size="lg">
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Lagre arbeidstidsregler
        </Button>
      </div>
    </div>
  );
}

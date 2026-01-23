import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Clock, Settings, CheckCircle, Zap, Cloud, Cake } from "lucide-react";
import { useTimesheetSettings, useUpdateTimesheetSettings, deviationHandlingLabels } from "@/hooks/useTimesheetApproval";
import { useBirthdayVisibility, useUpdateSetting, BirthdayVisibility } from "@/hooks/useSettings";

export function TimesheetSettingsPanel() {
  const { data: settings, isLoading } = useTimesheetSettings();
  const updateSettings = useUpdateTimesheetSettings();
  const { data: birthdayVisibility, isLoading: birthdayLoading } = useBirthdayVisibility();
  const updateSetting = useUpdateSetting();

  const [formData, setFormData] = useState({
    auto_approve_within_margin: true,
    margin_minutes: 15,
    default_positive_deviation_handling: "time_bank",
    default_negative_deviation_handling: "ignore",
    require_explanation_above_minutes: 30,
    show_weather_forecast: true,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        auto_approve_within_margin: settings.auto_approve_within_margin,
        margin_minutes: settings.margin_minutes,
        default_positive_deviation_handling: settings.default_positive_deviation_handling,
        default_negative_deviation_handling: settings.default_negative_deviation_handling,
        require_explanation_above_minutes: settings.require_explanation_above_minutes,
        show_weather_forecast: settings.show_weather_forecast ?? true,
      });
    }
  }, [settings]);

  const handleSave = () => {
    if (!settings?.id) return;
    updateSettings.mutate({
      id: settings.id,
      ...formData,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto-approval settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automatisk godkjenning
          </CardTitle>
          <CardDescription>
            Konfigurer regler for automatisk godkjenning av timelister
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Aktiver auto-godkjenning</Label>
              <p className="text-sm text-muted-foreground">
                Godkjenn automatisk timelister som er innenfor marginen
              </p>
            </div>
            <Switch
              checked={formData.auto_approve_within_margin}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, auto_approve_within_margin: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="margin">Tillatt margin (minutter)</Label>
            <p className="text-sm text-muted-foreground">
              Timelister innenfor ±{formData.margin_minutes} minutter fra planlagt tid godkjennes automatisk
            </p>
            <Input
              id="margin"
              type="number"
              min={0}
              max={60}
              value={formData.margin_minutes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, margin_minutes: parseInt(e.target.value) || 0 }))
              }
              className="w-32"
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 text-success" />
              <div className="text-sm">
                <p className="font-medium">Slik fungerer det:</p>
                <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Timelister med avvik ≤ {formData.margin_minutes} min godkjennes automatisk</li>
                  <li>Timelister med avvik &gt; {formData.margin_minutes} min krever manuell behandling</li>
                  <li>Ledere får varsel om automatisk godkjente timelister</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default handling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Standard avvikshåndtering
          </CardTitle>
          <CardDescription>
            Forslag til hvordan avvik skal håndteres ved manuell godkjenning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Ekstratid (positivt avvik)</Label>
              <p className="text-sm text-muted-foreground">
                Når ansatte jobber mer enn planlagt
              </p>
              <Select
                value={formData.default_positive_deviation_handling}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, default_positive_deviation_handling: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="time_bank">Tidsbank</SelectItem>
                  <SelectItem value="overtime_50">Overtid 50%</SelectItem>
                  <SelectItem value="overtime_100">Overtid 100%</SelectItem>
                  <SelectItem value="comp_time">Avspasering</SelectItem>
                  <SelectItem value="ignore">Ignorer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Manglende tid (negativt avvik)</Label>
              <p className="text-sm text-muted-foreground">
                Når ansatte jobber mindre enn planlagt
              </p>
              <Select
                value={formData.default_negative_deviation_handling}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, default_negative_deviation_handling: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="ignore">Ignorer</SelectItem>
                  <SelectItem value="deduct">Trekk fra lønn</SelectItem>
                  <SelectItem value="time_bank">Trekk fra tidsbank</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="explanation">Krev forklaring ved avvik over (minutter)</Label>
            <p className="text-sm text-muted-foreground">
              Ansatte må oppgi forklaring for avvik større enn dette
            </p>
            <Input
              id="explanation"
              type="number"
              min={0}
              max={120}
              value={formData.require_explanation_above_minutes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  require_explanation_above_minutes: parseInt(e.target.value) || 0,
                }))
              }
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Weather settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Værmelding
          </CardTitle>
          <CardDescription>
            Vis fiktiv værmelding i kalender og vaktplan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Vis værmelding</Label>
              <p className="text-sm text-muted-foreground">
                Viser en fiktiv værmelding på kalender- og vaktplan-sidene
              </p>
            </div>
            <Switch
              checked={formData.show_weather_forecast}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, show_weather_forecast: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Birthday settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5" />
            Bursdager i kalender
          </CardTitle>
          <CardDescription>
            Konfigurer hvem som kan se ansattes bursdager i kalenderen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Hvem kan se bursdager?</Label>
              <p className="text-sm text-muted-foreground">
                Velg om alle ansatte eller kun ledere kan se bursdager i kalenderen
              </p>
              <Select
                value={birthdayVisibility || "managers_only"}
                onValueChange={(value: BirthdayVisibility) =>
                  updateSetting.mutate({ key: "calendar_birthdays_visibility", value })
                }
                disabled={birthdayLoading}
              >
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">Alle ansatte</SelectItem>
                  <SelectItem value="managers_only">Kun ledere</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Lagrer...
            </>
          ) : (
            <>
              <Settings className="mr-2 h-4 w-4" />
              Lagre innstillinger
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

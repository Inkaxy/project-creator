import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMyPoolSettings, useUpsertPoolSettings } from "@/hooks/useCrewshare";
import { Loader2, Save } from "lucide-react";

export function PoolSettingsPanel() {
  const { data: settings, isLoading } = useMyPoolSettings();
  const upsertMutation = useUpsertPoolSettings();
  
  const [isAvailable, setIsAvailable] = useState(false);
  const [maxPercentage, setMaxPercentage] = useState(50);
  const [minNotice, setMinNotice] = useState(24);
  const [hourlyRate, setHourlyRate] = useState<number | undefined>();
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (settings) {
      setIsAvailable(settings.is_available_for_pooling);
      setMaxPercentage(settings.max_pool_percentage);
      setMinNotice(settings.min_notice_hours);
      setHourlyRate(settings.external_hourly_rate || undefined);
      setBio(settings.bio || "");
    }
  }, [settings]);

  const handleSave = () => {
    upsertMutation.mutate({
      is_available_for_pooling: isAvailable,
      max_pool_percentage: maxPercentage,
      min_notice_hours: minNotice,
      external_hourly_rate: hourlyRate,
      bio,
      pooling_consent_given_at: isAvailable ? new Date().toISOString() : null,
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tilgjengelighet for utleie</CardTitle>
          <CardDescription>Aktiver for å motta forespørsler fra partnerbedrifter</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="available">Tilgjengelig for Crewshare</Label>
            <Switch id="available" checked={isAvailable} onCheckedChange={setIsAvailable} />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Maks utleieandel (%)</Label>
              <Input type="number" value={maxPercentage} onChange={(e) => setMaxPercentage(Number(e.target.value))} min={0} max={50} />
              <p className="text-xs text-muted-foreground">Lovlig maks er 50%</p>
            </div>
            <div className="space-y-2">
              <Label>Minimum varsel (timer)</Label>
              <Input type="number" value={minNotice} onChange={(e) => setMinNotice(Number(e.target.value))} min={1} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Ønsket timepris (kr)</Label>
            <Input type="number" value={hourlyRate || ""} onChange={(e) => setHourlyRate(e.target.value ? Number(e.target.value) : undefined)} placeholder="F.eks. 350" />
          </div>
          
          <div className="space-y-2">
            <Label>Kort beskrivelse</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Erfaren servitør med 5 års erfaring..." rows={3} />
          </div>
          
          <Button onClick={handleSave} disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Lagre innstillinger
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useKioskSettings,
  useUpdateKioskSettings,
  useUploadKioskLogo,
} from "@/hooks/useKioskSettings";
import {
  Monitor,
  Upload,
  Link,
  Copy,
  Check,
  Clock,
  Users,
  Calendar,
  Briefcase,
  KeyRound,
  Timer,
  Palette,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export function KioskSettingsPanel() {
  const { data: settings, isLoading } = useKioskSettings();
  const updateSettings = useUpdateKioskSettings();
  const uploadLogo = useUploadKioskLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const kioskUrl = `${window.location.origin}/kiosk`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(kioskUrl);
    setCopied(true);
    toast.success("Lenke kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo må være under 2MB");
        return;
      }
      uploadLogo.mutate(file);
    }
  };

  const handleUpdate = (field: string, value: unknown) => {
    updateSettings.mutate({ [field]: value });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Kiosk Link Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-primary" />
            Kiosk-lenke
          </CardTitle>
          <CardDescription>
            Bruk denne lenken for å åpne kiosk-visningen på en dedikert tablet eller skjerm
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={kioskUrl}
              readOnly
              className="font-mono text-sm bg-background"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              className="flex-shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(kioskUrl, "_blank")}
              className="flex-shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Tips: Åpne lenken i fullskjerm-modus (F11) for beste opplevelse
          </p>
        </CardContent>
      </Card>

      {/* Branding Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Utseende og merkevare
          </CardTitle>
          <CardDescription>
            Tilpass kiosk-visningen med din bedrifts logo og farger
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-3">
            <Label>Firmalogo</Label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted overflow-hidden">
                {settings?.company_logo_url ? (
                  <img
                    src={settings.company_logo_url}
                    alt="Logo"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Monitor className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLogo.isPending}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadLogo.isPending ? "Laster opp..." : "Last opp logo"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Anbefalt: 200x200px, PNG eller SVG, maks 2MB
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company_name" className="flex items-center gap-2">
              Firmanavn
            </Label>
            <Input
              id="company_name"
              value={settings?.company_name || ""}
              onChange={(e) => handleUpdate("company_name", e.target.value)}
              placeholder="Crewplan"
            />
          </div>

          {/* Welcome Message */}
          <div className="space-y-2">
            <Label htmlFor="welcome_message" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Velkomstmelding
            </Label>
            <Textarea
              id="welcome_message"
              value={settings?.welcome_message || ""}
              onChange={(e) => handleUpdate("welcome_message", e.target.value)}
              placeholder="Velkommen!"
              rows={2}
            />
          </div>

          {/* Primary Color */}
          <div className="space-y-2">
            <Label htmlFor="primary_color" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Primærfarge
            </Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="primary_color"
                value={settings?.primary_color || "#10B981"}
                onChange={(e) => handleUpdate("primary_color", e.target.value)}
                className="h-10 w-20 rounded-md border border-input cursor-pointer"
              />
              <Input
                value={settings?.primary_color || "#10B981"}
                onChange={(e) => handleUpdate("primary_color", e.target.value)}
                className="w-32 font-mono"
                placeholder="#10B981"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Visningsinnstillinger
          </CardTitle>
          <CardDescription>
            Velg hvilke kolonner og informasjon som skal vises
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Vis sekunder på klokken</Label>
                <p className="text-sm text-muted-foreground">
                  Vis timer:minutter:sekunder i stedet for bare timer:minutter
                </p>
              </div>
            </div>
            <Switch
              checked={settings?.show_clock_seconds ?? true}
              onCheckedChange={(checked) => handleUpdate("show_clock_seconds", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Vis "Planlagt"-kolonne</Label>
                <p className="text-sm text-muted-foreground">
                  Vis ansatte som har vakt men ikke har stemplet inn ennå
                </p>
              </div>
            </div>
            <Switch
              checked={settings?.show_planned_shifts ?? true}
              onCheckedChange={(checked) => handleUpdate("show_planned_shifts", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Vis "På arbeid"-kolonne</Label>
                <p className="text-sm text-muted-foreground">
                  Vis ansatte som har stemplet inn og er på jobb nå
                </p>
              </div>
            </div>
            <Switch
              checked={settings?.show_active_workers ?? true}
              onCheckedChange={(checked) => handleUpdate("show_active_workers", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Vis "Alle medarbeidere"-kolonne</Label>
                <p className="text-sm text-muted-foreground">
                  Vis alfabetisk liste over alle ansatte
                </p>
              </div>
            </div>
            <Switch
              checked={settings?.show_all_employees ?? true}
              onCheckedChange={(checked) => handleUpdate("show_all_employees", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Sikkerhet og autentisering
          </CardTitle>
          <CardDescription>
            Konfigurer PIN-krav og automatisk utlogging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Krev PIN-kode for alle</Label>
                <p className="text-sm text-muted-foreground">
                  Alle ansatte må taste PIN-kode, selv om de ikke har en satt
                </p>
              </div>
            </div>
            <Switch
              checked={settings?.require_pin_for_all ?? false}
              onCheckedChange={(checked) => handleUpdate("require_pin_for_all", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Tillat stempling uten vakt</Label>
                <p className="text-sm text-muted-foreground">
                  La ansatte stemple inn selv om de ikke har en planlagt vakt
                </p>
              </div>
            </div>
            <Switch
              checked={settings?.allow_clock_without_shift ?? true}
              onCheckedChange={(checked) => handleUpdate("allow_clock_without_shift", checked)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="auto_logout" className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Automatisk tilbakestilling (sekunder)
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Tid før skjermen automatisk går tilbake til hovedvisningen etter stempling
            </p>
            <div className="flex items-center gap-3">
              <Input
                id="auto_logout"
                type="number"
                min={5}
                max={120}
                value={settings?.auto_logout_seconds || 30}
                onChange={(e) => handleUpdate("auto_logout_seconds", parseInt(e.target.value) || 30)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">sekunder</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-success" />
              Kiosk er aktiv og tilgjengelig
            </div>
            <Badge variant="outline">
              Sist oppdatert: {settings?.updated_at ? new Date(settings.updated_at).toLocaleString("nb-NO") : "—"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

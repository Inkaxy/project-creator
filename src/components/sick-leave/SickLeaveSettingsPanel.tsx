import { useState, useEffect } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { 
  Settings, 
  Shield, 
  Bell, 
  Calendar as CalendarIcon,
  CheckCircle,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useSickLeaveSettings } from "@/hooks/useSickLeave";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SickLeaveSettingsPanel() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useSickLeaveSettings();
  
  const [formData, setFormData] = useState({
    has_ia_agreement: false,
    ia_agreement_start_date: null as Date | null,
    ia_agreement_end_date: null as Date | null,
    self_cert_quota_type: 'standard' as 'standard' | 'ia' | 'custom',
    self_cert_max_days_per_occurrence: 3,
    self_cert_max_days_per_year: 12,
    self_cert_max_occurrences: 4,
    notify_hr_on_sick_leave: true,
    notify_manager_on_sick_leave: true,
    notify_days_before_deadline: 3,
    require_return_conversation: true,
    auto_create_follow_up_plan: true,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        has_ia_agreement: settings.has_ia_agreement,
        ia_agreement_start_date: settings.ia_agreement_start_date 
          ? new Date(settings.ia_agreement_start_date) 
          : null,
        ia_agreement_end_date: settings.ia_agreement_end_date 
          ? new Date(settings.ia_agreement_end_date) 
          : null,
        self_cert_quota_type: settings.self_cert_quota_type,
        self_cert_max_days_per_occurrence: settings.self_cert_max_days_per_occurrence,
        self_cert_max_days_per_year: settings.self_cert_max_days_per_year,
        self_cert_max_occurrences: settings.self_cert_max_occurrences,
        notify_hr_on_sick_leave: settings.notify_hr_on_sick_leave,
        notify_manager_on_sick_leave: settings.notify_manager_on_sick_leave,
        notify_days_before_deadline: settings.notify_days_before_deadline,
        require_return_conversation: settings.require_return_conversation,
        auto_create_follow_up_plan: settings.auto_create_follow_up_plan,
      });
    }
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: async (data: typeof formData) => {
      const updateData = {
        has_ia_agreement: data.has_ia_agreement,
        ia_agreement_start_date: data.ia_agreement_start_date 
          ? format(data.ia_agreement_start_date, 'yyyy-MM-dd') 
          : null,
        ia_agreement_end_date: data.ia_agreement_end_date 
          ? format(data.ia_agreement_end_date, 'yyyy-MM-dd') 
          : null,
        self_cert_quota_type: data.self_cert_quota_type,
        self_cert_max_days_per_occurrence: data.self_cert_max_days_per_occurrence,
        self_cert_max_days_per_year: data.self_cert_max_days_per_year,
        self_cert_max_occurrences: data.self_cert_max_occurrences,
        notify_hr_on_sick_leave: data.notify_hr_on_sick_leave,
        notify_manager_on_sick_leave: data.notify_manager_on_sick_leave,
        notify_days_before_deadline: data.notify_days_before_deadline,
        require_return_conversation: data.require_return_conversation,
        auto_create_follow_up_plan: data.auto_create_follow_up_plan,
      };

      if (settings?.id) {
        const { error } = await supabase
          .from('sick_leave_settings')
          .update(updateData)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sick_leave_settings')
          .insert(updateData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sick_leave_settings'] });
      toast.success("Innstillinger lagret");
    },
    onError: () => {
      toast.error("Kunne ikke lagre innstillinger");
    },
  });

  const handleSave = () => {
    updateSettings.mutate(formData);
  };

  // Handle IA toggle
  const handleIAToggle = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      has_ia_agreement: checked,
      self_cert_quota_type: checked ? 'ia' : 'standard',
      self_cert_max_days_per_occurrence: checked ? 8 : 3,
      self_cert_max_days_per_year: checked ? 24 : 12,
      self_cert_max_occurrences: checked ? null as any : 4,
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Laster innstillinger...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* IA-avtale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            IA-avtale (Inkluderende Arbeidsliv)
          </CardTitle>
          <CardDescription>
            Bedrifter med IA-avtale har utvidet egenmeldingsordning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Virksomheten har IA-avtale</Label>
              <p className="text-sm text-muted-foreground">
                Aktiverer utvidet egenmeldingsordning (8 dager, 24 dager/år)
              </p>
            </div>
            <Switch
              checked={formData.has_ia_agreement}
              onCheckedChange={handleIAToggle}
            />
          </div>

          {formData.has_ia_agreement && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Avtaleperiode fra</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.ia_agreement_start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.ia_agreement_start_date 
                        ? format(formData.ia_agreement_start_date, "d. MMM yyyy", { locale: nb }) 
                        : "Velg dato"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.ia_agreement_start_date || undefined}
                      onSelect={(date) => setFormData(prev => ({ ...prev, ia_agreement_start_date: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Avtaleperiode til</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.ia_agreement_end_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.ia_agreement_end_date 
                        ? format(formData.ia_agreement_end_date, "d. MMM yyyy", { locale: nb }) 
                        : "Velg dato"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.ia_agreement_end_date || undefined}
                      onSelect={(date) => setFormData(prev => ({ ...prev, ia_agreement_end_date: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Egenmeldingsregler */}
      <Card>
        <CardHeader>
          <CardTitle>Egenmeldingsregler</CardTitle>
          <CardDescription>
            Konfigurer kvoter og begrensninger for egenmeldinger
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Kvotetype</Label>
            <Select 
              value={formData.self_cert_quota_type}
              onValueChange={(v: 'standard' | 'ia' | 'custom') => setFormData(prev => ({ ...prev, self_cert_quota_type: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard (3 dager, 4 ganger/år)</SelectItem>
                <SelectItem value="ia">IA-avtale (8 dager, ubegrenset)</SelectItem>
                <SelectItem value="custom">Egendefinert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.self_cert_quota_type === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-2">
                <Label>Maks dager per gang</Label>
                <Input
                  type="number"
                  min={1}
                  max={14}
                  value={formData.self_cert_max_days_per_occurrence}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    self_cert_max_days_per_occurrence: parseInt(e.target.value) || 3 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Maks dager per år</Label>
                <Input
                  type="number"
                  min={1}
                  max={52}
                  value={formData.self_cert_max_days_per_year}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    self_cert_max_days_per_year: parseInt(e.target.value) || 12 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Maks ganger per år</Label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={formData.self_cert_max_occurrences}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    self_cert_max_occurrences: parseInt(e.target.value) || 4 
                  }))}
                />
              </div>
            </div>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {formData.self_cert_quota_type === 'ia' 
                ? "Med IA-avtale kan ansatte bruke egenmelding i opptil 8 kalenderdager per gang, og opptil 24 dager totalt per 12 måneder."
                : formData.self_cert_quota_type === 'standard'
                  ? "Standard egenmeldingsordning: Maks 3 kalenderdager per gang, 4 ganger i løpet av 12 måneder."
                  : "Egendefinert kvote basert på dine innstillinger ovenfor."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Varsler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Varsler
          </CardTitle>
          <CardDescription>
            Konfigurer hvem som skal varsles ved sykefravær
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Varsle HR ved nytt sykefravær</Label>
              <p className="text-sm text-muted-foreground">
                Send varsel til HR-ansvarlig når sykefravær registreres
              </p>
            </div>
            <Switch
              checked={formData.notify_hr_on_sick_leave}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notify_hr_on_sick_leave: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Varsle leder ved nytt sykefravær</Label>
              <p className="text-sm text-muted-foreground">
                Send varsel til avdelingsleder ved sykefravær
              </p>
            </div>
            <Switch
              checked={formData.notify_manager_on_sick_leave}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notify_manager_on_sick_leave: checked }))}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Varsel før frist (antall dager)</Label>
            <Select 
              value={formData.notify_days_before_deadline.toString()}
              onValueChange={(v) => setFormData(prev => ({ ...prev, notify_days_before_deadline: parseInt(v) }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 dag før</SelectItem>
                <SelectItem value="3">3 dager før</SelectItem>
                <SelectItem value="5">5 dager før</SelectItem>
                <SelectItem value="7">7 dager før</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Oppfølging */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Oppfølgingsregler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Krev tilbakekomstsamtale</Label>
              <p className="text-sm text-muted-foreground">
                Krev dokumentert tilbakekomstsamtale etter sykefravær
              </p>
            </div>
            <Switch
              checked={formData.require_return_conversation}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, require_return_conversation: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Automatisk oppfølgingsplan</Label>
              <p className="text-sm text-muted-foreground">
                Opprett oppfølgingsplan-påminnelse automatisk ved lengre fravær
              </p>
            </div>
            <Switch
              checked={formData.auto_create_follow_up_plan}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_create_follow_up_plan: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lagre */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          <CheckCircle className="h-4 w-4 mr-2" />
          {updateSettings.isPending ? "Lagrer..." : "Lagre innstillinger"}
        </Button>
      </div>
    </div>
  );
}

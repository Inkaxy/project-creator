import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, MessageSquare, Bell, Clock, Eye } from 'lucide-react';
import type { NotificationSettings as NotificationSettingsType } from '@/types/conversations';

interface NotificationSettingsProps {
  settings: NotificationSettingsType;
  onSettingsChange: (settings: NotificationSettingsType) => void;
  allowPreparation: boolean;
  onAllowPreparationChange: (allow: boolean) => void;
  sendReminder: boolean;
  onSendReminderChange: (send: boolean) => void;
}

export function NotificationSettings({
  settings,
  onSettingsChange,
  allowPreparation,
  onAllowPreparationChange,
  sendReminder,
  onSendReminderChange,
}: NotificationSettingsProps) {
  const updateSetting = (key: keyof NotificationSettingsType, value: boolean) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Notification Channels */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Varslingskanaler</Label>
        <p className="text-sm text-muted-foreground">
          Velg hvordan den ansatte skal varsles om samtalen
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card 
            className={`cursor-pointer transition-all ${settings.email ? 'border-primary ring-1 ring-primary' : ''}`}
            onClick={() => updateSetting('email', !settings.email)}
          >
            <CardContent className="flex flex-col items-center gap-2 pt-6">
              <Mail className={`h-8 w-8 ${settings.email ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="font-medium">E-post</span>
              <Switch 
                checked={settings.email} 
                onCheckedChange={(v) => updateSetting('email', v)}
              />
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${settings.push ? 'border-primary ring-1 ring-primary' : ''}`}
            onClick={() => updateSetting('push', !settings.push)}
          >
            <CardContent className="flex flex-col items-center gap-2 pt-6">
              <Bell className={`h-8 w-8 ${settings.push ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="font-medium">Push-varsel</span>
              <Switch 
                checked={settings.push} 
                onCheckedChange={(v) => updateSetting('push', v)}
              />
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${settings.sms ? 'border-primary ring-1 ring-primary' : ''}`}
            onClick={() => updateSetting('sms', !settings.sms)}
          >
            <CardContent className="flex flex-col items-center gap-2 pt-6">
              <MessageSquare className={`h-8 w-8 ${settings.sms ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="font-medium">SMS</span>
              <Switch 
                checked={settings.sms} 
                onCheckedChange={(v) => updateSetting('sms', v)}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Settings */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Ekstra innstillinger</Label>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Send påminnelse 24 timer før</p>
                <p className="text-sm text-muted-foreground">
                  Den ansatte mottar en påminnelse dagen før samtalen
                </p>
              </div>
            </div>
            <Switch
              checked={sendReminder}
              onCheckedChange={onSendReminderChange}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">La ansatt forberede seg</p>
                <p className="text-sm text-muted-foreground">
                  Den ansatte kan se spørsmålene på forhånd
                </p>
              </div>
            </div>
            <Switch
              checked={allowPreparation}
              onCheckedChange={onAllowPreparationChange}
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Forhåndsvisning av e-post</Label>
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm font-medium">Emne: Invitasjon til medarbeidersamtale</p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>Hei [Ansatt],</p>
              <p>Du er invitert til en medarbeidersamtale med [Leder].</p>
              <p>📅 Dato: [Valgt dato]</p>
              <p>⏰ Tid: [Valgt tid]</p>
              <p>📍 Sted: [Valgt sted]</p>
              {allowPreparation && (
                <p className="mt-4">
                  Du kan forberede deg ved å logge inn i CrewPlan og gjennomgå spørsmålene på forhånd.
                </p>
              )}
              <p className="mt-4">Med vennlig hilsen,<br />[Leder]</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

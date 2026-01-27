import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUpdateAMUMeeting, useUpdateAgendaItem } from "@/hooks/useAMU";
import type { AMUMeeting } from "@/types/amu";

interface Props {
  meeting: AMUMeeting;
  onUpdate: () => void;
}

export function MeetingWizardStep4({ meeting, onUpdate }: Props) {
  const updateMeeting = useUpdateAMUMeeting();
  const updateItem = useUpdateAgendaItem();
  const items = meeting.agenda_items || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Notater</h2>
        <p className="text-muted-foreground">Legg til notater og beslutninger per agendapunkt</p>
      </div>

      <div className="space-y-6">
        {items.map((item, index) => (
          <div key={item.id} className="p-4 border rounded-lg space-y-3">
            <h3 className="font-medium">{index + 1}. {item.title}</h3>
            <div className="space-y-2">
              <Label>Notater</Label>
              <Textarea defaultValue={item.notes || ""} onBlur={(e) => { updateItem.mutate({ id: item.id, meeting_id: meeting.id, notes: e.target.value }); onUpdate(); }} placeholder="Notater fra diskusjonen..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Beslutning</Label>
              <Textarea defaultValue={item.decision || ""} onBlur={(e) => { updateItem.mutate({ id: item.id, meeting_id: meeting.id, decision: e.target.value }); onUpdate(); }} placeholder="Hva ble besluttet?" rows={2} />
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-center py-8 text-muted-foreground">Ingen agendapunkter å legge til notater for</p>}
      </div>

      <div className="space-y-2">
        <Label>Generelle notater</Label>
        <Textarea defaultValue={meeting.general_notes || ""} onBlur={(e) => { updateMeeting.mutate({ id: meeting.id, general_notes: e.target.value }); onUpdate(); }} placeholder="Generelle notater fra møtet..." rows={4} />
      </div>
    </div>
  );
}

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateAMUMeeting } from "@/hooks/useAMU";
import type { AMUMeeting } from "@/types/amu";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface Props {
  meeting: AMUMeeting;
  onUpdate: () => void;
}

export function MeetingWizardStep1({ meeting, onUpdate }: Props) {
  const updateMeeting = useUpdateAMUMeeting();

  const handleUpdate = async (field: string, value: string) => {
    await updateMeeting.mutateAsync({ id: meeting.id, [field]: value });
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Generell informasjon</h2>
        <p className="text-muted-foreground">Grunnleggende detaljer om møtet</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Møtetittel</Label>
          <Input defaultValue={meeting.title} onBlur={(e) => handleUpdate("title", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Møtenummer</Label>
          <Input value={meeting.meeting_number?.toString() || "-"} disabled />
        </div>
        <div className="space-y-2">
          <Label>Dato</Label>
          <Input type="date" defaultValue={meeting.meeting_date} onBlur={(e) => handleUpdate("meeting_date", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Tidspunkt</Label>
          <Input type="time" defaultValue={meeting.meeting_time || ""} onBlur={(e) => handleUpdate("meeting_time", e.target.value)} />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label>Sted</Label>
          <Input defaultValue={meeting.location || ""} onBlur={(e) => handleUpdate("location", e.target.value)} placeholder="F.eks. Møterom 1" />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label>Beskrivelse</Label>
          <Textarea defaultValue={meeting.description || ""} onBlur={(e) => handleUpdate("description", e.target.value)} rows={3} />
        </div>
      </div>
    </div>
  );
}

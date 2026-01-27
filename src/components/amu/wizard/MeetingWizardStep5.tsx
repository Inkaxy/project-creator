import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUpdateAMUMeeting } from "@/hooks/useAMU";
import { useNavigate } from "react-router-dom";
import type { AMUMeeting } from "@/types/amu";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { CheckCircle, Calendar, MapPin, Users, FileText } from "lucide-react";
import { toast } from "sonner";

interface Props {
  meeting: AMUMeeting;
  onUpdate: () => void;
}

export function MeetingWizardStep5({ meeting, onUpdate }: Props) {
  const navigate = useNavigate();
  const updateMeeting = useUpdateAMUMeeting();
  const participants = meeting.participants || [];
  const items = meeting.agenda_items || [];

  const handleComplete = async () => {
    await updateMeeting.mutateAsync({ id: meeting.id, status: "completed", completed_at: new Date().toISOString() });
    toast.success("Møtet er fullført!");
    navigate("/amu");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Oppsummering</h2>
        <p className="text-muted-foreground">Gjennomgå og fullfør møtet</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" />Dato og tid</div>
          <p className="font-medium">{format(new Date(meeting.meeting_date), "d. MMMM yyyy", { locale: nb })} {meeting.meeting_time?.substring(0, 5)}</p>
        </div>
        <div className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" />Sted</div>
          <p className="font-medium">{meeting.location || "Ikke angitt"}</p>
        </div>
        <div className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" />Deltakere</div>
          <p className="font-medium">{participants.filter(p => p.attendance_status === "attended").length} av {participants.length} deltok</p>
        </div>
        <div className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground"><FileText className="h-4 w-4" />Agendapunkter</div>
          <p className="font-medium">{items.length} punkter</p>
        </div>
      </div>

      {items.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium">Beslutninger</h3>
          {items.filter(i => i.decision).map((item, index) => (
            <div key={item.id} className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">{item.title}</p>
              <p className="font-medium">{item.decision}</p>
            </div>
          ))}
          {!items.some(i => i.decision) && <p className="text-muted-foreground text-sm">Ingen beslutninger registrert</p>}
        </div>
      )}

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button variant="outline" onClick={() => navigate("/amu")}>Lagre som utkast</Button>
        <Button onClick={handleComplete}><CheckCircle className="mr-2 h-4 w-4" />Fullfør møte</Button>
      </div>
    </div>
  );
}

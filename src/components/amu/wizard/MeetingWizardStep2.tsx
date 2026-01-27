import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, UserCheck, UserX } from "lucide-react";
import { useAMUMembers, useAddMeetingParticipant, useUpdateMeetingParticipant, useRemoveMeetingParticipant } from "@/hooks/useAMU";
import type { AMUMeeting, AMUAttendanceStatus } from "@/types/amu";
import { AMU_ATTENDANCE_STATUS_LABELS } from "@/types/amu";

interface Props {
  meeting: AMUMeeting;
  onUpdate: () => void;
}

export function MeetingWizardStep2({ meeting, onUpdate }: Props) {
  const { data: members } = useAMUMembers();
  const addParticipant = useAddMeetingParticipant();
  const updateParticipant = useUpdateMeetingParticipant();
  const removeParticipant = useRemoveMeetingParticipant();
  const [selectedMember, setSelectedMember] = useState<string>("");

  const participants = meeting.participants || [];
  const availableMembers = members?.filter(m => !participants.some(p => p.profile_id === m.profile_id));

  const handleAdd = async () => {
    if (!selectedMember) return;
    await addParticipant.mutateAsync({ meeting_id: meeting.id, profile_id: selectedMember });
    setSelectedMember("");
    onUpdate();
  };

  const handleStatusChange = async (id: string, status: AMUAttendanceStatus) => {
    await updateParticipant.mutateAsync({ id, meeting_id: meeting.id, attendance_status: status });
    onUpdate();
  };

  const handleRemove = async (id: string) => {
    await removeParticipant.mutateAsync({ id, meeting_id: meeting.id });
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Deltakere</h2>
        <p className="text-muted-foreground">Legg til AMU-medlemmer som deltakere</p>
      </div>

      <div className="flex gap-2">
        <Select value={selectedMember} onValueChange={setSelectedMember}>
          <SelectTrigger className="flex-1"><SelectValue placeholder="Velg medlem..." /></SelectTrigger>
          <SelectContent>
            {availableMembers?.map(m => <SelectItem key={m.profile_id} value={m.profile_id}>{m.profile?.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={handleAdd} disabled={!selectedMember}><Plus className="mr-2 h-4 w-4" />Legg til</Button>
      </div>

      <div className="space-y-2">
        {participants.map(p => (
          <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              {p.attendance_status === "attended" ? <UserCheck className="h-5 w-5 text-green-600" /> : <UserX className="h-5 w-5 text-muted-foreground" />}
              <span className="font-medium">{p.profile?.full_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Select value={p.attendance_status} onValueChange={(v) => handleStatusChange(p.id, v as AMUAttendanceStatus)}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(AMU_ATTENDANCE_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => handleRemove(p.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        {participants.length === 0 && <p className="text-center py-8 text-muted-foreground">Ingen deltakere lagt til ennå</p>}
      </div>
    </div>
  );
}

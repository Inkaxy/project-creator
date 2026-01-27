import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useBulkUpdateAgendaItems } from "@/hooks/useAMU";
import type { AMUMeeting, AMUAgendaItem } from "@/types/amu";

interface Props {
  meeting: AMUMeeting;
  onUpdate: () => void;
}

export function MeetingWizardStep3({ meeting, onUpdate }: Props) {
  const [items, setItems] = useState<Partial<AMUAgendaItem>[]>(meeting.agenda_items || []);
  const bulkUpdate = useBulkUpdateAgendaItems();
  const participants = meeting.participants || [];

  const handleAdd = () => setItems([...items, { title: "", sort_order: items.length + 1 }]);
  
  const handleRemove = (index: number) => setItems(items.filter((_, i) => i !== index));
  
  const handleMove = (index: number, dir: "up" | "down") => {
    const newItems = [...items];
    const newIndex = dir === "up" ? index - 1 : index + 1;
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    setItems(newItems);
  };

  const handleSave = async () => {
    await bulkUpdate.mutateAsync({ meeting_id: meeting.id, items });
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Dagsorden</h2>
          <p className="text-muted-foreground">Administrer agendapunkter</p>
        </div>
        <Button onClick={handleSave} disabled={bulkUpdate.isPending}>Lagre endringer</Button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">{index + 1}</div>
            <div className="flex-1">
              <Input value={item.title || ""} onChange={(e) => { const n = [...items]; n[index].title = e.target.value; setItems(n); }} placeholder="Beskrivelse av agendapunkt" />
            </div>
            <Select value={item.responsible_id || "none"} onValueChange={(v) => { const n = [...items]; n[index].responsible_id = v === "none" ? undefined : v; setItems(n); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Ansvarlig" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen</SelectItem>
                {participants.map(p => <SelectItem key={p.profile_id} value={p.profile_id}>{p.profile?.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex flex-col gap-1">
              <Button variant="ghost" size="icon" onClick={() => handleRemove(index)}><Trash2 className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleMove(index, "up")} disabled={index === 0}><ChevronUp className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleMove(index, "down")} disabled={index === items.length - 1}><ChevronDown className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
      <Button variant="outline" onClick={handleAdd}><Plus className="mr-2 h-4 w-4" />Legg til punkt</Button>
    </div>
  );
}

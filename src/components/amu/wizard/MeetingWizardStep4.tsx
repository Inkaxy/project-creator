import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUpdateAMUMeeting, useUpdateAgendaItem } from "@/hooks/useAMU";
import { useToast } from "@/hooks/use-toast";
import { Check, Mic } from "lucide-react";
import type { AMUMeeting } from "@/types/amu";
import { MeetingRecorderPanel } from "./MeetingRecorderPanel";

interface Props {
  meeting: AMUMeeting;
  onUpdate: () => void;
}

export function MeetingWizardStep4({ meeting, onUpdate }: Props) {
  const updateMeeting = useUpdateAMUMeeting();
  const updateItem = useUpdateAgendaItem();
  const { toast } = useToast();
  const items = meeting.agenda_items || [];
  
  // Track which items have AI-generated content
  const [aiGeneratedItems, setAiGeneratedItems] = useState<Set<string>>(new Set());
  
  // Refs for textareas to update their values
  const notesRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const decisionRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const generalNotesRef = useRef<HTMLTextAreaElement | null>(null);

  const handleTranscriptionComplete = async (result: {
    transcription: string;
    notes: Array<{ itemIndex: number; notes: string; decision: string | null }>;
    generalNotes: string;
  }) => {
    const newAiItems = new Set(aiGeneratedItems);

    // Update each agenda item with transcribed notes
    for (const generatedItem of result.notes) {
      const item = items[generatedItem.itemIndex];
      if (item) {
        // Update the textarea values
        if (notesRefs.current[item.id]) {
          notesRefs.current[item.id]!.value = generatedItem.notes;
        }
        if (decisionRefs.current[item.id] && generatedItem.decision) {
          decisionRefs.current[item.id]!.value = generatedItem.decision;
        }
        
        // Save to database
        await updateItem.mutateAsync({
          id: item.id,
          meeting_id: meeting.id,
          notes: generatedItem.notes,
          decision: generatedItem.decision || item.decision,
        });
        
        newAiItems.add(item.id);
      }
    }
    
    // Update general notes
    if (result.generalNotes && generalNotesRef.current) {
      generalNotesRef.current.value = result.generalNotes;
      await updateMeeting.mutateAsync({
        id: meeting.id,
        general_notes: result.generalNotes,
      });
    }
    
    setAiGeneratedItems(newAiItems);
    onUpdate();
    
    toast({
      title: "Møtereferat generert",
      description: "Lydopptaket er transkribert og notater er lagt til.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">Notater</h2>
          <p className="text-muted-foreground">Legg til notater og beslutninger per agendapunkt</p>
        </div>
        
        {/* Meeting Recorder Panel */}
        <MeetingRecorderPanel
          meeting={meeting}
          onTranscriptionComplete={handleTranscriptionComplete}
        />
      </div>

      <div className="space-y-6">
        {items.map((item, index) => (
          <div key={item.id} className="p-4 border rounded-lg space-y-3 relative">
            {aiGeneratedItems.has(item.id) && (
              <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                <Check className="h-3 w-3" />
                AI-generert
              </div>
            )}
            
            <h3 className="font-medium">{index + 1}. {item.title}</h3>
            {item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}
            
            <div className="space-y-2">
              <Label>Notater</Label>
              <Textarea 
                ref={(el) => { notesRefs.current[item.id] = el; }}
                defaultValue={item.notes || ""} 
                onBlur={(e) => { 
                  updateItem.mutate({ id: item.id, meeting_id: meeting.id, notes: e.target.value }); 
                  onUpdate(); 
                }} 
                placeholder="Notater fra diskusjonen..." 
                rows={3} 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Beslutning</Label>
              <Textarea
                ref={(el) => { decisionRefs.current[item.id] = el; }}
                defaultValue={item.decision || ""} 
                onBlur={(e) => { 
                  updateItem.mutate({ id: item.id, meeting_id: meeting.id, decision: e.target.value }); 
                  onUpdate(); 
                }} 
                placeholder="Hva ble besluttet?" 
                rows={2} 
              />
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Ingen agendapunkter å legge til notater for</p>
            <p className="text-sm mt-1">Gå tilbake til "Dagsorden" for å legge til punkter</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Generelle notater</Label>
        <Textarea 
          ref={generalNotesRef}
          defaultValue={meeting.general_notes || ""} 
          onBlur={(e) => { 
            updateMeeting.mutate({ id: meeting.id, general_notes: e.target.value }); 
            onUpdate(); 
          }} 
          placeholder="Generelle notater fra møtet..." 
          rows={4} 
        />
      </div>
    </div>
  );
}

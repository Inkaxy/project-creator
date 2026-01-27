import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUpdateAMUMeeting, useUpdateAgendaItem } from "@/hooks/useAMU";
import { useAMUNotesAI } from "@/hooks/useAMUNotesAI";
import { useToast } from "@/hooks/use-toast";
import { Bot, Sparkles, Wand2, Loader2, Check } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import type { AMUMeeting } from "@/types/amu";

interface Props {
  meeting: AMUMeeting;
  onUpdate: () => void;
}

export function MeetingWizardStep4({ meeting, onUpdate }: Props) {
  const updateMeeting = useUpdateAMUMeeting();
  const updateItem = useUpdateAgendaItem();
  const { isLoading, generateNotes, suggestDecision } = useAMUNotesAI();
  const { toast } = useToast();
  const items = meeting.agenda_items || [];
  
  // Track which items have AI-generated content
  const [aiGeneratedItems, setAiGeneratedItems] = useState<Set<string>>(new Set());
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  
  // Refs for textareas to update their values
  const notesRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const decisionRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const generalNotesRef = useRef<HTMLTextAreaElement | null>(null);

  const handleGenerateAllNotes = async () => {
    if (items.length === 0) {
      toast({
        title: "Ingen agendapunkter",
        description: "Legg til agendapunkter først for å generere notater.",
        variant: "destructive",
      });
      return;
    }

    const agendaItemsForAI = items.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      notes: item.notes,
      decision: item.decision,
    }));

    const meetingContext = {
      title: meeting.title,
      date: format(new Date(meeting.meeting_date), "d. MMMM yyyy", { locale: nb }),
      location: meeting.location,
      generalNotes: meeting.general_notes,
    };

    const result = await generateNotes(agendaItemsForAI, meetingContext);
    
    if (result) {
      // Update each agenda item with generated notes
      const newAiItems = new Set(aiGeneratedItems);
      
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
      
      // Update general notes if provided
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
        title: "Notater generert",
        description: "AI har generert notater for alle agendapunkter.",
      });
    }
  };

  const handleSuggestDecision = async (item: typeof items[0]) => {
    setLoadingItemId(item.id);
    
    const suggestion = await suggestDecision({
      id: item.id,
      title: item.title,
      description: item.description,
      notes: notesRefs.current[item.id]?.value || item.notes,
      decision: item.decision,
    });
    
    if (suggestion && decisionRefs.current[item.id]) {
      decisionRefs.current[item.id]!.value = suggestion;
      await updateItem.mutateAsync({
        id: item.id,
        meeting_id: meeting.id,
        decision: suggestion,
      });
      
      setAiGeneratedItems(prev => new Set(prev).add(item.id));
      onUpdate();
      
      toast({
        title: "Beslutning foreslått",
        description: "AI har foreslått en beslutning basert på notatene.",
      });
    }
    
    setLoadingItemId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Notater</h2>
          <p className="text-muted-foreground">Legg til notater og beslutninger per agendapunkt</p>
        </div>
        
        {/* AI Assistant Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">AI Notatassistent</p>
                <p className="text-xs text-muted-foreground">Generer notater automatisk</p>
              </div>
              <Button 
                onClick={handleGenerateAllNotes}
                disabled={isLoading || items.length === 0}
                size="sm"
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generer alle
              </Button>
            </div>
          </CardContent>
        </Card>
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
              <div className="flex items-center justify-between">
                <Label>Beslutning</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSuggestDecision(item)}
                  disabled={loadingItemId === item.id}
                  className="h-7 text-xs gap-1"
                >
                  {loadingItemId === item.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                  Foreslå med AI
                </Button>
              </div>
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
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
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

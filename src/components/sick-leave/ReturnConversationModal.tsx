import { useState } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Calendar as CalendarIcon, MessageSquare, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SickLeave, useCreateFollowUpEvent } from "@/hooks/useSickLeave";
import { toast } from "sonner";

interface ReturnConversationModalProps {
  sickLeave: SickLeave | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const discussionTopics = [
  { id: "work_capacity", label: "Arbeidsevne og eventuelle begrensninger" },
  { id: "adjustments", label: "Behov for tilrettelegging" },
  { id: "tasks", label: "Arbeidsoppgaver og prioriteringer" },
  { id: "support", label: "Støtte fra leder og kollegaer" },
  { id: "follow_up", label: "Eventuelt videre oppfølgingsbehov" },
];

export function ReturnConversationModal({
  sickLeave,
  open,
  onOpenChange,
}: ReturnConversationModalProps) {
  const [conversationDate, setConversationDate] = useState<Date>(new Date());
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [agreements, setAgreements] = useState("");
  const [needsFollowUp, setNeedsFollowUp] = useState(false);
  
  const createFollowUpEvent = useCreateFollowUpEvent();

  if (!sickLeave) return null;

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleSave = () => {
    const topicLabels = selectedTopics
      .map(id => discussionTopics.find(t => t.id === id)?.label)
      .filter(Boolean);

    const description = [
      "Tilbakekomstsamtale gjennomført",
      "",
      "Temaer diskutert:",
      ...topicLabels.map(t => `- ${t}`),
      "",
      summary ? `Sammendrag:\n${summary}` : "",
      agreements ? `\nAvtaler:\n${agreements}` : "",
      needsFollowUp ? "\n⚠️ Krever videre oppfølging" : "",
    ].filter(Boolean).join("\n");

    createFollowUpEvent.mutate({
      sick_leave_id: sickLeave.id,
      event_type: "return_conversation",
      event_date: format(conversationDate, "yyyy-MM-dd"),
      description,
      participants: { topics: selectedTopics, needs_follow_up: needsFollowUp },
    }, {
      onSuccess: () => {
        toast.success("Tilbakekomstsamtale registrert");
        onOpenChange(false);
        // Reset form
        setSelectedTopics([]);
        setSummary("");
        setAgreements("");
        setNeedsFollowUp(false);
      },
      onError: () => {
        toast.error("Kunne ikke registrere samtalen");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Registrer tilbakekomstsamtale
          </DialogTitle>
          <DialogDescription>
            Dokumenter tilbakekomstsamtalen med {sickLeave.profiles?.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Dato */}
          <div className="space-y-2">
            <Label>Samtaledato</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(conversationDate, "d. MMM yyyy", { locale: nb })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={conversationDate}
                  onSelect={(date) => date && setConversationDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Temaer diskutert */}
          <div className="space-y-3">
            <Label>Temaer diskutert</Label>
            <div className="space-y-2">
              {discussionTopics.map(topic => (
                <div key={topic.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={topic.id}
                    checked={selectedTopics.includes(topic.id)}
                    onCheckedChange={() => toggleTopic(topic.id)}
                  />
                  <label
                    htmlFor={topic.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {topic.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Sammendrag */}
          <div className="space-y-2">
            <Label htmlFor="summary">Sammendrag av samtalen</Label>
            <Textarea
              id="summary"
              placeholder="Beskriv hovedpunkter fra samtalen..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
            />
          </div>

          {/* Avtaler */}
          <div className="space-y-2">
            <Label htmlFor="agreements">Avtaler og tiltak</Label>
            <Textarea
              id="agreements"
              placeholder="Eventuelle avtaler som ble gjort, tilpasninger, etc."
              value={agreements}
              onChange={(e) => setAgreements(e.target.value)}
              rows={2}
            />
          </div>

          {/* Videre oppfølging */}
          <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
            <Checkbox
              id="follow-up"
              checked={needsFollowUp}
              onCheckedChange={(checked) => setNeedsFollowUp(!!checked)}
            />
            <label
              htmlFor="follow-up"
              className="text-sm font-normal cursor-pointer"
            >
              Krever videre oppfølging etter samtalen
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button 
            onClick={handleSave}
            disabled={createFollowUpEvent.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {createFollowUpEvent.isPending ? "Lagrer..." : "Registrer samtale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAMUMeeting, useAMUAgendaTemplates } from "@/hooks/useAMU";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface CreateAMUMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAMUMeetingModal({ open, onOpenChange }: CreateAMUMeetingModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: templates } = useAMUAgendaTemplates();
  const createMeeting = useCreateAMUMeeting();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingDate, setMeetingDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [meetingTime, setMeetingTime] = useState("09:00");
  const [location, setLocation] = useState("");
  const [templateId, setTemplateId] = useState<string>("none");

  const handleSubmit = async () => {
    if (!title || !meetingDate || !user?.id) return;

    const result = await createMeeting.mutateAsync({
      title,
      description: description || undefined,
      meeting_date: meetingDate,
      meeting_time: meetingTime || undefined,
      location: location || undefined,
      template_id: templateId !== "none" ? templateId : undefined,
      created_by: user.id,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setMeetingDate(format(new Date(), "yyyy-MM-dd"));
    setMeetingTime("09:00");
    setLocation("");
    setTemplateId("none");
    onOpenChange(false);

    // Navigate to the meeting wizard
    navigate(`/amu/mote/${result.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Opprett nytt AMU-møte</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Møtetittel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="F.eks. AMU-møte Q1 2026"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kort beskrivelse av møtet..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Dato *</Label>
              <Input
                id="date"
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Tidspunkt</Label>
              <Input
                id="time"
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Sted</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="F.eks. Møterom 1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Agenda-mal</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Velg mal..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen mal</SelectItem>
                {templates?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                    {template.is_default && " (Standard)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Velg en agenda-mal for å automatisk legge til standardpunkter
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={!title || !meetingDate || createMeeting.isPending}>
            {createMeeting.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Opprett møte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

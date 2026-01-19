import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePartnerOrganizations, useCreatePoolShift } from "@/hooks/useCrewshare";
import { useFunctions } from "@/hooks/useFunctions";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePoolShiftModal({ open, onOpenChange }: Props) {
  const { data: partners } = usePartnerOrganizations();
  const { data: functions } = useFunctions();
  const createMutation = useCreatePoolShift();

  const [partnerId, setPartnerId] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [hourlyRate, setHourlyRate] = useState(300);
  const [functionId, setFunctionId] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    createMutation.mutate({
      partner_organization_id: partnerId,
      title,
      description: description || null,
      date,
      start_time: startTime,
      end_time: endTime,
      break_minutes: 30,
      function_id: functionId || null,
      required_certifications: [],
      hourly_rate: hourlyRate,
      location_address: null,
      location_notes: null,
      dress_code: null,
      contact_person: null,
      contact_phone: null,
      status: 'open',
      max_applicants: 10,
      application_deadline: null,
      assigned_employee_id: null,
      assigned_at: null,
      check_in_time: null,
      check_out_time: null,
      hours_worked: null,
      employer_rating: null,
      employer_feedback: null,
      employee_rating: null,
      employee_feedback: null,
    }, {
      onSuccess: () => onOpenChange(false)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Opprett poolvakt</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Partner *</Label>
            <Select value={partnerId} onValueChange={setPartnerId}>
              <SelectTrigger><SelectValue placeholder="Velg partner" /></SelectTrigger>
              <SelectContent>
                {partners?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tittel *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Servitør kveldsvakt" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dato *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Funksjon</Label>
              <Select value={functionId} onValueChange={setFunctionId}>
                <SelectTrigger><SelectValue placeholder="Velg" /></SelectTrigger>
                <SelectContent>
                  {functions?.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Start</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Slutt</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>kr/time</Label>
              <Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Beskrivelse</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <Button onClick={handleCreate} disabled={!partnerId || !title || !date || createMutation.isPending} className="w-full">
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Opprett vakt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

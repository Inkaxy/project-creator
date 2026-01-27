import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCreateAction } from '@/hooks/useConversationActions';
import type { ActionPriority } from '@/types/conversations';

interface ActionItemFormProps {
  conversationId: string;
  employeeId: string;
  managerId: string;
  onClose: () => void;
}

export function ActionItemForm({ conversationId, employeeId, managerId, onClose }: ActionItemFormProps) {
  const createAction = useCreateAction();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [responsibleId, setResponsibleId] = useState(employeeId);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [priority, setPriority] = useState<ActionPriority>('medium');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createAction.mutateAsync({
      conversation_id: conversationId,
      title: title.trim(),
      description: description.trim() || undefined,
      responsible_id: responsibleId,
      due_date: dueDate?.toISOString().split('T')[0],
      priority,
    });

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-muted/50 p-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Nytt handlingspunkt</Label>
        <Button type="button" variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Tittel</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Hva skal gjøres?"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Beskrivelse (valgfritt)</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mer detaljer..."
          rows={2}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Ansvarlig</Label>
          <Select value={responsibleId} onValueChange={setResponsibleId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={employeeId}>Ansatt</SelectItem>
              <SelectItem value={managerId}>Leder</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Prioritet</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as ActionPriority)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Lav</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">Høy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Frist (valgfritt)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !dueDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, 'PPP', { locale: nb }) : 'Velg frist'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              disabled={(date) => date < new Date()}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Avbryt
        </Button>
        <Button type="submit" disabled={createAction.isPending} className="flex-1">
          {createAction.isPending ? 'Lagrer...' : 'Legg til'}
        </Button>
      </div>
    </form>
  );
}

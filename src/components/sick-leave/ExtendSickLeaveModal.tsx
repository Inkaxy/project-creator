import { useState } from "react";
import { format, addDays } from "date-fns";
import { nb } from "date-fns/locale";
import { Calendar as CalendarIcon, RefreshCw } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SickLeave, useUpdateSickLeave } from "@/hooks/useSickLeave";
import { toast } from "sonner";

interface ExtendSickLeaveModalProps {
  sickLeave: SickLeave | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExtendSickLeaveModal({
  sickLeave,
  open,
  onOpenChange,
}: ExtendSickLeaveModalProps) {
  const [newEndDate, setNewEndDate] = useState<Date | undefined>();
  const [newPercentage, setNewPercentage] = useState<number>(100);
  const [notes, setNotes] = useState("");
  
  const updateSickLeave = useUpdateSickLeave();

  if (!sickLeave) return null;

  const currentEndDate = sickLeave.expected_return_date 
    ? new Date(sickLeave.expected_return_date) 
    : new Date();

  const handleExtend = () => {
    if (!newEndDate) {
      toast.error("Velg ny sluttdato");
      return;
    }

    const updatedNotes = [
      sickLeave.notes || '',
      `\n---\nForlenget ${format(new Date(), "d. MMM yyyy", { locale: nb })}: Ny forventet tilbake ${format(newEndDate, "d. MMM yyyy", { locale: nb })}${notes ? `. ${notes}` : ''}`
    ].filter(Boolean).join('');

    updateSickLeave.mutate({
      id: sickLeave.id,
      expected_return_date: format(newEndDate, "yyyy-MM-dd"),
      notes: updatedNotes,
      status: 'extended',
    }, {
      onSuccess: () => {
        toast.success("Sykefravær forlenget");
        onOpenChange(false);
      },
      onError: () => {
        toast.error("Kunne ikke forlenge sykefravær");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Forleng sykefravær
          </DialogTitle>
          <DialogDescription>
            Forleng sykemelding for {sickLeave.profiles?.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nåværende info */}
          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-muted-foreground">Startdato</p>
                <p className="font-medium">
                  {format(new Date(sickLeave.start_date), "d. MMM yyyy", { locale: nb })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Nåværende forventet tilbake</p>
                <p className="font-medium">
                  {sickLeave.expected_return_date 
                    ? format(new Date(sickLeave.expected_return_date), "d. MMM yyyy", { locale: nb })
                    : "Ikke satt"}
                </p>
              </div>
            </div>
          </div>

          {/* Ny sluttdato */}
          <div className="space-y-2">
            <Label>Ny forventet tilbakekomst</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newEndDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newEndDate ? format(newEndDate, "d. MMM yyyy", { locale: nb }) : "Velg ny dato"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={newEndDate}
                  onSelect={setNewEndDate}
                  disabled={(date) => date < currentEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Sykemeldingsgrad */}
          <div className="space-y-2">
            <Label>Sykemeldingsgrad (ved endring)</Label>
            <Select 
              value={newPercentage.toString()} 
              onValueChange={(v) => setNewPercentage(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100%</SelectItem>
                <SelectItem value="80">80%</SelectItem>
                <SelectItem value="60">60%</SelectItem>
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="40">40%</SelectItem>
                <SelectItem value="20">20%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notater */}
          <div className="space-y-2">
            <Label htmlFor="notes">Merknad</Label>
            <Textarea
              id="notes"
              placeholder="Årsak til forlengelse, ny sykemelding mottatt, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button 
            onClick={handleExtend}
            disabled={!newEndDate || updateSickLeave.isPending}
          >
            {updateSickLeave.isPending ? "Lagrer..." : "Forleng sykefravær"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

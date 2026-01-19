import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, AlertTriangle, Clock, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useEmployees } from "@/hooks/useEmployees";
import { useDisciplinaryCategories, useCreateDisciplinaryCase } from "@/hooks/useDisciplinary";
import type { DisciplinarySeverity, WarningType, CreateDisciplinaryCaseInput } from "@/types/disciplinary";

interface CreateDisciplinaryCaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateDisciplinaryCaseModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateDisciplinaryCaseModalProps) {
  const { data: employees = [] } = useEmployees();
  const { data: categories = [] } = useDisciplinaryCategories();
  const createCase = useCreateDisciplinaryCase();

  const [formData, setFormData] = useState<Partial<CreateDisciplinaryCaseInput>>({
    severity: 'low',
    warning_type: 'written_1',
    blocks_clock_in: false,
    blocks_timesheet: false,
  });
  const [incidentDate, setIncidentDate] = useState<Date | undefined>(new Date());
  const [expiryDate, setExpiryDate] = useState<Date | undefined>();

  const handleSubmit = async () => {
    if (!formData.employee_id || !formData.category_id || !incidentDate || !formData.incident_description) {
      return;
    }

    // Generate case number
    const now = new Date();
    const caseNumber = `DISC-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    await createCase.mutateAsync({
      case_number: caseNumber,
      employee_id: formData.employee_id,
      category_id: formData.category_id,
      severity: formData.severity as DisciplinarySeverity,
      incident_date: format(incidentDate, 'yyyy-MM-dd'),
      incident_time: formData.incident_time || null,
      incident_description: formData.incident_description,
      incident_location: formData.incident_location || null,
      warning_type: formData.warning_type as WarningType,
      consequences_description: formData.consequences_description || null,
      improvement_expectations: formData.improvement_expectations || null,
      expiry_date: expiryDate ? format(expiryDate, 'yyyy-MM-dd') : null,
      blocks_clock_in: formData.blocks_clock_in,
      blocks_timesheet: formData.blocks_timesheet,
      block_until_acknowledged: formData.block_until_acknowledged,
    });

    // Reset form
    setFormData({
      severity: 'low',
      warning_type: 'written_1',
      blocks_clock_in: false,
      blocks_timesheet: false,
    });
    setIncidentDate(new Date());
    setExpiryDate(undefined);
    
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Ny disiplinærsak
          </DialogTitle>
          <DialogDescription>
            Opprett en ny sak for oppfølging av ansatt. Saken lagres som utkast til du sender den.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Ansatt */}
          <div className="space-y-2">
            <Label htmlFor="employee">Ansatt *</Label>
            <Select
              value={formData.employee_id || ""}
              onValueChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg ansatt..." />
              </SelectTrigger>
              <SelectContent>
                {employees
                  .filter(e => e.is_active)
                  .map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Hendelsen */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hendelsen
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori *</Label>
                <Select
                  value={formData.category_id || ""}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg kategori..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Alvorlighetsgrad *</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value as DisciplinarySeverity }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Lav</SelectItem>
                    <SelectItem value="medium">🟡 Middels</SelectItem>
                    <SelectItem value="high">🔴 Høy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dato *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {incidentDate ? format(incidentDate, "dd.MM.yyyy") : "Velg dato"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={incidentDate}
                      onSelect={setIncidentDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="incident_time">Klokkeslett</Label>
                <Input
                  id="incident_time"
                  type="time"
                  value={formData.incident_time || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, incident_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="incident_location">Sted</Label>
              <Input
                id="incident_location"
                placeholder="F.eks. Hovedkontoret, Kjøkken..."
                value={formData.incident_location || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, incident_location: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="incident_description">Beskrivelse av hendelsen *</Label>
              <Textarea
                id="incident_description"
                placeholder="Beskriv hva som skjedde så objektivt og konkret som mulig..."
                rows={4}
                value={formData.incident_description || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, incident_description: e.target.value }))}
              />
            </div>
          </div>

          <Separator />

          {/* Tiltak */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Tiltak
            </h4>

            <div className="space-y-2">
              <Label>Type advarsel *</Label>
              <Select
                value={formData.warning_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, warning_type: value as WarningType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verbal">Muntlig advarsel</SelectItem>
                  <SelectItem value="written_1">Skriftlig advarsel 1</SelectItem>
                  <SelectItem value="written_2">Skriftlig advarsel 2</SelectItem>
                  <SelectItem value="final">Endelig advarsel</SelectItem>
                  <SelectItem value="suspension">Suspensjon</SelectItem>
                  <SelectItem value="termination">Oppsigelse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consequences_description">Konsekvenser ved gjentagelse</Label>
              <Textarea
                id="consequences_description"
                placeholder="Beskriv hva som vil skje ved gjentatte tilfeller..."
                rows={2}
                value={formData.consequences_description || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, consequences_description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="improvement_expectations">Forventninger til forbedring</Label>
              <Textarea
                id="improvement_expectations"
                placeholder="Beskriv hva du forventer av den ansatte fremover..."
                rows={2}
                value={formData.improvement_expectations || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, improvement_expectations: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Utløpsdato for advarselen</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, "dd.MM.yyyy") : "Ingen utløpsdato (valgfritt)"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Typisk 1-5 år. Etter utløp kan advarselen ikke brukes som grunnlag for oppsigelse.
              </p>
            </div>
          </div>

          <Separator />

          {/* Blokkering */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Blokkering (til kvittering)
            </h4>
            <p className="text-sm text-muted-foreground">
              Ansatte som ikke har kvittert kan bli blokkert fra å stemple inn eller levere timelister.
            </p>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="blocks_clock_in"
                  checked={formData.blocks_clock_in}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, blocks_clock_in: checked as boolean }))
                  }
                />
                <Label htmlFor="blocks_clock_in" className="font-normal">
                  Blokker innstempling til saken er kvittert
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="blocks_timesheet"
                  checked={formData.blocks_timesheet}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, blocks_timesheet: checked as boolean }))
                  }
                />
                <Label htmlFor="blocks_timesheet" className="font-normal">
                  Blokker timelister til saken er kvittert
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={
              !formData.employee_id || 
              !formData.category_id || 
              !incidentDate || 
              !formData.incident_description ||
              createCase.isPending
            }
          >
            {createCase.isPending ? "Oppretter..." : "Opprett utkast"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

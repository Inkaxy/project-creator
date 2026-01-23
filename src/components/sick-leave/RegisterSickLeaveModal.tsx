import { useState, useEffect } from "react";
import { format, addDays, differenceInDays } from "date-fns";
import { nb } from "date-fns/locale";
import { Calendar as CalendarIcon, User, AlertTriangle, Info } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { useEmployees } from "@/hooks/useEmployees";
import { useCreateSickLeave, SickLeaveType, useSelfCertQuota } from "@/hooks/useSickLeave";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RegisterSickLeaveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedEmployeeId?: string;
}

export function RegisterSickLeaveModal({
  open,
  onOpenChange,
  preselectedEmployeeId,
}: RegisterSickLeaveModalProps) {
  const [employeeId, setEmployeeId] = useState<string>(preselectedEmployeeId || "");
  const [leaveType, setLeaveType] = useState<SickLeaveType>("sykemelding");
  const [sickLeavePercentage, setSickLeavePercentage] = useState<number>(100);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [expectedReturnDate, setExpectedReturnDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");

  const { data: employees = [] } = useEmployees();
  const { data: selfCertQuota } = useSelfCertQuota(employeeId || undefined);
  const createSickLeave = useCreateSickLeave();

  const selectedEmployee = employees.find(e => e.id === employeeId);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setEmployeeId(preselectedEmployeeId || "");
      setLeaveType("sykemelding");
      setSickLeavePercentage(100);
      setStartDate(new Date());
      setEndDate(undefined);
      setExpectedReturnDate(undefined);
      setNotes("");
    }
  }, [open, preselectedEmployeeId]);

  // Beregn frister
  const calculatedDeadlines = {
    employerPeriodEnd: format(addDays(startDate, 15), "d. MMM yyyy", { locale: nb }),
    navTakeover: format(addDays(startDate, 16), "d. MMM yyyy", { locale: nb }),
    followUpPlan: format(addDays(startDate, 28), "d. MMM yyyy", { locale: nb }),
    dialogueMeeting1: format(addDays(startDate, 49), "d. MMM yyyy", { locale: nb }),
    activityRequirement: format(addDays(startDate, 56), "d. MMM yyyy", { locale: nb }),
  };

  const handleSubmit = () => {
    if (!employeeId) {
      toast.error("Velg en ansatt");
      return;
    }

    createSickLeave.mutate({
      employee_id: employeeId,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      leave_type: leaveType,
      sick_leave_percentage: leaveType === "gradert_sykemelding" ? sickLeavePercentage : 100,
      expected_return_date: expectedReturnDate ? format(expectedReturnDate, "yyyy-MM-dd") : undefined,
      notes: notes || undefined,
    }, {
      onSuccess: () => {
        toast.success("Sykefravær registrert");
        onOpenChange(false);
      },
      onError: () => {
        toast.error("Kunne ikke registrere sykefravær");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrer sykefravær</DialogTitle>
          <DialogDescription>
            Registrer nytt sykefravær for en ansatt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Velg ansatt */}
          <div className="space-y-2">
            <Label>Ansatt</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Velg ansatt..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    <div className="flex items-center gap-2">
                      <span>{employee.full_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valgt ansatt-kort med kvote-info */}
          {selectedEmployee && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <AvatarWithInitials
                    name={selectedEmployee.full_name}
                    avatarUrl={selectedEmployee.avatar_url || undefined}
                    className="h-10 w-10"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{selectedEmployee.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEmployee.departments?.name || "Ingen avdeling"}
                    </p>
                  </div>
                </div>
                
                {selfCertQuota && (
                  <div className="mt-3 pt-3 border-t text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Egenmeldingskvote:</span>
                      <span>
                        {selfCertQuota.max_days_per_period - selfCertQuota.days_used} dager igjen 
                        ({selfCertQuota.days_used} brukt av {selfCertQuota.max_days_per_period})
                      </span>
                    </div>
                    {selfCertQuota.max_occurrences_per_period && (
                      <div className="flex justify-between mt-1">
                        <span className="text-muted-foreground">Egenmeldinger brukt:</span>
                        <span>
                          {selfCertQuota.occurrences_used} av {selfCertQuota.max_occurrences_per_period} ganger
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Type fravær */}
          <div className="space-y-2">
            <Label>Type fravær</Label>
            <RadioGroup value={leaveType} onValueChange={(v) => setLeaveType(v as SickLeaveType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="egenmelding" id="egenmelding" />
                <Label htmlFor="egenmelding" className="font-normal">
                  Egenmelding (maks 3 dager)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sykemelding" id="sykemelding" />
                <Label htmlFor="sykemelding" className="font-normal">
                  Sykemelding
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gradert_sykemelding" id="gradert" />
                <Label htmlFor="gradert" className="font-normal">
                  Gradert sykemelding
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="arbeidsrelatert_sykdom" id="arbeidsrelatert" />
                <Label htmlFor="arbeidsrelatert" className="font-normal">
                  Arbeidsrelatert sykdom / yrkesskade
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Sykemeldingsgrad (kun for gradert) */}
          {leaveType === "gradert_sykemelding" && (
            <div className="space-y-2">
              <Label>Sykemeldingsgrad</Label>
              <Select 
                value={sickLeavePercentage.toString()} 
                onValueChange={(v) => setSickLeavePercentage(parseInt(v))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="80">80%</SelectItem>
                  <SelectItem value="60">60%</SelectItem>
                  <SelectItem value="50">50%</SelectItem>
                  <SelectItem value="40">40%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Datoer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Fra dato</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "d. MMM yyyy", { locale: nb }) : "Velg dato"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Til dato (valgfritt)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "d. MMM yyyy", { locale: nb }) : "Velg dato"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < startDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Forventet tilbake</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expectedReturnDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expectedReturnDate ? format(expectedReturnDate, "d. MMM yyyy", { locale: nb }) : "Velg dato"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expectedReturnDate}
                    onSelect={setExpectedReturnDate}
                    disabled={(date) => date < startDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Notater */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notater (valgfritt)</Label>
            <Textarea
              id="notes"
              placeholder="Legg til eventuelle notater..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Automatiske frister */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Automatiske frister som opprettes:</p>
              <ul className="text-sm space-y-1">
                <li>• Arbeidsgiverperiode slutt: <strong>{calculatedDeadlines.employerPeriodEnd}</strong></li>
                <li>• NAV overtar: <strong>{calculatedDeadlines.navTakeover}</strong></li>
                <li>• Oppfølgingsplan frist: <strong>{calculatedDeadlines.followUpPlan}</strong> (4 uker)</li>
                <li>• Dialogmøte 1 frist: <strong>{calculatedDeadlines.dialogueMeeting1}</strong> (7 uker)</li>
                <li>• Aktivitetsplikt: <strong>{calculatedDeadlines.activityRequirement}</strong> (8 uker)</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!employeeId || createSickLeave.isPending}
          >
            {createSickLeave.isPending ? "Registrerer..." : "Registrer sykefravær"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

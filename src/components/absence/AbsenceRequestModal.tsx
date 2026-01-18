import { useState, useMemo } from "react";
import { format, differenceInBusinessDays, addDays, eachDayOfInterval, isWeekend } from "date-fns";
import { nb } from "date-fns/locale";
import { CalendarDays, AlertTriangle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAbsenceTypes } from "@/hooks/useAbsenceTypes";
import { useCreateAbsenceRequest } from "@/hooks/useAbsenceRequests";
import { useEmployeeAccounts, getAvailableBalance, accountTypeLabels } from "@/hooks/useEmployeeAccounts";
import { useShifts } from "@/hooks/useShifts";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface AbsenceRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AbsenceRequestModal = ({ open, onOpenChange }: AbsenceRequestModalProps) => {
  const { user } = useAuth();
  const { data: absenceTypes, isLoading: typesLoading } = useAbsenceTypes();
  const { data: accounts } = useEmployeeAccounts();
  const createRequest = useCreateAbsenceRequest();

  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [comment, setComment] = useState("");
  const [overlappingAction, setOverlappingAction] = useState<"keep" | "delete" | "open">("keep");

  // Get shifts in the selected date range
  const { data: shifts } = useShifts(
    startDate ? format(startDate, "yyyy-MM-dd") : undefined,
    endDate ? format(endDate, "yyyy-MM-dd") : undefined
  );

  const selectedType = useMemo(
    () => absenceTypes?.find((t) => t.id === selectedTypeId),
    [absenceTypes, selectedTypeId]
  );

  // Calculate business days (excluding weekends)
  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    return days.filter((d) => !isWeekend(d)).length;
  }, [startDate, endDate]);

  // Get account balance for selected type
  const relevantAccount = useMemo(() => {
    if (!selectedType?.from_account || !accounts) return undefined;
    return accounts.find((a) => a.account_type === selectedType.from_account);
  }, [selectedType, accounts]);

  const availableBalance = getAvailableBalance(relevantAccount);
  const insufficientBalance = selectedType?.from_account && totalDays > availableBalance;

  // Check for overlapping shifts
  const overlappingShifts = useMemo(() => {
    if (!shifts || !startDate || !endDate || !user) return [];
    return shifts.filter((s) => s.employee_id === user.id);
  }, [shifts, startDate, endDate, user]);

  const handleSubmit = () => {
    if (!selectedTypeId || !startDate || !endDate) return;

    createRequest.mutate(
      {
        absence_type_id: selectedTypeId,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        total_days: totalDays,
        overlapping_shift_action: overlappingShifts.length > 0 ? overlappingAction : undefined,
        comment: comment || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setSelectedTypeId("");
    setStartDate(undefined);
    setEndDate(undefined);
    setComment("");
    setOverlappingAction("keep");
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const canSubmit =
    selectedTypeId &&
    startDate &&
    endDate &&
    totalDays > 0 &&
    !insufficientBalance &&
    !createRequest.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Søk om fravær</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Absence Type */}
          <div className="space-y-2">
            <Label>Type fravær</Label>
            <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Velg fraværstype" />
              </SelectTrigger>
              <SelectContent>
                {absenceTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      {type.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account Balance Info */}
          {selectedType?.from_account && (
            <Alert variant={insufficientBalance ? "destructive" : "default"}>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {accountTypeLabels[selectedType.from_account as keyof typeof accountTypeLabels]}:{" "}
                <strong>{availableBalance}</strong> dager tilgjengelig
                {insufficientBalance && (
                  <span className="block text-destructive mt-1">
                    Du har ikke nok dager på kontoen ({totalDays} ønsket)
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-4">
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
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: nb }) : "Velg dato"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      if (date && (!endDate || date > endDate)) {
                        setEndDate(date);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Til dato</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: nb }) : "Velg dato"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => (startDate ? date < startDate : false)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Days Summary */}
          {startDate && endDate && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              <strong>{totalDays}</strong> virkedager (helger ekskludert)
            </div>
          )}

          {/* Overlapping Shifts Warning */}
          {overlappingShifts.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">
                  Du har {overlappingShifts.length} vakt(er) i denne perioden
                </span>
                <div className="mt-3">
                  <Label className="text-sm">Hva skal skje med vaktene?</Label>
                  <RadioGroup
                    value={overlappingAction}
                    onValueChange={(v) => setOverlappingAction(v as typeof overlappingAction)}
                    className="mt-2 space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="keep" id="keep" />
                      <Label htmlFor="keep" className="font-normal">
                        Behold vaktene (jeg ordner det selv)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="delete" id="delete" />
                      <Label htmlFor="delete" className="font-normal">
                        Slett vaktene
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="open" id="open" />
                      <Label htmlFor="open" className="font-normal">
                        Gjør vaktene ledige (andre kan søke)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Comment */}
          <div className="space-y-2">
            <Label>Kommentar (valgfritt)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Eventuell tilleggsinformasjon..."
              rows={3}
            />
          </div>

          {/* Documentation Warning */}
          {selectedType?.requires_documentation && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Denne fraværstypen krever dokumentasjon. Husk å levere dette til leder.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {createRequest.isPending ? "Sender..." : "Send søknad"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { useState, useMemo } from "react";
import { format, eachDayOfInterval, isWeekend } from "date-fns";
import { nb } from "date-fns/locale";
import { CalendarDays, AlertTriangle, Info, UserPlus } from "lucide-react";
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
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { useAbsenceTypes } from "@/hooks/useAbsenceTypes";
import { useCreateAbsenceRequest } from "@/hooks/useAbsenceRequests";
import { useEmployeeAccounts, getAvailableBalance, accountTypeLabels } from "@/hooks/useEmployeeAccounts";
import { useShifts } from "@/hooks/useShifts";
import { useEmployees, EmployeeProfile } from "@/hooks/useEmployees";
import { cn } from "@/lib/utils";

interface AdminAbsenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedEmployee?: EmployeeProfile;
}

export const AdminAbsenceModal = ({ open, onOpenChange, preselectedEmployee }: AdminAbsenceModalProps) => {
  const { data: absenceTypes, isLoading: typesLoading } = useAbsenceTypes();
  const { data: employees } = useEmployees();
  const createRequest = useCreateAbsenceRequest();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(preselectedEmployee?.id || "");
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [comment, setComment] = useState("");
  const [overlappingAction, setOverlappingAction] = useState<"keep" | "delete" | "open">("keep");
  const [autoApprove, setAutoApprove] = useState(true);

  // Get accounts for selected employee
  const { data: accounts } = useEmployeeAccounts(selectedEmployeeId || undefined);

  // Get shifts in the selected date range
  const { data: shifts } = useShifts(
    startDate ? format(startDate, "yyyy-MM-dd") : undefined,
    endDate ? format(endDate, "yyyy-MM-dd") : undefined
  );

  const selectedEmployee = useMemo(
    () => employees?.find((e) => e.id === selectedEmployeeId),
    [employees, selectedEmployeeId]
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
    if (!shifts || !startDate || !endDate || !selectedEmployeeId) return [];
    return shifts.filter((s) => s.employee_id === selectedEmployeeId);
  }, [shifts, startDate, endDate, selectedEmployeeId]);

  const handleSubmit = () => {
    if (!selectedTypeId || !startDate || !endDate || !selectedEmployeeId) return;

    createRequest.mutate(
      {
        employee_id: selectedEmployeeId,
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
    setSelectedEmployeeId(preselectedEmployee?.id || "");
    setSelectedTypeId("");
    setStartDate(undefined);
    setEndDate(undefined);
    setComment("");
    setOverlappingAction("keep");
    setAutoApprove(true);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const canSubmit =
    selectedEmployeeId &&
    selectedTypeId &&
    startDate &&
    endDate &&
    totalDays > 0 &&
    !insufficientBalance &&
    !createRequest.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Registrer fravær for ansatt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Employee Selection */}
          <div className="space-y-2">
            <Label>Velg ansatt</Label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Velg ansatt" />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    <div className="flex items-center gap-2">
                      <AvatarWithInitials name={emp.full_name} size="sm" />
                      {emp.full_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Show selected employee */}
          {selectedEmployee && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <AvatarWithInitials name={selectedEmployee.full_name} size="md" />
              <div>
                <p className="font-medium">{selectedEmployee.full_name}</p>
                <p className="text-sm text-muted-foreground">{selectedEmployee.email}</p>
              </div>
            </div>
          )}

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
          {selectedType?.from_account && selectedEmployeeId && (
            <Alert variant={insufficientBalance ? "destructive" : "default"}>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {accountTypeLabels[selectedType.from_account as keyof typeof accountTypeLabels]}:{" "}
                <strong>{availableBalance}</strong> dager tilgjengelig
                {insufficientBalance && (
                  <span className="block text-destructive mt-1">
                    Ansatt har ikke nok dager på kontoen ({totalDays} ønsket)
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
                  Ansatt har {overlappingShifts.length} vakt(er) i denne perioden
                </span>
                <div className="mt-3">
                  <Label className="text-sm">Hva skal skje med vaktene?</Label>
                  <RadioGroup
                    value={overlappingAction}
                    onValueChange={(v) => setOverlappingAction(v as typeof overlappingAction)}
                    className="mt-2 space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="keep" id="admin-keep" />
                      <Label htmlFor="admin-keep" className="font-normal">
                        Behold vaktene som de er
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="delete" id="admin-delete" />
                      <Label htmlFor="admin-delete" className="font-normal">
                        Slett vaktene
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="open" id="admin-open" />
                      <Label htmlFor="admin-open" className="font-normal">
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {createRequest.isPending ? "Oppretter..." : "Opprett fravær"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

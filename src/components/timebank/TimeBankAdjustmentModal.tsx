import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Minus, Clock, Banknote } from "lucide-react";
import { useCreateAccountTransaction, useEmployeeAccounts } from "@/hooks/useEmployeeAccounts";
import { toast } from "sonner";

interface TimeBankAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  currentBalance: number;
}

type AdjustmentType = "add" | "subtract";
type ActionType = "adjustment" | "payout" | "deduction";

export function TimeBankAdjustmentModal({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  currentBalance,
}: TimeBankAdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("add");
  const [actionType, setActionType] = useState<ActionType>("adjustment");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const year = new Date().getFullYear();
  const { data: accounts } = useEmployeeAccounts(employeeId, year);
  const createTransaction = useCreateAccountTransaction();

  const timeBankAccount = accounts?.find((a) => a.account_type === "time_bank");

  const handleSubmit = async () => {
    const totalMinutes = (parseInt(hours || "0") * 60) + parseInt(minutes || "0");
    if (totalMinutes <= 0) {
      toast.error("Vennligst angi antall timer/minutter");
      return;
    }

    if (!timeBankAccount) {
      toast.error("Finner ikke tidsbankkonto for denne ansatte");
      return;
    }

    const amount = adjustmentType === "add" ? totalMinutes : -totalMinutes;
    const referenceType = actionType === "adjustment" ? "adjustment" : actionType;

    const actionLabels: Record<ActionType, string> = {
      adjustment: "Manuell justering",
      payout: "Utbetaling",
      deduction: "Lønnstrekk",
    };

    try {
      await createTransaction.mutateAsync({
        account_id: timeBankAccount.id,
        amount: amount,
        description: description || `${actionLabels[actionType]}: ${adjustmentType === "add" ? "+" : "-"}${hours || 0}t ${minutes || 0}m`,
        reference_type: referenceType as "adjustment" | "absence" | "overtime" | "carryover",
        reference_id: null,
      });

      toast.success(`Tidsbank ${adjustmentType === "add" ? "økt" : "redusert"} med ${hours || 0}t ${minutes || 0}m`);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const resetForm = () => {
    setAdjustmentType("add");
    setActionType("adjustment");
    setHours("");
    setMinutes("");
    setDescription("");
    setNotes("");
  };

  const formatBalance = (mins: number): string => {
    const h = Math.floor(Math.abs(mins) / 60);
    const m = Math.abs(mins) % 60;
    const sign = mins < 0 ? "-" : "+";
    return `${sign}${h}t ${m}m`;
  };

  const previewBalance = () => {
    const totalMinutes = (parseInt(hours || "0") * 60) + parseInt(minutes || "0");
    const change = adjustmentType === "add" ? totalMinutes : -totalMinutes;
    return currentBalance + change;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Juster tidsbank
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Employee info */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">{employeeName}</p>
            <p className="text-sm text-muted-foreground">
              Nåværende saldo: <span className={currentBalance >= 0 ? "text-success" : "text-destructive"}>{formatBalance(currentBalance)}</span>
            </p>
          </div>

          {/* Action type */}
          <div className="space-y-2">
            <Label>Type handling</Label>
            <Select value={actionType} onValueChange={(v) => setActionType(v as ActionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="adjustment">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Manuell justering
                  </div>
                </SelectItem>
                <SelectItem value="payout">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-success" />
                    Utbetaling (timer → lønn)
                  </div>
                </SelectItem>
                <SelectItem value="deduction">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-destructive" />
                    Lønnstrekk
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Add/Subtract toggle */}
          <div className="space-y-2">
            <Label>Operasjon</Label>
            <RadioGroup
              value={adjustmentType}
              onValueChange={(v) => setAdjustmentType(v as AdjustmentType)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="add" />
                <Label htmlFor="add" className="flex items-center gap-1 cursor-pointer">
                  <Plus className="h-4 w-4 text-success" />
                  Legg til
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="subtract" id="subtract" />
                <Label htmlFor="subtract" className="flex items-center gap-1 cursor-pointer">
                  <Minus className="h-4 w-4 text-destructive" />
                  Trekk fra
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Time input */}
          <div className="space-y-2">
            <Label>Antall tid</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">t</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="0"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Beskrivelse</Label>
            <Textarea
              placeholder="Valgfri beskrivelse..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Preview */}
          {(hours || minutes) && (
            <div className="p-3 bg-muted/50 rounded-lg border">
              <p className="text-sm text-muted-foreground">Ny saldo etter justering:</p>
              <p className={`text-lg font-semibold ${previewBalance() >= 0 ? "text-success" : "text-destructive"}`}>
                {formatBalance(previewBalance())}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={createTransaction.isPending}>
            {createTransaction.isPending ? "Lagrer..." : "Lagre justering"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

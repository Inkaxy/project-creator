import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock, 
  Plus, 
  Minus, 
  Banknote, 
  RefreshCw, 
  Calendar,
  User
} from "lucide-react";
import { useAccountTransactions } from "@/hooks/useEmployeeAccounts";
import { useEmployees } from "@/hooks/useEmployees";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface TimeBankTransactionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  accountId: string | null;
}

const referenceTypeLabels: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  adjustment: { label: "Manuell justering", icon: RefreshCw, color: "text-blue-500" },
  overtime: { label: "Overtid", icon: Clock, color: "text-purple-500" },
  absence: { label: "Fravær", icon: Calendar, color: "text-orange-500" },
  carryover: { label: "Overført", icon: RefreshCw, color: "text-cyan-500" },
  payout: { label: "Utbetaling", icon: Banknote, color: "text-success" },
  deduction: { label: "Lønnstrekk", icon: Banknote, color: "text-destructive" },
};

export function TimeBankTransactionHistory({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  accountId,
}: TimeBankTransactionHistoryProps) {
  const { data: transactions = [], isLoading } = useAccountTransactions(accountId || "");
  const { data: employees = [] } = useEmployees();

  const getEmployeeName = (userId: string | null): string => {
    if (!userId) return "System";
    const emp = employees.find((e) => e.id === userId);
    return emp?.full_name || "Ukjent";
  };

  const formatMinutes = (mins: number): string => {
    const h = Math.floor(Math.abs(mins) / 60);
    const m = Math.abs(mins) % 60;
    const sign = mins < 0 ? "-" : "+";
    if (h === 0 && m === 0) return "0";
    if (m === 0) return `${sign}${h}t`;
    return `${sign}${h}t ${m}m`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Transaksjonshistorikk
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{employeeName}</p>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Ingen transaksjoner funnet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const typeConfig = referenceTypeLabels[tx.reference_type || "adjustment"] || referenceTypeLabels.adjustment;
                const Icon = typeConfig.icon;
                const isPositive = tx.amount > 0;

                return (
                  <div
                    key={tx.id}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full bg-muted ${typeConfig.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm">{typeConfig.label}</span>
                          <Badge
                            variant="secondary"
                            className={
                              isPositive
                                ? "bg-success/10 text-success font-mono"
                                : "bg-destructive/10 text-destructive font-mono"
                            }
                          >
                            {isPositive ? <Plus className="h-3 w-3 mr-1" /> : <Minus className="h-3 w-3 mr-1" />}
                            {formatMinutes(tx.amount)}
                          </Badge>
                        </div>
                        {tx.description && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {tx.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(tx.created_at), "d. MMM yyyy, HH:mm", { locale: nb })}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {getEmployeeName(tx.created_by)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock, 
  Wallet, 
  Search, 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown,
  History,
  Banknote,
  FileText
} from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { TimeBankAdjustmentModal } from "./TimeBankAdjustmentModal";
import { TimeBankTransactionHistory } from "./TimeBankTransactionHistory";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface EmployeeSummary {
  employeeId: string;
  employeeName: string;
  avatar?: string;
  accountId: string | null;
  balance: number;
  used: number;
  carriedOver: number;
  pendingPayouts: number;
}

export function TimeBankManagementPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummary | null>(null);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [historyEmployee, setHistoryEmployee] = useState<EmployeeSummary | null>(null);

  const year = new Date().getFullYear();
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();

  // Fetch all employee accounts
  const { data: allAccounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ["all-employee-accounts", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_accounts")
        .select("*")
        .eq("year", year)
        .eq("account_type", "time_bank");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch pending payout transactions
  const { data: pendingPayouts = [] } = useQuery({
    queryKey: ["pending-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("account_transactions")
        .select("*, employee_accounts!inner(employee_id)")
        .in("reference_type", ["payout", "deduction"])
        .eq("payout_status", "pending");
      
      if (error) throw error;
      return data;
    },
  });

  const isLoading = loadingEmployees || loadingAccounts;

  // Build employee summaries
  const summaries: EmployeeSummary[] = employees.map((emp) => {
    const account = allAccounts.find((a) => a.employee_id === emp.id);
    const empPayouts = pendingPayouts.filter(
      (p: any) => p.employee_accounts?.employee_id === emp.id
    );

    return {
      employeeId: emp.id,
      employeeName: emp.full_name || "Ukjent",
      avatar: emp.avatar_url || undefined,
      accountId: account?.id || null,
      balance: account ? (account.balance ?? 0) + (account.carried_over ?? 0) - (account.used ?? 0) : 0,
      used: account?.used ?? 0,
      carriedOver: account?.carried_over ?? 0,
      pendingPayouts: empPayouts.reduce((sum: number, p: any) => sum + Math.abs(p.amount || 0), 0),
    };
  });

  // Filter by search
  const filteredSummaries = summaries.filter((s) =>
    s.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalPositive = summaries.filter((s) => s.balance > 0).reduce((sum, s) => sum + s.balance, 0);
  const totalNegative = summaries.filter((s) => s.balance < 0).reduce((sum, s) => sum + s.balance, 0);
  const totalPendingPayouts = summaries.reduce((sum, s) => sum + s.pendingPayouts, 0);

  const formatMinutes = (mins: number): string => {
    const h = Math.floor(Math.abs(mins) / 60);
    const m = Math.abs(mins) % 60;
    const sign = mins < 0 ? "-" : mins > 0 ? "+" : "";
    if (h === 0 && m === 0) return "0t";
    if (m === 0) return `${sign}${h}t`;
    return `${sign}${h}t ${m}m`;
  };

  const handleAdjust = (employee: EmployeeSummary) => {
    setSelectedEmployee(employee);
    setAdjustmentModalOpen(true);
  };

  const handleShowHistory = (employee: EmployeeSummary) => {
    setHistoryEmployee(employee);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Tidsbank-administrasjon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Tidsbank-administrasjon
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-success/10">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total positiv saldo</p>
                <p className="font-semibold text-success">{formatMinutes(totalPositive)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total negativ saldo</p>
                <p className="font-semibold text-destructive">{formatMinutes(totalNegative)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-warning/10">
                <Banknote className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ventende utbetalinger</p>
                <p className="font-semibold">{formatMinutes(totalPendingPayouts)}</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk etter ansatt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ansatt</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Brukt</TableHead>
                  <TableHead className="text-right">Overført</TableHead>
                  <TableHead className="text-right">Ventende</TableHead>
                  <TableHead className="text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSummaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "Ingen ansatte funnet" : "Ingen tidsbank-data"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSummaries.map((summary) => (
                    <TableRow key={summary.employeeId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <AvatarWithInitials name={summary.employeeName} size="sm" />
                          <span className="font-medium">{summary.employeeName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="secondary"
                          className={
                            summary.balance > 0
                              ? "bg-success/10 text-success"
                              : summary.balance < 0
                              ? "bg-destructive/10 text-destructive"
                              : ""
                          }
                        >
                          {formatMinutes(summary.balance)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatMinutes(summary.used)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatMinutes(summary.carriedOver)}
                      </TableCell>
                      <TableCell className="text-right">
                        {summary.pendingPayouts > 0 ? (
                          <Badge variant="outline" className="text-warning border-warning">
                            {formatMinutes(summary.pendingPayouts)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAdjust(summary)}
                            title="Juster saldo"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowHistory(summary)}
                            title="Vis historikk"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Adjustment Modal */}
      {selectedEmployee && (
        <TimeBankAdjustmentModal
          open={adjustmentModalOpen}
          onOpenChange={setAdjustmentModalOpen}
          employeeId={selectedEmployee.employeeId}
          employeeName={selectedEmployee.employeeName}
          currentBalance={selectedEmployee.balance}
        />
      )}

      {/* History Panel */}
      {historyEmployee && (
        <TimeBankTransactionHistory
          open={!!historyEmployee}
          onOpenChange={(open) => !open && setHistoryEmployee(null)}
          employeeId={historyEmployee.employeeId}
          employeeName={historyEmployee.employeeName}
          accountId={historyEmployee.accountId}
        />
      )}
    </>
  );
}

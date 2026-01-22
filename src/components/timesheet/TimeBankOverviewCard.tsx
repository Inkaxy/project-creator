import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, TrendingUp, Wallet } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useEmployeeAccounts, getAvailableBalance, accountTypeLabels } from "@/hooks/useEmployeeAccounts";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface AccountSummary {
  employeeId: string;
  employeeName: string;
  avatar?: string;
  timeBankBalance: number;
  timeBankUsed: number;
  vacationBalance: number;
  vacationUsed: number;
}

export function TimeBankOverviewCard() {
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const year = new Date().getFullYear();

  // Fetch all employee accounts in one query
  const { data: allAccounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ["all-employee-accounts", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_accounts")
        .select("*")
        .eq("year", year);
      
      if (error) throw error;
      return data;
    },
  });

  const isLoading = loadingEmployees || loadingAccounts;

  // Build summary per employee
  const summaries: AccountSummary[] = employees
    .map(emp => {
      const empAccounts = allAccounts.filter(a => a.employee_id === emp.id);
      const timeBank = empAccounts.find(a => a.account_type === "time_bank");
      const vacation = empAccounts.find(a => a.account_type === "vacation");

      return {
        employeeId: emp.id,
        employeeName: emp.full_name || "Ukjent",
        avatar: emp.avatar_url || undefined,
        timeBankBalance: timeBank ? (timeBank.balance ?? 0) + (timeBank.carried_over ?? 0) - (timeBank.used ?? 0) : 0,
        timeBankUsed: timeBank?.used ?? 0,
        vacationBalance: vacation ? (vacation.balance ?? 0) + (vacation.carried_over ?? 0) - (vacation.used ?? 0) : 0,
        vacationUsed: vacation?.used ?? 0,
      };
    })
    .filter(s => s.timeBankBalance !== 0 || s.timeBankUsed !== 0)
    .sort((a, b) => b.timeBankBalance - a.timeBankBalance);

  const totalTimeBank = summaries.reduce((sum, s) => sum + s.timeBankBalance, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4" />
            Tidsbank-oversikt
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (summaries.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4" />
            Tidsbank-oversikt
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-center text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Ingen tidsbank-kontoer funnet</p>
          <p className="text-xs mt-1">Timer legges til når timelister godkjennes</p>
        </CardContent>
      </Card>
    );
  }

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    const sign = minutes < 0 ? "-" : "+";
    if (hours === 0) return `${sign}${mins}m`;
    if (mins === 0) return `${sign}${hours}t`;
    return `${sign}${hours}t ${mins}m`;
  };

  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4" />
            Tidsbank-oversikt
          </CardTitle>
          <Badge variant="secondary" className="font-mono">
            <TrendingUp className="mr-1 h-3 w-3" />
            Total: {formatMinutes(totalTimeBank)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y max-h-[400px] overflow-y-auto">
          {summaries.map(summary => {
            const maxBalance = 480; // 8 hours max for visual scale
            const progressPercent = Math.min(100, (Math.abs(summary.timeBankBalance) / maxBalance) * 100);
            const isNegative = summary.timeBankBalance < 0;

            return (
              <div key={summary.employeeId} className="p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <AvatarWithInitials name={summary.employeeName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">
                        {summary.employeeName}
                      </span>
                      <Badge
                        className={
                          isNegative
                            ? "bg-destructive/10 text-destructive font-mono"
                            : "bg-success/10 text-success font-mono"
                        }
                      >
                        {formatMinutes(summary.timeBankBalance)}
                      </Badge>
                    </div>
                    <div className="mt-1.5">
                      <Progress
                        value={progressPercent}
                        className={`h-1.5 ${isNegative ? "[&>div]:bg-destructive" : "[&>div]:bg-success"}`}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                      <span>Brukt: {formatMinutes(summary.timeBankUsed)}</span>
                      {summary.vacationBalance > 0 && (
                        <span>Ferie: {summary.vacationBalance} dager</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

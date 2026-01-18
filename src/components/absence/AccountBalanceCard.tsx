import { Palmtree, Clock, Moon, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployeeAccounts, getAvailableBalance, accountTypeLabels, EmployeeAccount } from "@/hooks/useEmployeeAccounts";

interface AccountBalanceCardProps {
  employeeId?: string;
  year?: number;
  compact?: boolean;
}

const accountIcons: Record<EmployeeAccount["account_type"], typeof Palmtree> = {
  vacation: Palmtree,
  time_bank: Clock,
  night_bank: Moon,
};

const accountColors: Record<EmployeeAccount["account_type"], string> = {
  vacation: "text-emerald-500",
  time_bank: "text-blue-500",
  night_bank: "text-purple-500",
};

export const AccountBalanceCard = ({ employeeId, year, compact = false }: AccountBalanceCardProps) => {
  const { data: accounts, isLoading } = useEmployeeAccounts(employeeId, year);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className={compact ? "pb-2" : undefined}>
          <CardTitle className={compact ? "text-base" : undefined}>Mine kontoer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Create placeholder accounts if none exist
  const accountTypes: EmployeeAccount["account_type"][] = ["vacation", "time_bank", "night_bank"];
  const displayAccounts = accountTypes.map((type) => {
    const existing = accounts?.find((a) => a.account_type === type);
    return (
      existing || {
        id: type,
        account_type: type,
        balance: 0,
        used: 0,
        carried_over: 0,
      }
    );
  });

  return (
    <Card>
      <CardHeader className={compact ? "pb-2" : undefined}>
        <CardTitle className={compact ? "text-base" : undefined}>Mine kontoer</CardTitle>
      </CardHeader>
      <CardContent className={compact ? "space-y-3" : "space-y-4"}>
        {displayAccounts.map((account) => {
          const Icon = accountIcons[account.account_type];
          const colorClass = accountColors[account.account_type];
          const total = account.balance + account.carried_over;
          const available = getAvailableBalance(account as EmployeeAccount);
          const usedPercent = total > 0 ? (account.used / total) * 100 : 0;

          return (
            <div key={account.account_type} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${colorClass}`} />
                  <span className={compact ? "text-sm font-medium" : "font-medium"}>
                    {accountTypeLabels[account.account_type]}
                  </span>
                </div>
                <span className={compact ? "text-sm" : "text-sm font-medium"}>
                  <span className="text-foreground">{available}</span>
                  <span className="text-muted-foreground"> / {total}</span>
                  {account.account_type === "vacation" ? " dager" : " timer"}
                </span>
              </div>
              <Progress value={usedPercent} className="h-2" />
              {!compact && account.carried_over > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>{account.carried_over} overført fra i fjor</span>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

import { EmployeeAccount, getAvailableBalance, accountTypeLabels } from "@/hooks/useEmployeeAccounts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Moon,
  TrendingUp,
  TrendingDown,
  History,
} from "lucide-react";

interface EmployeeWorkTimeTabProps {
  employeeId: string;
  accounts: EmployeeAccount[];
}

export function EmployeeWorkTimeTab({ employeeId, accounts }: EmployeeWorkTimeTabProps) {
  const vacationAccount = accounts.find(a => a.account_type === "vacation");
  const timeBankAccount = accounts.find(a => a.account_type === "time_bank");
  const nightBankAccount = accounts.find(a => a.account_type === "night_bank");

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "vacation": return <Calendar className="h-4 w-4" />;
      case "time_bank": return <Clock className="h-4 w-4" />;
      case "night_bank": return <Moon className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-success";
    if (balance < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">Kontoer</TabsTrigger>
          <TabsTrigger value="shifts">Vakter</TabsTrigger>
          <TabsTrigger value="absence">Fravær</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4 mt-4">
          {/* Account Cards */}
          <div className="grid gap-4">
            {/* Vacation Account */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">Feriekonto</span>
                  </div>
                  <Badge variant="outline">{new Date().getFullYear()}</Badge>
                </div>
                {vacationAccount ? (
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tildelt</p>
                      <p className="font-medium text-foreground">{vacationAccount.balance} dager</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Brukt</p>
                      <p className="font-medium text-foreground">{vacationAccount.used} dager</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Overført</p>
                      <p className="font-medium text-foreground">{vacationAccount.carried_over} dager</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tilgjengelig</p>
                      <p className={`font-semibold text-lg ${getBalanceColor(getAvailableBalance(vacationAccount))}`}>
                        {getAvailableBalance(vacationAccount)} dager
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Ingen feriekonto registrert</p>
                )}
              </CardContent>
            </Card>

            {/* Time Bank */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">Tidsbank</span>
                  </div>
                </div>
                {timeBankAccount ? (
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-muted-foreground text-sm">Saldo</p>
                      <div className="flex items-center gap-2">
                        {getAvailableBalance(timeBankAccount) > 0 ? (
                          <TrendingUp className="h-5 w-5 text-success" />
                        ) : getAvailableBalance(timeBankAccount) < 0 ? (
                          <TrendingDown className="h-5 w-5 text-destructive" />
                        ) : null}
                        <p className={`font-semibold text-xl ${getBalanceColor(getAvailableBalance(timeBankAccount))}`}>
                          {getAvailableBalance(timeBankAccount) > 0 ? "+" : ""}{getAvailableBalance(timeBankAccount)} timer
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getAvailableBalance(timeBankAccount) > 0 
                          ? "Plusstimer - kan tas ut som avspasering eller utbetales"
                          : getAvailableBalance(timeBankAccount) < 0
                          ? "Minustimer - må jobbes inn"
                          : "Balansert"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Ingen tidsbank registrert</p>
                )}
              </CardContent>
            </Card>

            {/* Night Bank */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Moon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">Nattkonto</span>
                  </div>
                  <Badge variant="outline">For fastlønn</Badge>
                </div>
                {nightBankAccount ? (
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-muted-foreground text-sm">Saldo</p>
                      <div className="flex items-center gap-2">
                        {getAvailableBalance(nightBankAccount) > 0 ? (
                          <TrendingUp className="h-5 w-5 text-success" />
                        ) : getAvailableBalance(nightBankAccount) < 0 ? (
                          <TrendingDown className="h-5 w-5 text-destructive" />
                        ) : null}
                        <p className={`font-semibold text-xl ${getBalanceColor(getAvailableBalance(nightBankAccount))}`}>
                          {getAvailableBalance(nightBankAccount) > 0 ? "+" : ""}{getAvailableBalance(nightBankAccount)} timer
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getAvailableBalance(nightBankAccount) > 0 
                          ? "Ekstra natt-timer utover innbakt"
                          : getAvailableBalance(nightBankAccount) < 0
                          ? "Færre natt-timer enn innbakt - må jobbes inn"
                          : "Balansert"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Ingen nattkonto registrert</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="shifts" className="mt-4">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <History className="h-12 w-12 text-muted-foreground mb-3" />
            <h4 className="font-medium text-foreground">Vakthistorikk</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Se alle planlagte og fullførte vakter her.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="absence" className="mt-4">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
            <h4 className="font-medium text-foreground">Fraværshistorikk</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Se alle fraværsperioder og søknader her.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

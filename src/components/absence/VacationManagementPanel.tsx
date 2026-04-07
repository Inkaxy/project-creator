import { useState } from "react";
import { Palmtree, Search, Edit2, Plus, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { useEmployees } from "@/hooks/useEmployees";
import {
  useEmployeeAccounts,
  useCreateEmployeeAccount,
  useUpdateEmployeeAccount,
  getAvailableBalance,
  EmployeeAccount,
} from "@/hooks/useEmployeeAccounts";
import { useAbsenceRequests } from "@/hooks/useAbsenceRequests";
import { AdminAbsenceModal } from "@/components/absence/AdminAbsenceModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// Hook to fetch all vacation accounts for all employees
const useAllVacationAccounts = (year: number) => {
  return useQuery({
    queryKey: ["all-vacation-accounts", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_accounts")
        .select("*")
        .eq("year", year)
        .eq("account_type", "vacation");

      if (error) throw error;
      return data as EmployeeAccount[];
    },
  });
};

// Hook to fetch all approved vacation absences for a year
const useApprovedVacationsForYear = (year: number) => {
  return useQuery({
    queryKey: ["approved-vacations-year", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("absence_requests")
        .select(`
          *,
          absence_types (id, name, from_account),
          profiles!absence_requests_employee_id_fkey (id, full_name)
        `)
        .eq("status", "approved")
        .gte("start_date", `${year}-01-01`)
        .lte("end_date", `${year}-12-31`);

      if (error) throw error;
      return data;
    },
  });
};

interface EditBalanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  employeeId: string;
  account: EmployeeAccount | null;
  year: number;
}

const EditBalanceModal = ({
  open,
  onOpenChange,
  employeeName,
  employeeId,
  account,
  year,
}: EditBalanceModalProps) => {
  const [balance, setBalance] = useState(account?.balance?.toString() || "25");
  const [carriedOver, setCarriedOver] = useState(account?.carried_over?.toString() || "0");
  const createAccount = useCreateEmployeeAccount();
  const updateAccount = useUpdateEmployeeAccount();

  const handleSave = () => {
    const balanceNum = parseFloat(balance);
    const carriedOverNum = parseFloat(carriedOver);

    if (isNaN(balanceNum) || isNaN(carriedOverNum)) {
      toast.error("Ugyldig verdi");
      return;
    }

    if (account) {
      updateAccount.mutate(
        { id: account.id, balance: balanceNum, carried_over: carriedOverNum },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createAccount.mutate(
        {
          employee_id: employeeId,
          account_type: "vacation",
          year,
          balance: balanceNum,
          used: 0,
          carried_over: carriedOverNum,
        },
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Rediger feriesaldo – {employeeName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Feriedager ({year})</Label>
            <Input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              min={0}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Totalt antall feriedager tildelt for {year}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Overført fra i fjor</Label>
            <Input
              type="number"
              value={carriedOver}
              onChange={(e) => setCarriedOver(e.target.value)}
              min={0}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Ubrukte dager overført fra {year - 1}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleSave}
            disabled={createAccount.isPending || updateAccount.isPending}
          >
            {createAccount.isPending || updateAccount.isPending ? "Lagrer..." : "Lagre"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const VacationManagementPanel = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [search, setSearch] = useState("");
  const [editingEmployee, setEditingEmployee] = useState<{
    id: string;
    name: string;
    account: EmployeeAccount | null;
  } | null>(null);
  const [adminAbsenceOpen, setAdminAbsenceOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const { data: employees, isLoading: employeesLoading } = useEmployees();
  const { data: vacationAccounts, isLoading: accountsLoading } = useAllVacationAccounts(year);
  const { data: approvedVacations } = useApprovedVacationsForYear(year);

  const filteredEmployees = employees?.filter((emp) =>
    emp.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const getAccountForEmployee = (employeeId: string) => {
    return vacationAccounts?.find((a) => a.employee_id === employeeId) || null;
  };

  const getUsedVacationDays = (employeeId: string) => {
    if (!approvedVacations) return 0;
    return approvedVacations
      .filter(
        (v) =>
          v.employee_id === employeeId &&
          v.absence_types?.from_account === "vacation"
      )
      .reduce((sum, v) => sum + (v.total_days || 0), 0);
  };

  const isLoading = employeesLoading || accountsLoading;

  return (
    <div className="space-y-4">
      {/* Header with search and year selector */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk ansatt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setYear(year - 1)}
          >
            {year - 1}
          </Button>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {year}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setYear(year + 1)}
            disabled={year >= currentYear + 1}
          >
            {year + 1}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Palmtree className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {vacationAccounts?.reduce((s, a) => s + a.balance + a.carried_over, 0) || 0}
                </p>
                <p className="text-xs text-muted-foreground">Totalt tildelt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Palmtree className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {vacationAccounts?.reduce((s, a) => s + a.used, 0) || 0}
                </p>
                <p className="text-xs text-muted-foreground">Brukt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Palmtree className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {vacationAccounts?.reduce(
                    (s, a) => s + (a.balance + a.carried_over - a.used),
                    0
                  ) || 0}
                </p>
                <p className="text-xs text-muted-foreground">Gjenstående</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Feriesaldo per ansatt – {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ansatt</TableHead>
                <TableHead className="text-center">Avdeling</TableHead>
                <TableHead className="text-center">Tildelt</TableHead>
                <TableHead className="text-center">Overført</TableHead>
                <TableHead className="text-center">Brukt</TableHead>
                <TableHead className="text-center">Gjenstår</TableHead>
                <TableHead className="text-center">Bruk</TableHead>
                <TableHead className="text-right">Handling</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Laster...
                  </TableCell>
                </TableRow>
              ) : filteredEmployees?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Ingen ansatte funnet
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees?.map((emp) => {
                  const account = getAccountForEmployee(emp.id);
                  const total = (account?.balance || 0) + (account?.carried_over || 0);
                  const used = account?.used || 0;
                  const approvedUsed = getUsedVacationDays(emp.id);
                  const displayUsed = Math.max(used, approvedUsed);
                  const remaining = total - displayUsed;
                  const usedPercent = total > 0 ? (displayUsed / total) * 100 : 0;

                  return (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <AvatarWithInitials name={emp.full_name} size="sm" />
                          <span className="font-medium text-sm">{emp.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {emp.departments?.name || "–"}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {account?.balance ?? "–"}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {account?.carried_over ?? 0}
                      </TableCell>
                      <TableCell className="text-center">{displayUsed}</TableCell>
                      <TableCell className="text-center">
                        {account ? (
                          <Badge
                            variant={remaining <= 0 ? "destructive" : remaining <= 5 ? "secondary" : "default"}
                            className="min-w-[40px] justify-center"
                          >
                            {remaining}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {account ? (
                          <div className="w-16 mx-auto">
                            <Progress value={Math.min(usedPercent, 100)} className="h-2" />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Ikke satt</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Rediger saldo"
                            onClick={() =>
                              setEditingEmployee({
                                id: emp.id,
                                name: emp.full_name,
                                account,
                              })
                            }
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Søk ferie for ansatt"
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setAdminAbsenceOpen(true);
                            }}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit balance modal */}
      {editingEmployee && (
        <EditBalanceModal
          open={!!editingEmployee}
          onOpenChange={(open) => !open && setEditingEmployee(null)}
          employeeName={editingEmployee.name}
          employeeId={editingEmployee.id}
          account={editingEmployee.account}
          year={year}
        />
      )}

      {/* Admin absence modal */}
      <AdminAbsenceModal
        open={adminAbsenceOpen}
        onOpenChange={setAdminAbsenceOpen}
        preselectedEmployee={selectedEmployee}
      />
    </div>
  );
};

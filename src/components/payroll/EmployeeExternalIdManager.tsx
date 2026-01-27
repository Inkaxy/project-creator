import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployeesWithExternalIds, useUpdateEmployeeExternalId } from "@/hooks/useEmployeeExternalIds";
import { toast } from "sonner";
import { Link2, AlertCircle, CheckCircle, Edit2, X, Check } from "lucide-react";
import type { PayrollSystemType } from "@/types/payroll";
import { getSystemDisplayName } from "@/types/payroll";

interface Props {
  systemType: PayrollSystemType;
}

export function EmployeeExternalIdManager({ systemType }: Props) {
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const { data: employees = [], isLoading } = useEmployeesWithExternalIds(systemType);
  const updateExternalId = useUpdateEmployeeExternalId();

  const employeesWithId = employees.filter((e: any) => e.externalId?.external_id);
  const employeesWithoutId = employees.filter((e: any) => !e.externalId?.external_id);

  const handleSave = (employeeId: string) => {
    if (!editValue.trim()) {
      toast.error("Ansattnummer kan ikke være tomt");
      return;
    }
    updateExternalId.mutate(
      { employeeId, systemType, externalId: editValue.trim() },
      { onSuccess: () => setEditingEmployee(null) }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{employees.length}</div>
            <div className="text-sm text-muted-foreground">Totalt ansatte</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{employeesWithId.length}</div>
            <div className="text-sm text-muted-foreground">Med ansattnummer</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{employeesWithoutId.length}</div>
            <div className="text-sm text-muted-foreground">Mangler ansattnummer</div>
          </CardContent>
        </Card>
      </div>

      {/* Warning */}
      {employeesWithoutId.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  {employeesWithoutId.length} ansatte mangler {getSystemDisplayName(systemType)}-nummer
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Disse vil ikke inkluderes i lønnseksport før ansattnummer er registrert.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Ansattnummer for {getSystemDisplayName(systemType)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ansatt</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>{getSystemDisplayName(systemType)}-nummer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee: any) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{employee.full_name}</p>
                      <p className="text-sm text-muted-foreground">{employee.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{employee.employee_type || "ukjent"}</Badge>
                  </TableCell>
                  <TableCell>
                    {editingEmployee === employee.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder="Ansattnummer"
                          className="w-32 h-8"
                          onKeyDown={(e) => e.key === "Enter" && handleSave(employee.id)}
                        />
                        <Button size="sm" variant="ghost" onClick={() => handleSave(employee.id)} disabled={updateExternalId.isPending}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingEmployee(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className={!employee.externalId?.external_id ? "text-muted-foreground" : ""}>
                        {employee.externalId?.external_id || "Ikke satt"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {employee.externalId?.external_id ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Koblet
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Mangler
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingEmployee !== employee.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingEmployee(employee.id);
                          setEditValue(employee.externalId?.external_id || "");
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

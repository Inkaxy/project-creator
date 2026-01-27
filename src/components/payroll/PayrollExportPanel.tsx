import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useCalculatePayrollLines, usePerformPayrollExport } from "@/hooks/usePayrollExport";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { nb } from "date-fns/locale";
import { Download, FileSpreadsheet, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import type { PayrollSystemType, ExportFileFormat, PayrollLineDTO } from "@/types/payroll";
import { getSystemDisplayName, PAYROLL_SYSTEMS } from "@/types/payroll";

interface Props {
  selectedMonth: Date;
}

export function PayrollExportPanel({ selectedMonth }: Props) {
  const [targetSystem, setTargetSystem] = useState<PayrollSystemType>("tripletex");
  const [fileFormat, setFileFormat] = useState<ExportFileFormat>("csv");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const startDate = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
  const endDate = format(endOfMonth(selectedMonth), "yyyy-MM-dd");

  const { data: lines = [], isLoading } = useCalculatePayrollLines(startDate, endDate);
  const performExport = usePerformPayrollExport();

  // Group lines by employee
  const employeeSummaries = useMemo(() => {
    const grouped: Record<string, {
      employeeId: string;
      employeeName: string;
      lines: PayrollLineDTO[];
      totalHours: number;
    }> = {};

    lines.forEach(line => {
      if (!grouped[line.employeeId]) {
        grouped[line.employeeId] = {
          employeeId: line.employeeId,
          employeeName: line.employeeName,
          lines: [],
          totalHours: 0,
        };
      }
      grouped[line.employeeId].lines.push(line);
      if (line.salaryTypeCode === "1000") {
        grouped[line.employeeId].totalHours += line.quantity;
      }
    });

    return Object.values(grouped).sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  }, [lines]);

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const toggleAll = () => {
    if (selectedEmployees.length === employeeSummaries.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employeeSummaries.map(e => e.employeeId));
    }
  };

  const handleExport = () => {
    const linesToExport = selectedEmployees.length > 0
      ? lines.filter(l => selectedEmployees.includes(l.employeeId))
      : lines;

    performExport.mutate({
      targetSystem,
      periodStart: startDate,
      periodEnd: endDate,
      lines: linesToExport,
      format: fileFormat,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Eksporter til lønnssystem
            </CardTitle>
            <CardDescription>
              {format(selectedMonth, "MMMM yyyy", { locale: nb })} • {lines.length} lønnslinjer
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={targetSystem} onValueChange={(v) => setTargetSystem(v as PayrollSystemType)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYROLL_SYSTEMS.filter(s => s.value !== "file_export").slice(0, 2).map(sys => (
                  <SelectItem key={sys.value} value={sys.value}>{sys.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={fileFormat} onValueChange={(v) => setFileFormat(v as ExportFileFormat)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} disabled={lines.length === 0 || performExport.isPending}>
              {performExport.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Eksporter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {employeeSummaries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Ingen godkjente timelister for denne perioden</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedEmployees.length === employeeSummaries.length && employeeSummaries.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Ansatt</TableHead>
                <TableHead className="text-right">Timer</TableHead>
                <TableHead className="text-right">Lønnslinjer</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeSummaries.map((emp) => (
                <TableRow key={emp.employeeId}>
                  <TableCell>
                    <Checkbox
                      checked={selectedEmployees.includes(emp.employeeId)}
                      onCheckedChange={() => toggleEmployee(emp.employeeId)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{emp.employeeName}</TableCell>
                  <TableCell className="text-right">{emp.totalHours.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{emp.lines.length}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Klar
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

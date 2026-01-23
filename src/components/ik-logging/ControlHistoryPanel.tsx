import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  History,
  Search,
  CheckCircle2,
  AlertTriangle,
  Download,
  Eye,
} from "lucide-react";
import { useControlLogs } from "@/hooks/useIKControls";
import { format, subDays } from "date-fns";
import { nb } from "date-fns/locale";

interface ControlHistoryPanelProps {
  departmentId?: string | null;
}

export function ControlHistoryPanel({ departmentId }: ControlHistoryPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("7");
  const [statusFilter, setStatusFilter] = useState("all");

  const dateFrom = subDays(new Date(), parseInt(dateRange)).toISOString().split("T")[0];
  const dateTo = new Date().toISOString().split("T")[0];

  const { data: logs = [], isLoading } = useControlLogs(dateFrom, dateTo, departmentId);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === "" ||
      log.ik_control_templates?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "deviation" && log.has_deviations) ||
      (statusFilter === "ok" && !log.has_deviations);

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Laster historikk...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Søk i kontroller..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Siste 7 dager</SelectItem>
                <SelectItem value="14">Siste 14 dager</SelectItem>
                <SelectItem value="30">Siste 30 dager</SelectItem>
                <SelectItem value="90">Siste 3 måneder</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statuser</SelectItem>
                <SelectItem value="ok">Kun OK</SelectItem>
                <SelectItem value="deviation">Kun avvik</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Eksporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Totalt registrert</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
              <History className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uten avvik</p>
                <p className="text-2xl font-bold text-success">
                  {logs.filter((l) => !l.has_deviations).length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Med avvik</p>
                <p className="text-2xl font-bold text-destructive">
                  {logs.filter((l) => l.has_deviations).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Kontrollhistorikk
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <History className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4">Ingen kontroller funnet for valgt periode.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dato</TableHead>
                  <TableHead>Kontrollpunkt</TableHead>
                  <TableHead>Avdeling</TableHead>
                  <TableHead>Utført av</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Handling</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {format(new Date(log.scheduled_date), "d. MMM", { locale: nb })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.logged_at), "HH:mm")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{log.ik_control_templates?.name}</TableCell>
                    <TableCell>
                      {log.ik_control_templates?.departments ? (
                        <Badge
                          variant="outline"
                          style={{
                            borderColor:
                              log.ik_control_templates.departments.color || undefined,
                          }}
                        >
                          {log.ik_control_templates.departments.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{log.profiles?.full_name}</TableCell>
                    <TableCell>
                      {log.has_deviations ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Avvik
                        </Badge>
                      ) : (
                        <Badge variant="default" className="gap-1 bg-success">
                          <CheckCircle2 className="h-3 w-3" />
                          OK
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

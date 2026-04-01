import { useState, useMemo, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
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
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  Filter,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAllTimeEntries, useApproveTimeEntries, type TimeEntryData } from "@/hooks/useTimeEntries";
import { useTimesheetSettings, calculateDeviations, shouldAutoApprove } from "@/hooks/useTimesheetApproval";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuth } from "@/contexts/AuthContext";
import { useLogAutoApproval, useLogMultipleAutoApprovals } from "@/hooks/useAutoApprovalLog";
import { useDeviationTypes, type DeviationType } from "@/hooks/useDeviationTypes";
import { InlineDeviationEditor, type DeviationLine } from "./InlineDeviationEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface EntryRow extends TimeEntryData {
  employeeName: string;
  employeeAvatar?: string;
  functionName?: string;
  functionColor?: string;
  plannedStart?: string;
  plannedEnd?: string;
  clockedHours: number;
  hasDeviation: boolean;
}

export function TimesheetApprovalPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "deviation">("pending");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [deviationLines, setDeviationLines] = useState<Record<string, DeviationLine[]>>({});
  const [useDeviationToggle, setUseDeviationToggle] = useState<Record<string, boolean>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const today = new Date();
  const currentWeekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

  const { data: entries = [], isLoading } = useAllTimeEntries(
    format(currentWeekStart, "yyyy-MM-dd"),
    format(currentWeekEnd, "yyyy-MM-dd")
  );
  const { data: employees = [] } = useEmployees();
  const { data: settings } = useTimesheetSettings();
  const { data: deviationTypes = [] } = useDeviationTypes();
  const approveEntries = useApproveTimeEntries();
  const logMultipleAutoApprovals = useLogMultipleAutoApprovals();

  // Build flat list of entries with enrichment
  const rows: EntryRow[] = useMemo(() => {
    return entries.map((e) => {
      const emp = employees.find((em) => em.id === e.employee_id);
      const hours =
        e.clock_in && e.clock_out
          ? (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000 -
            e.break_minutes / 60
          : 0;
      const margin = settings?.margin_minutes || 15;
      const hasDeviation = Math.abs(e.deviation_minutes) > margin;

      return {
        ...e,
        employeeName: emp?.full_name || "Ukjent",
        employeeAvatar: emp?.avatar_url || undefined,
        functionName: e.shifts?.functions?.name,
        functionColor: e.shifts?.functions?.color || undefined,
        plannedStart: e.shifts?.planned_start?.slice(0, 5),
        plannedEnd: e.shifts?.planned_end?.slice(0, 5),
        clockedHours: hours,
        hasDeviation,
      };
    }).sort((a, b) => {
      // Pending first, then by date
      if (a.status === "submitted" && b.status !== "submitted") return -1;
      if (a.status !== "submitted" && b.status === "submitted") return 1;
      return a.date.localeCompare(b.date) || a.employeeName.localeCompare(b.employeeName);
    });
  }, [entries, employees, settings]);

  // Filter
  const filteredRows = useMemo(() => {
    if (statusFilter === "pending") return rows.filter((r) => r.status === "submitted");
    if (statusFilter === "deviation") return rows.filter((r) => r.hasDeviation);
    return rows;
  }, [rows, statusFilter]);

  const pendingTotal = rows.filter((r) => r.status === "submitted").length;
  const deviationTotal = rows.filter((r) => r.hasDeviation && r.status === "submitted").length;

  // Selection
  const allPendingIds = filteredRows.filter((r) => r.status === "submitted").map((r) => r.id);
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? allPendingIds : []);
  };

  // Toggle expansion
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Initialize deviation lines if not set
        if (!deviationLines[id]) {
          const entry = rows.find((r) => r.id === id);
          if (entry) {
            const normalType = deviationTypes.find((t) => t.code === "normal");
            const clockIn = entry.clock_in ? format(new Date(entry.clock_in), "HH:mm") : "07:00";
            const clockOut = entry.clock_out ? format(new Date(entry.clock_out), "HH:mm") : "15:00";
            setDeviationLines((prev) => ({
              ...prev,
              [id]: [
                {
                  id: `init-${id}`,
                  deviation_type_id: normalType?.id || "",
                  start_time: clockIn,
                  end_time: clockOut,
                  duration_minutes: 0,
                },
              ],
            }));
          }
        }
      }
      return next;
    });
  };

  // Approve single entry with deviation lines
  const handleApproveWithLines = async (entry: EntryRow) => {
    if (!user?.id) return;
    setSavingIds((prev) => new Set(prev).add(entry.id));

    try {
      const lines = deviationLines[entry.id];
      const useDeviation = useDeviationToggle[entry.id];

      // Save lines to time_entry_lines if using deviation
      if (useDeviation && lines && lines.length > 0) {
        const insertData = lines.map((l) => {
          const dt = deviationTypes.find((t) => t.id === l.deviation_type_id);
          return {
            time_entry_id: entry.id,
            deviation_type_id: l.deviation_type_id,
            start_time: l.start_time + ":00",
            end_time: l.end_time + ":00",
            duration_minutes: l.duration_minutes,
            salary_type_id: dt?.salary_type_id || null,
            created_by: user.id,
          };
        });

        const { error: lineError } = await supabase
          .from("time_entry_lines")
          .insert(insertData);

        if (lineError) throw lineError;

        // Handle time bank lines
        for (const line of lines) {
          const dt = deviationTypes.find((t) => t.id === line.deviation_type_id);
          if (dt?.affects_time_bank && line.duration_minutes > 0) {
            const currentYear = new Date().getFullYear();
            const { data: account } = await supabase
              .from("employee_accounts")
              .select("id")
              .eq("employee_id", entry.employee_id)
              .eq("account_type", "time_bank")
              .eq("year", currentYear)
              .maybeSingle();

            if (account) {
              await supabase.from("account_transactions").insert({
                account_id: account.id,
                amount: line.duration_minutes / 60,
                description: `${dt.name} fra timeliste ${entry.date}`,
                reference_type: "overtime",
                reference_id: entry.id,
                created_by: user.id,
              });
            }
          }
        }
      }

      // Approve the entry
      await approveEntries.mutateAsync({
        timeEntryIds: [entry.id],
        approverId: user.id,
      });

      queryClient.invalidateQueries({ queryKey: ["employee-accounts"] });
      toast.success("Timer godkjent" + (useDeviation ? " med avvikshåndtering" : ""));
    } catch (error: any) {
      toast.error("Kunne ikke godkjenne: " + error.message);
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(entry.id);
        return next;
      });
    }
  };

  // Bulk approve (simple, no deviation lines)
  const handleApproveSelected = async () => {
    if (!user?.id || selectedIds.length === 0) return;

    const selectedEntries = entries.filter((e) => selectedIds.includes(e.id));
    const autoApprovable = selectedEntries.filter((e) =>
      shouldAutoApprove(Math.abs(e.deviation_minutes), settings)
    );

    if (autoApprovable.length > 0) {
      try {
        await logMultipleAutoApprovals.mutateAsync(
          autoApprovable.map((e) => ({
            timeEntryId: e.id,
            employeeId: e.employee_id,
            approverId: user.id,
            deviationMinutes: e.deviation_minutes,
          }))
        );
      } catch {}
    }

    await approveEntries.mutateAsync({
      timeEntryIds: selectedIds,
      approverId: user.id,
    });
    setSelectedIds([]);
  };

  const weekNumber = format(currentWeekStart, "w");

  const getStatusBadge = (entry: EntryRow) => {
    if (entry.status === "approved") return <Badge className="bg-success/10 text-success border-success/30">Godkjent</Badge>;
    if (entry.status === "rejected") return <Badge variant="destructive">Avvist</Badge>;
    if (entry.status === "draft") return <Badge variant="secondary">Kladd</Badge>;
    if (entry.hasDeviation) return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border-amber-500">Avvik</Badge>;
    return <Badge className="bg-primary/10 text-primary border-primary/30">Venter</Badge>;
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Godkjenning av timer
            </CardTitle>
            {pendingTotal > 0 && (
              <Badge className="bg-primary text-primary-foreground">
                {pendingTotal} venter
              </Badge>
            )}
            {deviationTotal > 0 && (
              <Badge className="bg-warning text-warning-foreground">
                <AlertTriangle className="mr-1 h-3 w-3" />
                {deviationTotal} avvik
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <Button size="sm" onClick={handleApproveSelected} disabled={approveEntries.isPending}>
                {approveEntries.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Godkjenn valgte ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Navigation and filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setWeekOffset((o) => o - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)} className="min-w-[160px]">
              <Calendar className="mr-2 h-4 w-4" />
              Uke {weekNumber}: {format(currentWeekStart, "d. MMM", { locale: nb })} - {format(currentWeekEnd, "d. MMM", { locale: nb })}
            </Button>
            <Button variant="outline" size="icon" onClick={() => setWeekOffset((o) => o + 1)} disabled={weekOffset >= 0}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-[150px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="pending">Kun ventende</SelectItem>
              <SelectItem value="deviation">Med avvik</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List-based approval table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectedIds.length === allPendingIds.length && allPendingIds.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Dato</TableHead>
                <TableHead>Medarbeider</TableHead>
                <TableHead>Funksjon</TableHead>
                <TableHead>Vaktplan</TableHead>
                <TableHead>Stemplet</TableHead>
                <TableHead className="text-right">Lengde</TableHead>
                <TableHead className="text-right">Avvik</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="text-muted-foreground">Laster timelister...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="h-8 w-8 text-success" />
                      <span className="text-muted-foreground">
                        {statusFilter === "pending"
                          ? "Ingen timelister venter på godkjenning"
                          : "Ingen timelister for denne uken"}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((entry) => {
                  const isExpanded = expandedRows.has(entry.id);
                  const isPending = entry.status === "submitted";
                  const clockInTime = entry.clock_in ? format(new Date(entry.clock_in), "HH:mm") : "—";
                  const clockOutTime = entry.clock_out ? format(new Date(entry.clock_out), "HH:mm") : "—";
                  const isSaving = savingIds.has(entry.id);

                  return (
                    <Fragment key={entry.id}>
                      <TableRow
                        className={cn(
                          "hover:bg-muted/50 transition-colors",
                          entry.hasDeviation && isPending && "bg-amber-50/50 dark:bg-amber-950/20"
                        )}
                      >
                        <TableCell>
                          {isPending && (
                            <Checkbox
                              checked={selectedIds.includes(entry.id)}
                              onCheckedChange={(c) =>
                                setSelectedIds((p) =>
                                  c ? [...p, entry.id] : p.filter((i) => i !== entry.id)
                                )
                              }
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {isPending && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleRow(entry.id)}>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {format(new Date(entry.date + "T00:00"), "EEE d. MMM", { locale: nb })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <AvatarWithInitials name={entry.employeeName} size="sm" />
                            <span className="font-medium text-sm">{entry.employeeName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {entry.functionName ? (
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: entry.functionColor || undefined,
                                color: entry.functionColor || undefined,
                              }}
                            >
                              {entry.functionName}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm whitespace-nowrap">
                          {entry.plannedStart && entry.plannedEnd
                            ? `${entry.plannedStart}–${entry.plannedEnd}`
                            : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-sm whitespace-nowrap">
                          {clockInTime}–{clockOutTime}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {entry.clockedHours.toFixed(1)}t
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.deviation_minutes !== 0 ? (
                            <span
                              className={cn(
                                "font-mono text-sm font-medium",
                                entry.deviation_minutes > 0 ? "text-success" : "text-destructive"
                              )}
                            >
                              {entry.deviation_minutes > 0 ? "+" : ""}
                              {entry.deviation_minutes}m
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">0</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(entry)}</TableCell>
                        <TableCell>
                          {isPending && !entry.hasDeviation && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handleApproveWithLines(entry)}
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              )}
                              Godkjenn
                            </Button>
                          )}
                          {isPending && entry.hasDeviation && !isExpanded && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-amber-500 text-amber-700 dark:text-amber-300"
                              onClick={() => toggleRow(entry.id)}
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Håndter
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Expanded deviation editor */}
                      {isExpanded && (
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={11} className="p-4">
                            <div className="space-y-3 max-w-3xl">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium">Benytt avvik</span>
                                <Switch
                                  checked={useDeviationToggle[entry.id] ?? entry.hasDeviation}
                                  onCheckedChange={(v) =>
                                    setUseDeviationToggle((p) => ({ ...p, [entry.id]: v }))
                                  }
                                />
                              </div>

                              {(useDeviationToggle[entry.id] ?? entry.hasDeviation) && (
                                <InlineDeviationEditor
                                  clockIn={clockInTime}
                                  clockOut={clockOutTime}
                                  deviationTypes={deviationTypes}
                                  lines={
                                    deviationLines[entry.id] || [
                                      {
                                        id: `init-${entry.id}`,
                                        deviation_type_id:
                                          deviationTypes.find((t) => t.code === "normal")?.id || "",
                                        start_time: clockInTime,
                                        end_time: clockOutTime,
                                        duration_minutes: 0,
                                      },
                                    ]
                                  }
                                  onChange={(lines) =>
                                    setDeviationLines((p) => ({ ...p, [entry.id]: lines }))
                                  }
                                />
                              )}

                              <div className="flex justify-end gap-2 pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleRow(entry.id)}
                                >
                                  Avbryt
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveWithLines(entry)}
                                  disabled={isSaving}
                                >
                                  {isSaving ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                  )}
                                  Godkjenn med avvik
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-primary/10 border border-primary/30" />
            <span>Venter godkjenning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-500" />
            <span>Avvik – klikk for å håndtere</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-success/10 border border-success/30" />
            <span>Godkjent</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

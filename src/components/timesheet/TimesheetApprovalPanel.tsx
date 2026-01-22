import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  Filter,
  Loader2,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval, isSameDay } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAllTimeEntries, useApproveTimeEntries, type TimeEntryData } from "@/hooks/useTimeEntries";
import { useTimesheetSettings, calculateDeviations, shouldAutoApprove } from "@/hooks/useTimesheetApproval";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuth } from "@/contexts/AuthContext";
import { DeviationHandlerModal } from "./DeviationHandlerModal";

interface GroupedEntry {
  employee: {
    id: string;
    name: string;
    avatar?: string;
  };
  entries: Map<string, TimeEntryData | null>; // date -> entry
  totalHours: number;
  totalDeviation: number;
  pendingCount: number;
}

export function TimesheetApprovalPanel() {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "deviation">("pending");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deviationModal, setDeviationModal] = useState<{
    open: boolean;
    entry: TimeEntryData | null;
    deviations: Array<{ type: string; minutes: number; label: string }>;
  }>({ open: false, entry: null, deviations: [] });

  // Calculate week range
  const today = new Date();
  const currentWeekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });

  // Fetch data
  const { data: entries = [], isLoading } = useAllTimeEntries(
    format(currentWeekStart, "yyyy-MM-dd"),
    format(currentWeekEnd, "yyyy-MM-dd")
  );
  const { data: employees = [] } = useEmployees();
  const { data: settings } = useTimesheetSettings();
  const approveEntries = useApproveTimeEntries();

  // Group entries by employee
  const groupedData = useMemo(() => {
    const groups = new Map<string, GroupedEntry>();

    // Initialize groups for all employees that have entries
    const employeesWithEntries = new Set(entries.map(e => e.employee_id));
    
    employeesWithEntries.forEach(empId => {
      const emp = employees.find(e => e.id === empId);
      if (!emp) return;

      const employeeEntries = entries.filter(e => e.employee_id === empId);
      const entriesByDate = new Map<string, TimeEntryData | null>();
      
      weekDays.forEach(day => {
        const dateStr = format(day, "yyyy-MM-dd");
        const entry = employeeEntries.find(e => e.date === dateStr) || null;
        entriesByDate.set(dateStr, entry);
      });

      const totalHours = employeeEntries.reduce((sum, e) => {
        if (!e.clock_in || !e.clock_out) return sum;
        const hours = (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000;
        return sum + hours - (e.break_minutes / 60);
      }, 0);

      const totalDeviation = employeeEntries.reduce((sum, e) => sum + e.deviation_minutes, 0);
      const pendingCount = employeeEntries.filter(e => e.status === "submitted").length;

      groups.set(empId, {
        employee: {
          id: empId,
          name: emp.full_name || "Ukjent",
          avatar: emp.avatar_url || undefined,
        },
        entries: entriesByDate,
        totalHours,
        totalDeviation,
        pendingCount,
      });
    });

    // Filter based on status
    let filtered = Array.from(groups.values());
    
    if (statusFilter === "pending") {
      filtered = filtered.filter(g => g.pendingCount > 0);
    } else if (statusFilter === "deviation") {
      filtered = filtered.filter(g => Math.abs(g.totalDeviation) > 15);
    }

    return filtered.sort((a, b) => b.pendingCount - a.pendingCount);
  }, [entries, employees, weekDays, statusFilter]);

  // Get all pending entries for bulk approve
  const allPendingEntries = entries.filter(e => e.status === "submitted");

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(allPendingEntries.map(e => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleApproveSelected = async () => {
    if (!user?.id || selectedIds.length === 0) return;
    await approveEntries.mutateAsync({
      timeEntryIds: selectedIds,
      approverId: user.id,
    });
    setSelectedIds([]);
  };

  const handleCellClick = (entry: TimeEntryData | null) => {
    if (!entry || entry.status !== "submitted") return;

    // Calculate detailed deviations
    if (entry.clock_in && entry.clock_out && entry.shifts) {
      const clockIn = new Date(entry.clock_in);
      const clockOut = new Date(entry.clock_out);
      const result = calculateDeviations(
        clockIn,
        clockOut,
        entry.shifts.planned_start,
        entry.shifts.planned_end,
        entry.date,
        entry.break_minutes,
        entry.shifts.planned_break_minutes || 0
      );

      // If deviation > margin, show handler modal
      if (Math.abs(entry.deviation_minutes) > (settings?.margin_minutes || 15)) {
        setDeviationModal({
          open: true,
          entry,
          deviations: result.deviations,
        });
        return;
      }
    }

    // Otherwise just approve directly
    if (user?.id) {
      approveEntries.mutate({
        timeEntryIds: [entry.id],
        approverId: user.id,
      });
    }
  };

  const getEntryCellContent = (entry: TimeEntryData | null, dateStr: string) => {
    if (!entry) {
      return (
        <div className="text-center text-muted-foreground text-sm">
          —
        </div>
      );
    }

    const status = entry.status;
    const hasDeviation = Math.abs(entry.deviation_minutes) > (settings?.margin_minutes || 15);
    const isSelected = selectedIds.includes(entry.id);

    // Calculate hours
    const hours = entry.clock_in && entry.clock_out
      ? (new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()) / 3600000 - (entry.break_minutes / 60)
      : 0;

    // Time display
    const timeDisplay = entry.clock_in && entry.clock_out
      ? `${format(new Date(entry.clock_in), "HH:mm")}-${format(new Date(entry.clock_out), "HH:mm")}`
      : entry.clock_in
      ? `${format(new Date(entry.clock_in), "HH:mm")}-...`
      : "-";

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "p-2 rounded-md text-center cursor-pointer transition-all text-sm",
              status === "approved" && "bg-success/10 text-success",
              status === "rejected" && "bg-destructive/10 text-destructive",
              status === "submitted" && !hasDeviation && "bg-primary/10 text-primary hover:bg-primary/20",
              status === "submitted" && hasDeviation && "bg-warning/20 text-warning-foreground border-2 border-warning hover:bg-warning/30",
              status === "draft" && "bg-muted text-muted-foreground",
              isSelected && "ring-2 ring-primary"
            )}
            onClick={() => handleCellClick(entry)}
          >
            <div className="font-medium">{timeDisplay}</div>
            <div className="text-xs opacity-75">{hours.toFixed(1)}t</div>
            {hasDeviation && status === "submitted" && (
              <div className="flex items-center justify-center gap-1 mt-1">
                <AlertTriangle className="h-3 w-3" />
                <span className="text-xs">
                  {entry.deviation_minutes > 0 ? "+" : ""}{entry.deviation_minutes}m
                </span>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-sm">
            <p><strong>Planlagt:</strong> {entry.shifts?.planned_start?.slice(0,5)}-{entry.shifts?.planned_end?.slice(0,5)}</p>
            <p><strong>Faktisk:</strong> {timeDisplay}</p>
            <p><strong>Pause:</strong> {entry.break_minutes} min</p>
            {entry.deviation_minutes !== 0 && (
              <p className={entry.deviation_minutes > 0 ? "text-warning" : "text-destructive"}>
                <strong>Avvik:</strong> {entry.deviation_minutes > 0 ? "+" : ""}{entry.deviation_minutes} min
              </p>
            )}
            <p><strong>Status:</strong> {
              status === "submitted" ? "Venter godkjenning" :
              status === "approved" ? "Godkjent" :
              status === "rejected" ? "Avvist" : "Kladd"
            }</p>
            {status === "submitted" && (
              <p className="text-xs text-muted-foreground mt-2">Klikk for å {hasDeviation ? "håndtere avvik" : "godkjenne"}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  const weekNumber = format(currentWeekStart, "w");
  const pendingTotal = allPendingEntries.length;
  const deviationTotal = entries.filter(e => Math.abs(e.deviation_minutes) > 15).length;

  return (
    <>
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
                <Button
                  size="sm"
                  onClick={handleApproveSelected}
                  disabled={approveEntries.isPending}
                >
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
          {/* Filters and week navigation */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setWeekOffset(o => o - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekOffset(0)}
                className="min-w-[160px]"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Uke {weekNumber}: {format(currentWeekStart, "d. MMM", { locale: nb })} - {format(currentWeekEnd, "d. MMM", { locale: nb })}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setWeekOffset(o => o + 1)}
                disabled={weekOffset >= 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="pending">Kun ventende</SelectItem>
                  <SelectItem value="deviation">Med avvik</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Week grid */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedIds.length === allPendingEntries.length && allPendingEntries.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="min-w-[180px]">Ansatt</TableHead>
                  {weekDays.map(day => (
                    <TableHead key={day.toISOString()} className="text-center min-w-[100px]">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground">
                          {format(day, "EEE", { locale: nb })}
                        </span>
                        <span className={cn(
                          "font-medium",
                          isSameDay(day, today) && "text-primary"
                        )}>
                          {format(day, "d")}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center min-w-[80px]">Sum</TableHead>
                  <TableHead className="text-center min-w-[80px]">Avvik</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="text-muted-foreground">Laster timelister...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : groupedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
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
                  groupedData.map(group => {
                    const hasAnyPending = Array.from(group.entries.values()).some(e => e?.status === "submitted");
                    
                    return (
                      <TableRow key={group.employee.id} className="hover:bg-muted/50">
                        <TableCell>
                          {hasAnyPending && (
                            <Checkbox
                              checked={Array.from(group.entries.values())
                                .filter(e => e?.status === "submitted")
                                .every(e => e && selectedIds.includes(e.id))}
                              onCheckedChange={(checked) => {
                                const pendingIds = Array.from(group.entries.values())
                                  .filter(e => e?.status === "submitted")
                                  .map(e => e!.id);
                                if (checked) {
                                  setSelectedIds(prev => [...new Set([...prev, ...pendingIds])]);
                                } else {
                                  setSelectedIds(prev => prev.filter(id => !pendingIds.includes(id)));
                                }
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <AvatarWithInitials name={group.employee.name} size="sm" />
                            <div>
                              <span className="font-medium">{group.employee.name}</span>
                              {group.pendingCount > 0 && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  {group.pendingCount} venter
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        {weekDays.map(day => {
                          const dateStr = format(day, "yyyy-MM-dd");
                          const entry = group.entries.get(dateStr) || null;
                          return (
                            <TableCell key={dateStr} className="p-1">
                              {getEntryCellContent(entry, dateStr)}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-mono">
                            {group.totalHours.toFixed(1)}t
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {group.totalDeviation !== 0 && (
                            <Badge
                              className={cn(
                                "font-mono",
                                group.totalDeviation > 0 
                                  ? "bg-success/10 text-success" 
                                  : "bg-destructive/10 text-destructive"
                              )}
                            >
                              {group.totalDeviation > 0 ? (
                                <TrendingUp className="mr-1 h-3 w-3" />
                              ) : (
                                <TrendingDown className="mr-1 h-3 w-3" />
                              )}
                              {group.totalDeviation > 0 ? "+" : ""}{group.totalDeviation}m
                            </Badge>
                          )}
                          {group.totalDeviation === 0 && (
                            <Minus className="h-4 w-4 mx-auto text-muted-foreground" />
                          )}
                        </TableCell>
                      </TableRow>
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
              <div className="w-4 h-4 rounded bg-warning/20 border-2 border-warning" />
              <span>Avvik (klikk for å håndtere)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-success/10 border border-success/30" />
              <span>Godkjent</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-destructive/10 border border-destructive/30" />
              <span>Avvist</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deviation handler modal */}
      {deviationModal.entry && (
        <DeviationHandlerModal
          open={deviationModal.open}
          onOpenChange={(open) => setDeviationModal({ ...deviationModal, open })}
          timeEntryId={deviationModal.entry.id}
          employeeId={deviationModal.entry.employee_id}
          employeeName={deviationModal.entry.profiles?.full_name || "Ukjent"}
          date={deviationModal.entry.date}
          totalDeviationMinutes={deviationModal.entry.deviation_minutes}
          deviations={deviationModal.deviations}
          onApprove={() => {
            if (user?.id && deviationModal.entry) {
              approveEntries.mutate({
                timeEntryIds: [deviationModal.entry.id],
                approverId: user.id,
              });
            }
          }}
        />
      )}
    </>
  );
}

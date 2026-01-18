import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAllTimeEntries,
  useApproveTimeEntries,
  useRejectTimeEntry,
  useSubmitTimesheet,
  type TimeEntryData,
} from "@/hooks/useTimeEntries";
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from "date-fns";
import { nb } from "date-fns/locale";
import {
  Download,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig = {
  draft: { label: "Kladd", className: "bg-muted text-muted-foreground" },
  submitted: { label: "Venter", className: "bg-primary-light text-primary" },
  approved: { label: "Godkjent", className: "bg-success-light text-success" },
  rejected: { label: "Avvist", className: "bg-destructive/10 text-destructive" },
};

export default function TimesheetsPage() {
  const { user, isAdminOrManager } = useAuth();
  const isManager = isAdminOrManager();

  // Week navigation
  const [weekOffset, setWeekOffset] = useState(0);
  const today = new Date();
  const currentWeekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const startDate = format(currentWeekStart, "yyyy-MM-dd");
  const endDate = format(currentWeekEnd, "yyyy-MM-dd");

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");

  // Data
  const { data: entries, isLoading } = useAllTimeEntries(startDate, endDate);
  const approveEntries = useApproveTimeEntries();
  const rejectEntry = useRejectTimeEntry();
  const submitTimesheet = useSubmitTimesheet();

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Reject dialog
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; entry: TimeEntryData | null }>({
    open: false,
    entry: null,
  });
  const [rejectReason, setRejectReason] = useState("");

  // Filter entries
  const filteredEntries = entries?.filter((entry) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "deviation") return Math.abs(entry.deviation_minutes) > 15;
    return entry.status === statusFilter;
  }) || [];

  // Calculate totals
  const totalHours = filteredEntries.reduce((sum, entry) => {
    if (!entry.clock_in || !entry.clock_out) return sum;
    const start = new Date(entry.clock_in);
    const end = new Date(entry.clock_out);
    return sum + (end.getTime() - start.getTime()) / 3600000 - (entry.break_minutes / 60);
  }, 0);

  const nightHours = filteredEntries.reduce((sum, entry) => {
    if (!entry.clock_in || !entry.clock_out) return sum;
    // Simplified: count hours if shift is between 21:00 and 06:00
    const clockIn = new Date(entry.clock_in);
    const hour = clockIn.getHours();
    if (hour >= 21 || hour < 6) {
      const start = new Date(entry.clock_in);
      const end = new Date(entry.clock_out);
      return sum + (end.getTime() - start.getTime()) / 3600000 - (entry.break_minutes / 60);
    }
    return sum;
  }, 0);

  const deviationCount = filteredEntries.filter((e) => Math.abs(e.deviation_minutes) > 15).length;
  const pendingCount = filteredEntries.filter((e) => e.status === "submitted").length;

  // Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredEntries.map((e) => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
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

  const handleReject = async () => {
    if (!rejectDialog.entry?.id || !rejectReason.trim()) return;
    await rejectEntry.mutateAsync({
      timeEntryId: rejectDialog.entry.id,
      managerNotes: rejectReason,
    });
    setRejectDialog({ open: false, entry: null });
    setRejectReason("");
  };

  const handleSubmitDrafts = async () => {
    const draftIds = filteredEntries
      .filter((e) => e.status === "draft" && e.clock_out)
      .map((e) => e.id);
    if (draftIds.length === 0) return;
    await submitTimesheet.mutateAsync(draftIds);
  };

  const getDeviationBadge = (minutes: number) => {
    const absMinutes = Math.abs(minutes);
    if (absMinutes <= 5) return null;
    if (absMinutes <= 15) {
      return (
        <Badge className="bg-warning-light text-warning">
          {minutes > 0 ? "+" : ""}{minutes}m
        </Badge>
      );
    }
    return (
      <Badge className="bg-destructive/10 text-destructive">
        <AlertTriangle className="mr-1 h-3 w-3" />
        {minutes > 0 ? "+" : ""}{minutes}m
      </Badge>
    );
  };

  const weekNumber = format(currentWeekStart, "w");

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 pl-12 sm:flex-row sm:items-center sm:justify-between lg:pl-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Timelister</h1>
            <p className="text-muted-foreground">
              Uke {weekNumber}, {format(currentWeekStart, "d. MMM", { locale: nb })} - {format(currentWeekEnd, "d. MMM yyyy", { locale: nb })}
            </p>
          </div>
          <div className="flex gap-2">
            {!isManager && (
              <Button 
                variant="outline" 
                onClick={handleSubmitDrafts}
                disabled={submitTimesheet.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                Send til godkjenning
              </Button>
            )}
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Eksporter
            </Button>
            {isManager && selectedIds.length > 0 && (
              <Button 
                onClick={handleApproveSelected}
                disabled={approveEntries.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Godkjenn valgte ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Week navigation */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setWeekOffset((o) => o - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setWeekOffset(0)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Denne uken
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setWeekOffset((o) => o + 1)}
                  disabled={weekOffset >= 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="draft">Kladd</SelectItem>
                  <SelectItem value="submitted">Venter</SelectItem>
                  <SelectItem value="approved">Godkjent</SelectItem>
                  <SelectItem value="rejected">Avvist</SelectItem>
                  <SelectItem value="deviation">Med avvik</SelectItem>
                </SelectContent>
              </Select>

              {deviationCount > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-warning-light px-3 py-1.5">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium text-warning">{deviationCount} avvik</span>
                </div>
              )}

              {pendingCount > 0 && isManager && (
                <div className="flex items-center gap-2 rounded-lg bg-primary-light px-3 py-1.5">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">{pendingCount} venter</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timesheet Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {isManager && (
                      <TableHead className="w-[50px]">
                        <Checkbox 
                          checked={selectedIds.length === filteredEntries.length && filteredEntries.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                    )}
                    <TableHead>Dato</TableHead>
                    <TableHead>Medarbeider</TableHead>
                    <TableHead>Funksjon</TableHead>
                    <TableHead>Planlagt</TableHead>
                    <TableHead>Stemplet</TableHead>
                    <TableHead>Timer</TableHead>
                    <TableHead>Avvik</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kommentar</TableHead>
                    {isManager && <TableHead className="text-right">Handlinger</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={isManager ? 11 : 10} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
                          <span className="text-muted-foreground">Laster...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isManager ? 11 : 10} className="text-center py-8">
                        <span className="text-muted-foreground">Ingen timelister for denne perioden</span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEntries.map((entry) => {
                      const hasDeviation = Math.abs(entry.deviation_minutes) > 15;
                      const status = statusConfig[entry.status];
                      
                      const hours = entry.clock_in && entry.clock_out
                        ? (new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()) / 3600000 - (entry.break_minutes / 60)
                        : 0;

                      const plannedTime = entry.shifts
                        ? `${entry.shifts.planned_start} - ${entry.shifts.planned_end}`
                        : "-";

                      const actualTime = entry.clock_in && entry.clock_out
                        ? `${format(new Date(entry.clock_in), "HH:mm")} - ${format(new Date(entry.clock_out), "HH:mm")}`
                        : entry.clock_in
                        ? `${format(new Date(entry.clock_in), "HH:mm")} - ...`
                        : "-";

                      return (
                        <TableRow
                          key={entry.id}
                          className={cn(
                            "transition-colors",
                            hasDeviation && "bg-warning-light/30",
                            entry.status === "rejected" && "bg-destructive/5"
                          )}
                        >
                          {isManager && (
                            <TableCell>
                              <Checkbox 
                                checked={selectedIds.includes(entry.id)}
                                onCheckedChange={(checked) => handleSelectOne(entry.id, !!checked)}
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-medium">
                            {format(new Date(entry.date), "EEE d. MMM", { locale: nb })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <AvatarWithInitials name={entry.profiles?.full_name || "?"} size="sm" />
                              <span>{entry.profiles?.full_name || "Ukjent"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {entry.shifts?.functions?.name ? (
                              <Badge 
                                variant="secondary"
                                style={{ 
                                  backgroundColor: entry.shifts.functions.color 
                                    ? `${entry.shifts.functions.color}20` 
                                    : undefined,
                                  color: entry.shifts.functions.color || undefined,
                                }}
                              >
                                {entry.shifts.functions.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{plannedTime}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {hasDeviation && (
                                <AlertTriangle className="h-4 w-4 text-warning" />
                              )}
                              <span className={hasDeviation ? "text-warning" : ""}>
                                {actualTime}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{hours.toFixed(1)}t</TableCell>
                          <TableCell>
                            {getDeviationBadge(entry.deviation_minutes)}
                          </TableCell>
                          <TableCell>
                            <Badge className={status.className}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">
                            {entry.deviation_reason || entry.manager_notes || "-"}
                          </TableCell>
                          {isManager && (
                            <TableCell className="text-right">
                              {entry.status === "submitted" && (
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-success hover:text-success hover:bg-success-light"
                                    onClick={() => approveEntries.mutate({
                                      timeEntryIds: [entry.id],
                                      approverId: user!.id,
                                    })}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setRejectDialog({ open: true, entry })}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totalt timer</p>
                <p className="text-2xl font-bold text-foreground">{totalHours.toFixed(1)}t</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-night-light">
                <Clock className="h-6 w-6 text-night" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Natt-timer</p>
                <p className="text-2xl font-bold text-foreground">{nightHours.toFixed(1)}t</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-light">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avvik</p>
                <p className="text-2xl font-bold text-foreground">{deviationCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, entry: rejectDialog.entry })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Avvis timeliste</DialogTitle>
            <DialogDescription>
              Skriv en begrunnelse for avvisningen. Den ansatte vil se denne kommentaren.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectReason">Begrunnelse</Label>
            <Textarea
              id="rejectReason"
              placeholder="F.eks. mangler dokumentasjon, feil tider registrert..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, entry: null })}>
              Avbryt
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectEntry.isPending}
            >
              {rejectEntry.isPending ? "Avviser..." : "Avvis"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

import { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { InlineDeviationEditor, DeviationLine } from "@/components/timesheet/InlineDeviationEditor";
import { useDeviationTypes } from "@/hooks/useDeviationTypes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { usePendingAbsenceRequests, useApproveAbsenceRequest, useAbsenceRequests, AbsenceRequest, useDeleteAbsenceRequest, useRevertAbsenceToStatus, useRevokeApprovedAbsence, useDeleteAbsenceWithNotification } from "@/hooks/useAbsenceRequests";
import { useShiftSwapRequests, useManagerApproveSwap, useManagerRejectSwap, ShiftSwapRequest } from "@/hooks/useShiftSwaps";
import { useAllTimeEntries, useApproveTimeEntries, useRejectTimeEntry, TimeEntryData } from "@/hooks/useTimeEntries";
import { useShifts } from "@/hooks/useShifts";
import { useDepartments } from "@/hooks/useEmployees";
import { AbsenceApprovalDetailModal } from "@/components/absence/AbsenceApprovalDetailModal";
import { AdminAbsenceModal } from "@/components/absence/AdminAbsenceModal";
import { TimesheetApprovalPanel } from "@/components/timesheet/TimesheetApprovalPanel";
import { TimesheetDetailModal } from "@/components/timesheet/TimesheetDetailModal";
import { DepartmentFilter } from "@/components/schedule/DepartmentFilter";
import {
  Search,
  Calendar,
  ArrowRightLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  FileText,
  Palmtree,
  Coffee,
  Heart,
  BriefcaseMedical,
  Moon,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Eye,
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react";

// Icon mapping for absence types
const absenceTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Ferie": Palmtree,
  "Avspasering": Coffee,
  "Natt-avspasering": Moon,
  "Permisjon med lønn": Heart,
  "Permisjon uten lønn": Heart,
  "Egenmelding": BriefcaseMedical,
  "Sykmeldt": BriefcaseMedical,
};

type ApprovalType = "absence" | "shift_swap" | "timesheet";

interface UnifiedApproval {
  id: string;
  type: ApprovalType;
  employeeName: string;
  employeeId: string;
  description: string;
  subType?: string;
  subTypeColor?: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  overlappingShifts?: Array<{ date: string; time: string }>;
  originalData: AbsenceRequest | ShiftSwapRequest | TimeEntryData;
}

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  
  // Rejection dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<UnifiedApproval | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<AbsenceRequest | null>(null);

  // Timesheet detail modal state
  const [timesheetModalOpen, setTimesheetModalOpen] = useState(false);
  const [selectedTimeEntry, setSelectedTimeEntry] = useState<TimeEntryData | null>(null);

  // Admin create absence modal
  const [adminAbsenceModalOpen, setAdminAbsenceModalOpen] = useState(false);

  // Multi-select for bulk approval
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Department filter
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const { data: departments = [] } = useDepartments();

  // Inline editing state
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [editClockIn, setEditClockIn] = useState("");
  const [editClockOut, setEditClockOut] = useState("");
  const [editBreak, setEditBreak] = useState(0);
  const [editNote, setEditNote] = useState("");
  const [editDeviationLines, setEditDeviationLines] = useState<DeviationLine[]>([]);
  const { data: deviationTypes = [] } = useDeviationTypes();

  // Fetch all pending absence requests
  const { data: pendingAbsences = [], isLoading: absencesLoading } = usePendingAbsenceRequests();
  const { data: allAbsences = [], isLoading: allAbsencesLoading } = useAbsenceRequests();
  
  // Fetch shift swap requests pending manager approval
  const { data: swapRequests = [], isLoading: swapsLoading } = useShiftSwapRequests();
  const pendingSwaps = swapRequests.filter(r => r.status === "pending_manager");
  
  // Fetch submitted time entries
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: timeEntries = [], isLoading: timesheetsLoading } = useAllTimeEntries(
    thirtyDaysAgo.toISOString().split("T")[0],
    today.toISOString().split("T")[0]
  );
  const pendingTimesheets = timeEntries.filter(t => t.status === "submitted");

  // Fetch shifts to check for overlaps
  const { data: allShifts = [] } = useShifts(
    thirtyDaysAgo.toISOString().split("T")[0],
    new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  // Mutations
  const approveAbsence = useApproveAbsenceRequest();
  const managerApproveSwap = useManagerApproveSwap();
  const managerRejectSwap = useManagerRejectSwap();
  const approveTimeEntries = useApproveTimeEntries();
  const rejectTimeEntry = useRejectTimeEntry();

  // Combine all approvals into unified format
  const unifiedApprovals = useMemo((): UnifiedApproval[] => {
    const approvals: UnifiedApproval[] = [];

    // Add absence requests
    pendingAbsences.forEach((absence) => {
      const overlappingShifts = allShifts
        .filter(s => 
          s.employee_id === absence.employee_id &&
          s.date >= absence.start_date &&
          s.date <= absence.end_date
        )
        .map(s => ({
          date: s.date,
          time: `${s.planned_start?.slice(0, 5) || ""}-${s.planned_end?.slice(0, 5) || ""}`
        }));

      approvals.push({
        id: absence.id,
        type: "absence",
        employeeName: absence.profiles?.full_name || "Ukjent",
        employeeId: absence.employee_id,
        description: `${format(new Date(absence.start_date), "d. MMM", { locale: nb })} - ${format(new Date(absence.end_date), "d. MMM yyyy", { locale: nb })} (${absence.total_days} ${absence.total_days === 1 ? "dag" : "dager"})`,
        subType: absence.absence_types?.name,
        subTypeColor: absence.absence_types?.color,
        createdAt: absence.created_at,
        status: "pending",
        overlappingShifts: overlappingShifts.length > 0 ? overlappingShifts : undefined,
        originalData: absence,
      });
    });

    // Add shift swap requests
    pendingSwaps.forEach((swap) => {
      const swapTypeLabels: Record<string, string> = {
        swap: "Bytte",
        giveaway: "Gi bort vakt",
        cover: "Be om dekning"
      };

      approvals.push({
        id: swap.id,
        type: "shift_swap",
        employeeName: swap.requester?.full_name || "Ukjent",
        employeeId: swap.requester_id,
        description: swap.original_shift 
          ? `${format(new Date(swap.original_shift.date), "EEEE d. MMM", { locale: nb })} ${swap.original_shift.planned_start?.slice(0, 5)}-${swap.original_shift.planned_end?.slice(0, 5)}${swap.target_employee ? ` → ${swap.target_employee.full_name}` : ""}`
          : "Vaktbytte",
        subType: swapTypeLabels[swap.swap_type] || swap.swap_type,
        createdAt: swap.created_at,
        status: "pending",
        originalData: swap,
      });
    });

    // Add timesheet approvals
    pendingTimesheets.forEach((entry) => {
      const clockIn = new Date(entry.clock_in!);
      const clockOut = entry.clock_out ? new Date(entry.clock_out) : null;
      const hoursWorked = clockOut 
        ? ((clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60) - (entry.break_minutes || 0) / 60).toFixed(1)
        : "Pågår";

      approvals.push({
        id: entry.id,
        type: "timesheet",
        employeeName: entry.profiles?.full_name || "Ukjent",
        employeeId: entry.employee_id,
        description: `${format(clockIn, "EEEE d. MMM", { locale: nb })}: ${format(clockIn, "HH:mm")}-${clockOut ? format(clockOut, "HH:mm") : "?"} (${hoursWorked} timer)`,
        subType: "Timeliste",
        createdAt: entry.created_at,
        status: "pending",
        originalData: entry,
      });
    });

    return approvals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [pendingAbsences, pendingSwaps, pendingTimesheets, allShifts]);

  // Get approved/rejected for history tabs
  const approvedAbsences = allAbsences.filter(a => a.status === "approved");
  const rejectedAbsences = allAbsences.filter(a => a.status === "rejected");
  const approvedSwaps = swapRequests.filter(r => r.status === "approved");
  const rejectedSwaps = swapRequests.filter(r => r.status === "rejected");
  const approvedTimesheets = timeEntries.filter(t => t.status === "approved");
  const rejectedTimesheets = timeEntries.filter(t => t.status === "rejected");

  // Filter by search and department
  const filteredApprovals = unifiedApprovals.filter(approval => {
    const matchesSearch = approval.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      approval.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (approval.subType?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    if (selectedDepartment) {
      // For timesheet entries, check profile department
      if (approval.type === "timesheet") {
        const entry = approval.originalData as TimeEntryData;
        return entry.profiles?.department_id === selectedDepartment;
      }
      // For other types, we don't filter by department (could be extended)
    }
    
    return true;
  });

  const isLoading = absencesLoading || swapsLoading || timesheetsLoading;

  // Multi-select helpers
  const selectableTimesheetIds = filteredApprovals
    .filter(a => a.type === "timesheet" && Math.abs((a.originalData as TimeEntryData).deviation_minutes) <= 15)
    .map(a => a.id);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? selectableTimesheetIds : []);
  };

  const allSelectableChecked = selectableTimesheetIds.length > 0 && selectableTimesheetIds.every(id => selectedIds.includes(id));

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0 || !user?.id) return;
    await approveTimeEntries.mutateAsync({
      timeEntryIds: selectedIds,
      approverId: user.id,
    });
    setSelectedIds([]);
  };

  // Toggle inline edit expansion
  const handleToggleExpand = useCallback((entry: TimeEntryData) => {
    if (expandedEntryId === entry.id) {
      setExpandedEntryId(null);
      return;
    }
    // Initialize edit fields from entry data
    const clockIn = entry.clock_in ? format(new Date(entry.clock_in), "HH:mm") : "00:00";
    const clockOut = entry.clock_out ? format(new Date(entry.clock_out), "HH:mm") : "00:00";
    setEditClockIn(clockIn);
    setEditClockOut(clockOut);
    setEditBreak(entry.break_minutes || 0);
    setEditNote(entry.manager_notes || "");

    // Create default deviation line (Normal, full shift)
    const normalType = deviationTypes.find(t => t.code === "normal");
    const plannedStart = entry.shifts?.planned_start?.slice(0, 5) || clockIn;
    const plannedEnd = entry.shifts?.planned_end?.slice(0, 5) || clockOut;

    const timeDiff = (s: string, e: string) => {
      const [sh, sm] = s.split(":").map(Number);
      const [eh, em] = e.split(":").map(Number);
      let d = (eh * 60 + em) - (sh * 60 + sm);
      if (d < 0) d += 24 * 60;
      return d;
    };

    const lines: DeviationLine[] = [{
      id: `line-init-${Date.now()}`,
      deviation_type_id: normalType?.id || deviationTypes[0]?.id || "",
      start_time: plannedStart,
      end_time: clockOut,
      duration_minutes: timeDiff(plannedStart, clockOut),
    }];

    setEditDeviationLines(lines);
    setExpandedEntryId(entry.id);
  }, [expandedEntryId, deviationTypes]);

  // Save inline edits and approve
  const handleSaveAndApprove = async (entry: TimeEntryData) => {
    if (!user?.id) return;
    try {
      // Update the time entry with corrected values
      const { supabase } = await import("@/integrations/supabase/client");
      
      // Build new clock_in/clock_out from edited times
      const dateStr = entry.date;
      const newClockIn = new Date(`${dateStr}T${editClockIn}:00`).toISOString();
      const newClockOut = new Date(`${dateStr}T${editClockOut}:00`).toISOString();

      // Update the time entry
      await supabase.from("time_entries").update({
        clock_in: newClockIn,
        clock_out: newClockOut,
        break_minutes: editBreak,
        manager_notes: editNote || null,
      }).eq("id", entry.id);

      // Save deviation lines
      if (editDeviationLines.length > 0) {
        // Delete existing lines first
        await supabase.from("time_entry_lines").delete().eq("time_entry_id", entry.id);

        // Insert new lines
        const lineInserts = editDeviationLines.map((line, idx) => ({
          time_entry_id: entry.id,
          deviation_type_id: line.deviation_type_id,
          start_time: line.start_time,
          end_time: line.end_time,
          duration_minutes: line.duration_minutes,
          sort_order: idx,
        }));
        await supabase.from("time_entry_lines").insert(lineInserts);
      }

      // Approve the entry
      await approveTimeEntries.mutateAsync({
        timeEntryIds: [entry.id],
        approverId: user.id,
      });

      setExpandedEntryId(null);
    } catch (error) {
      console.error("Save and approve failed:", error);
    }
  };

  // Handle approve
  const handleApprove = async (approval: UnifiedApproval) => {
    try {
      switch (approval.type) {
        case "absence":
          await approveAbsence.mutateAsync({ id: approval.id, approved: true });
          break;
        case "shift_swap":
          await managerApproveSwap.mutateAsync(approval.originalData as ShiftSwapRequest);
          break;
        case "timesheet":
          await approveTimeEntries.mutateAsync({ 
            timeEntryIds: [approval.id], 
            approverId: user?.id || "" 
          });
          break;
      }
    } catch (error) {
      console.error("Approval failed:", error);
    }
  };

  // Handle reject click
  const handleRejectClick = (approval: UnifiedApproval) => {
    setSelectedApproval(approval);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  // Handle reject confirm
  const handleRejectConfirm = async () => {
    if (!selectedApproval) return;

    try {
      switch (selectedApproval.type) {
        case "absence":
          await approveAbsence.mutateAsync({ 
            id: selectedApproval.id, 
            approved: false,
            rejectionReason 
          });
          break;
        case "shift_swap":
          await managerRejectSwap.mutateAsync(selectedApproval.id);
          break;
        case "timesheet":
          await rejectTimeEntry.mutateAsync({ 
            timeEntryId: selectedApproval.id, 
            managerNotes: rejectionReason 
          });
          break;
      }
      setRejectDialogOpen(false);
      setSelectedApproval(null);
    } catch (error) {
      console.error("Rejection failed:", error);
    }
  };

  const getTypeConfig = (type: ApprovalType, subType?: string) => {
    switch (type) {
      case "absence":
        const AbsenceIcon = absenceTypeIcons[subType || ""] || Calendar;
        return { icon: AbsenceIcon, label: subType || "Fravær", colorClass: "bg-primary/10 text-primary" };
      case "shift_swap":
        return { icon: ArrowRightLeft, label: subType || "Vaktbytte", colorClass: "bg-warning/10 text-warning" };
      case "timesheet":
        return { icon: FileText, label: "Timeliste", colorClass: "bg-success/10 text-success" };
    }
  };

  const renderApprovalCard = (approval: UnifiedApproval, showActions = true) => {
    const config = getTypeConfig(approval.type, approval.subType);
    const Icon = config.icon;
    const isPending = approveAbsence.isPending || managerApproveSwap.isPending || approveTimeEntries.isPending;

    // Enriched timesheet card
    if (approval.type === "timesheet") {
      const entry = approval.originalData as TimeEntryData;
      const clockInTime = entry.clock_in ? format(new Date(entry.clock_in), "HH:mm") : "?";
      const clockOutTime = entry.clock_out ? format(new Date(entry.clock_out), "HH:mm") : "?";
      const plannedStart = entry.shifts?.planned_start?.slice(0, 5);
      const plannedEnd = entry.shifts?.planned_end?.slice(0, 5);
      const plannedBreak = entry.shifts?.planned_break_minutes || 0;
      const plannedHours = plannedStart && plannedEnd
        ? (() => {
            const [sh, sm] = plannedStart.split(":").map(Number);
            const [eh, em] = plannedEnd.split(":").map(Number);
            let diff = (eh * 60 + em) - (sh * 60 + sm);
            if (diff < 0) diff += 24 * 60;
            return (diff - plannedBreak) / 60;
          })()
        : 0;
      const hoursWorked = entry.clock_in && entry.clock_out
        ? ((new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()) / 3600000 - (entry.break_minutes || 0) / 60)
        : 0;
      const hasDeviation = Math.abs(entry.deviation_minutes) > 15;

      return (
        <Card
          key={approval.id}
          className="transition-shadow hover:shadow-md cursor-pointer group"
          onClick={() => {
            setSelectedTimeEntry(entry);
            setTimesheetModalOpen(true);
          }}
        >
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <AvatarWithInitials name={approval.employeeName} size="lg" />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground truncate">
                      {approval.employeeName}
                    </h3>
                    <Badge className="bg-success/10 text-success border-success/30">
                      <FileText className="mr-1 h-3 w-3" />
                      Timeliste
                    </Badge>
                    {entry.shifts?.functions && (
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: entry.shifts.functions.color || undefined,
                          color: entry.shifts.functions.color || undefined,
                        }}
                      >
                        {entry.shifts.functions.name}
                      </Badge>
                    )}
                    {hasDeviation && (
                      <Badge className="bg-warning/10 text-warning border-warning/30">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Avvik
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="font-medium text-foreground">
                      {format(new Date(entry.date + "T00:00"), "EEE d. MMM", { locale: nb })}
                    </span>
                    {plannedStart && plannedEnd && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Plan: {plannedStart}–{plannedEnd}
                        <span className="font-mono font-medium text-foreground ml-0.5">({plannedHours.toFixed(1)}t)</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3" />
                      {clockInTime}–{clockOutTime}
                      <span className="font-medium text-foreground ml-0.5">({hoursWorked.toFixed(1)}t)</span>
                    </span>
                    {entry.deviation_minutes !== 0 && (
                      <span className={`font-mono font-semibold ${entry.deviation_minutes > 0 ? "text-success" : "text-destructive"}`}>
                        {entry.deviation_minutes > 0 ? "+" : ""}{entry.deviation_minutes}m
                      </span>
                    )}
                  </div>

                  {entry.deviation_reason && (
                    <p className="text-xs text-muted-foreground italic truncate">«{entry.deviation_reason}»</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 items-center self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleRejectClick(approval)}
                  disabled={isPending}
                >
                  <XCircle className="h-4 w-4" />
                  Avslå
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    setSelectedTimeEntry(entry);
                    setTimesheetModalOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Rediger
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleApprove(approval)}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Godkjenn
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card key={approval.id} className="transition-shadow hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <AvatarWithInitials name={approval.employeeName} size="lg" />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-foreground">
                    {approval.employeeName}
                  </h3>
                  <Badge 
                    className={config.colorClass}
                    style={approval.subTypeColor ? { 
                      backgroundColor: `${approval.subTypeColor}20`,
                      color: approval.subTypeColor 
                    } : undefined}
                  >
                    <Icon className="mr-1 h-3 w-3" />
                    {config.label}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{approval.description}</p>
                
                {approval.type === "absence" && (approval.originalData as AbsenceRequest).comment && (
                  <p className="text-sm text-muted-foreground italic">
                    "{(approval.originalData as AbsenceRequest).comment}"
                  </p>
                )}
                
                {approval.type === "shift_swap" && (approval.originalData as ShiftSwapRequest).reason && (
                  <p className="text-sm text-muted-foreground italic">
                    "{(approval.originalData as ShiftSwapRequest).reason}"
                  </p>
                )}

                <div className="flex items-center gap-4 pt-2">
                  <Badge variant="secondary" className="bg-warning/10 text-warning">
                    <Clock className="mr-1 h-3 w-3" />
                    Venter godkjenning
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Sendt {format(new Date(approval.createdAt), "d. MMM yyyy 'kl.' HH:mm", { locale: nb })}
                  </span>
                </div>
              </div>
            </div>

            {showActions && (
              <div className="flex gap-2 self-end sm:self-start">
                {approval.type === "absence" && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => {
                      setSelectedAbsence(approval.originalData as AbsenceRequest);
                      setDetailModalOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    Detaljer
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => handleRejectClick(approval)}
                  disabled={isPending}
                >
                  <XCircle className="h-4 w-4" />
                  Avslå
                </Button>
                <Button 
                  size="sm" 
                  className="gap-2"
                  onClick={() => {
                    if (approval.type === "absence" && approval.overlappingShifts && approval.overlappingShifts.length > 0) {
                      setSelectedAbsence(approval.originalData as AbsenceRequest);
                      setDetailModalOpen(true);
                    } else {
                      handleApprove(approval);
                    }
                  }}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Godkjenn
                </Button>
              </div>
            )}
          </div>

          {approval.overlappingShifts && approval.overlappingShifts.length > 0 && (
            <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">
                    {approval.overlappingShifts.length} overlappende {approval.overlappingShifts.length === 1 ? "vakt" : "vakter"} funnet
                  </p>
                  <ul className="mt-1 text-muted-foreground space-y-0.5">
                    {approval.overlappingShifts.slice(0, 3).map((shift, i) => (
                      <li key={i}>
                        {format(new Date(shift.date), "EEEE d. MMM", { locale: nb })} {shift.time}
                      </li>
                    ))}
                    {approval.overlappingShifts.length > 3 && (
                      <li className="text-xs">
                        +{approval.overlappingShifts.length - 3} flere...
                      </li>
                    )}
                  </ul>
                  <p className="mt-2 text-muted-foreground">
                    Ved godkjenning må vaktene håndteres.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = (type: "pending" | "approved" | "rejected") => {
    const configs = {
      pending: { icon: CheckCircle, iconClass: "text-success", title: "Ingen ventende", desc: "Alle søknader er behandlet" },
      approved: { icon: CheckCircle, iconClass: "text-success", title: "Ingen godkjente", desc: "Godkjente søknader vises her" },
      rejected: { icon: XCircle, iconClass: "text-destructive", title: "Ingen avslåtte", desc: "Avslåtte søknader vises her" },
    };
    const config = configs[type];
    const Icon = config.icon;

    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Icon className={`h-12 w-12 ${config.iconClass}`} />
          <h3 className="mt-4 text-lg font-semibold text-foreground">{config.title}</h3>
          <p className="text-muted-foreground">{config.desc}</p>
        </CardContent>
      </Card>
    );
  };

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Count by type for badges
  const absenceCount = filteredApprovals.filter(a => a.type === "absence").length;
  const swapCount = filteredApprovals.filter(a => a.type === "shift_swap").length;
  const timesheetCount = filteredApprovals.filter(a => a.type === "timesheet").length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pl-12 lg:pl-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Godkjenninger</h1>
            <p className="text-muted-foreground">
              Behandle søknader og forespørsler fra ansatte
            </p>
          </div>
          <Button onClick={() => setAdminAbsenceModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Søk om fravær / ferie
          </Button>
        </div>

        {/* Quick stats */}
        {!isLoading && filteredApprovals.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {absenceCount > 0 && (
              <Badge variant="outline" className="text-sm py-1.5 px-3">
                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                {absenceCount} fraværssøknad{absenceCount !== 1 && "er"}
              </Badge>
            )}
            {swapCount > 0 && (
              <Badge variant="outline" className="text-sm py-1.5 px-3">
                <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />
                {swapCount} vaktbytte{swapCount !== 1 && "r"}
              </Badge>
            )}
            {timesheetCount > 0 && (
              <Badge variant="outline" className="text-sm py-1.5 px-3">
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                {timesheetCount} timeliste{timesheetCount !== 1 && "r"}
              </Badge>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="bg-muted">
              <TabsTrigger value="pending" className="gap-2">
                Ventende
                {filteredApprovals.length > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-5 rounded-full">
                    {filteredApprovals.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Godkjent</TabsTrigger>
              <TabsTrigger value="rejected">Avslått</TabsTrigger>
              <TabsTrigger value="timesheets">Timer</TabsTrigger>
              <TabsTrigger value="all">Alle</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3">
              <DepartmentFilter
                selectedDepartment={selectedDepartment}
                onDepartmentChange={setSelectedDepartment}
                departments={departments}
              />
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Søk etter navn, type..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              renderLoadingSkeleton()
            ) : filteredApprovals.length === 0 ? (
              renderEmptyState("pending")
            ) : (
              <>
                {/* Bulk action bar */}
                {selectableTimesheetIds.length > 0 && (
                  <Card className="border-dashed">
                    <CardContent className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={allSelectableChecked}
                          onCheckedChange={handleSelectAll}
                        />
                        <span className="text-sm text-muted-foreground">
                          {selectedIds.length > 0
                            ? `${selectedIds.length} av ${selectableTimesheetIds.length} valgt`
                            : `Velg alle timelister uten avvik (${selectableTimesheetIds.length})`}
                        </span>
                      </div>
                      {selectedIds.length > 0 && (
                        <Button
                          size="sm"
                          className="gap-1.5"
                          onClick={handleBulkApprove}
                          disabled={approveTimeEntries.isPending}
                        >
                          {approveTimeEntries.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Godkjenn valgte ({selectedIds.length})
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
                {filteredApprovals.map(approval => {
                  const isTimesheet = approval.type === "timesheet";
                  const isSelectable = isTimesheet && selectableTimesheetIds.includes(approval.id);
                  const isSelected = selectedIds.includes(approval.id);

                  return (
                    <div key={approval.id} className="flex items-start gap-3">
                      {isTimesheet && (
                        <div className="pt-6">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleSelect(approval.id)}
                            disabled={!isSelectable}
                            className={!isSelectable ? "opacity-40" : ""}
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        {renderApprovalCard(approval)}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </TabsContent>

          <TabsContent value="timesheets">
            <TimesheetApprovalPanel />
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedAbsences.length === 0 && approvedSwaps.length === 0 && approvedTimesheets.length === 0 ? (
              renderEmptyState("approved")
            ) : (
              <>
                {approvedAbsences.map(absence => (
                  <Card 
                    key={absence.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedAbsence(absence);
                      setDetailModalOpen(true);
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <AvatarWithInitials name={absence.profiles?.full_name || ""} size="lg" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{absence.profiles?.full_name}</h3>
                            <Badge className="bg-primary/10 text-primary">
                              {absence.absence_types?.name}
                            </Badge>
                            <Badge className="bg-success/10 text-success">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Godkjent
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(absence.start_date), "d. MMM", { locale: nb })} - {format(new Date(absence.end_date), "d. MMM yyyy", { locale: nb })}
                          </p>
                          {absence.approved_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Godkjent {format(new Date(absence.approved_at), "d. MMM yyyy", { locale: nb })}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Eye className="h-4 w-4" />
                            Detaljer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedAbsences.length === 0 && rejectedSwaps.length === 0 && rejectedTimesheets.length === 0 ? (
              renderEmptyState("rejected")
            ) : (
              <>
                {rejectedAbsences.map(absence => (
                  <Card 
                    key={absence.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedAbsence(absence);
                      setDetailModalOpen(true);
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <AvatarWithInitials name={absence.profiles?.full_name || ""} size="lg" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{absence.profiles?.full_name}</h3>
                            <Badge className="bg-primary/10 text-primary">
                              {absence.absence_types?.name}
                            </Badge>
                            <Badge variant="destructive">
                              <XCircle className="mr-1 h-3 w-3" />
                              Avslått
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(absence.start_date), "d. MMM", { locale: nb })} - {format(new Date(absence.end_date), "d. MMM yyyy", { locale: nb })}
                          </p>
                          {absence.rejection_reason && (
                            <p className="text-sm text-destructive mt-2">
                              Grunn: {absence.rejection_reason}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Eye className="h-4 w-4" />
                            Detaljer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">Alle søknader</h3>
                <p className="text-muted-foreground">Her vises hele historikken over søknader</p>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>• {allAbsences.length} fraværssøknader totalt</p>
                  <p>• {swapRequests.length} vaktbytteforespørsler totalt</p>
                  <p>• {timeEntries.length} timeliste-oppføringer totalt</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avslå forespørsel</DialogTitle>
            <DialogDescription>
              Du er i ferd med å avslå forespørselen fra{" "}
              <strong>{selectedApproval?.employeeName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Begrunnelse for avslag (anbefalt)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={approveAbsence.isPending || managerRejectSwap.isPending || rejectTimeEntry.isPending}
            >
              {(approveAbsence.isPending || managerRejectSwap.isPending || rejectTimeEntry.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Avslår...
                </>
              ) : (
                "Avslå forespørsel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Absence Modal */}
      <AdminAbsenceModal
        open={adminAbsenceModalOpen}
        onOpenChange={setAdminAbsenceModalOpen}
      />

      {/* Absence Detail Modal */}
      {selectedAbsence && (
        <AbsenceApprovalDetailModal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          absence={selectedAbsence}
        />
      )}

      {/* Timesheet Detail Modal */}
      <TimesheetDetailModal
        open={timesheetModalOpen}
        onOpenChange={setTimesheetModalOpen}
        entry={selectedTimeEntry}
      />
    </MainLayout>
  );
}

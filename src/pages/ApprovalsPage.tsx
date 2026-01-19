import { useState, useMemo } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import { AbsenceApprovalDetailModal } from "@/components/absence/AbsenceApprovalDetailModal";
import { AdminAbsenceModal } from "@/components/absence/AdminAbsenceModal";
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

  // Admin create absence modal
  const [adminAbsenceModalOpen, setAdminAbsenceModalOpen] = useState(false);

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

  // Filter by search
  const filteredApprovals = unifiedApprovals.filter(approval =>
    approval.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    approval.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (approval.subType?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isLoading = absencesLoading || swapsLoading || timesheetsLoading;

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
                
                {/* Show comment for absence */}
                {approval.type === "absence" && (approval.originalData as AbsenceRequest).comment && (
                  <p className="text-sm text-muted-foreground italic">
                    "{(approval.originalData as AbsenceRequest).comment}"
                  </p>
                )}
                
                {/* Show reason for swap */}
                {approval.type === "shift_swap" && (approval.originalData as ShiftSwapRequest).reason && (
                  <p className="text-sm text-muted-foreground italic">
                    "{(approval.originalData as ShiftSwapRequest).reason}"
                  </p>
                )}

                <div className="flex items-center gap-4 pt-2">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
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
                    // For absences with overlapping shifts, open detail modal instead
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

          {/* Overlapping shifts warning */}
          {approval.overlappingShifts && approval.overlappingShifts.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-300">
                    {approval.overlappingShifts.length} overlappende {approval.overlappingShifts.length === 1 ? "vakt" : "vakter"} funnet
                  </p>
                  <ul className="mt-1 text-amber-700 dark:text-amber-400 space-y-0.5">
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
                  <p className="mt-2 text-amber-600 dark:text-amber-500">
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
              <TabsTrigger value="all">Alle</TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Søk etter navn, type..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              renderLoadingSkeleton()
            ) : filteredApprovals.length === 0 ? (
              renderEmptyState("pending")
            ) : (
              filteredApprovals.map(approval => renderApprovalCard(approval))
            )}
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
    </MainLayout>
  );
}

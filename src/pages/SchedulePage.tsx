import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useFunctions } from "@/hooks/useFunctions";
import { useDepartments, useEmployees } from "@/hooks/useEmployees";
import { useShifts, ShiftData, useUpdateShift, useCreateShift } from "@/hooks/useShifts";
import { useWageSupplements, calculateDayCost } from "@/hooks/useWageSupplements";
import { useShiftTemplates, ShiftTemplate } from "@/hooks/useShiftTemplates";
import { useWorkTimeViolations } from "@/hooks/useWorkTimeRules";
import { useApprovedAbsences, getAbsencesForDate } from "@/hooks/useApprovedAbsences";
import { useAuth } from "@/contexts/AuthContext";
import { CreateShiftModal } from "@/components/schedule/CreateShiftModal";
import { EnhancedShiftDetailModal } from "@/components/schedule/EnhancedShiftDetailModal";
import { FunctionBasedScheduleGrid } from "@/components/schedule/FunctionBasedScheduleGrid";
import { FunctionsManagementModal } from "@/components/schedule/FunctionsManagementModal";
import { DepartmentsManagementModal } from "@/components/schedule/DepartmentsManagementModal";
import { CostSummaryTooltip } from "@/components/schedule/CostSummaryTooltip";
import { ShiftTemplatesDropdown } from "@/components/schedule/ShiftTemplatesDropdown";
import { SaveTemplateModal } from "@/components/schedule/SaveTemplateModal";
import { RolloutTemplateModal } from "@/components/schedule/RolloutTemplateModal";
import { ManageTemplatesModal } from "@/components/schedule/ManageTemplatesModal";
import { CopyWeekModal } from "@/components/schedule/CopyWeekModal";
import { WorkTimeAlertsPanel } from "@/components/schedule/WorkTimeAlertsPanel";
import { OpenShiftsPanel } from "@/components/schedule/OpenShiftsPanel";
import { ShiftSwapsPanel } from "@/components/schedule/ShiftSwapsPanel";
import { DraggableShiftCard } from "@/components/schedule/DraggableShiftCard";
import { DroppableScheduleCell } from "@/components/schedule/DroppableScheduleCell";
import { ShiftDropModal } from "@/components/schedule/ShiftDropModal";
import { DepartmentFilter } from "@/components/schedule/DepartmentFilter";
import { FunctionFilterButtons } from "@/components/schedule/FunctionFilterButtons";
import { ScheduleViewToggle, ViewMode } from "@/components/schedule/ScheduleViewToggle";
import { EmployeeBasedScheduleGrid } from "@/components/schedule/EmployeeBasedScheduleGrid";
import { getWeatherForDate, weatherIcons, weatherColors, weatherLabels } from "@/lib/weather-utils";
import { useWeatherSettings } from "@/hooks/useWeatherSettings";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  DollarSign,
  CalendarDays,
  Settings,
  Moon,
  AlertCircle,
  Palmtree,
  Building2,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 19));
  // Department and function filter state
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [activeFunctionIds, setActiveFunctionIds] = useState<string[]>([]);
  const [showOnlyDepartmentEmployees, setShowOnlyDepartmentEmployees] = useState(false);
  const [viewType, setViewType] = useState<"day" | "week" | "month">("week");
  const [scheduleViewMode, setScheduleViewMode] = useState<ViewMode>("functions");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [functionsModalOpen, setFunctionsModalOpen] = useState(false);
  const [departmentsModalOpen, setDepartmentsModalOpen] = useState(false);
  const [saveTemplateModalOpen, setSaveTemplateModalOpen] = useState(false);
  const [rolloutModalOpen, setRolloutModalOpen] = useState(false);
  const [manageTemplatesModalOpen, setManageTemplatesModalOpen] = useState(false);
  const [copyWeekModalOpen, setCopyWeekModalOpen] = useState(false);
  const [selectedTemplateForRollout, setSelectedTemplateForRollout] = useState<ShiftTemplate | undefined>();
  const [showAlerts, setShowAlerts] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedFunctionId, setSelectedFunctionId] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<ShiftData | null>(null);
  
  // Drag-and-drop modal state
  const [dropModalOpen, setDropModalOpen] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<{
    shiftId: string;
    originalDate: string;
    originalFunctionId: string | null;
    originalEmployeeId: string | null;
    plannedStart: string;
    plannedEnd: string;
    employeeName: string | null;
    targetDate: string;
    targetFunctionId: string;
    isCopy: boolean;
  } | null>(null);

  const { isAdminOrManager } = useAuth();
  const { data: functions = [], isLoading: loadingFunctions } = useFunctions();
  const { data: departments = [] } = useDepartments();
  const { data: employees = [] } = useEmployees();
  const { data: supplements = [] } = useWageSupplements();
  const { data: templates = [], isLoading: loadingTemplates } = useShiftTemplates();

  // Filter functions based on selected department
  const filteredFunctions = useMemo(() => {
    if (!selectedDepartment) return functions;
    return functions.filter((f) => f.department_id === selectedDepartment);
  }, [functions, selectedDepartment]);

  // Filter to only show active functions (when specific functions selected)
  const displayedFunctions = useMemo(() => {
    if (activeFunctionIds.length === 0) return filteredFunctions;
    return filteredFunctions.filter((f) => activeFunctionIds.includes(f.id));
  }, [filteredFunctions, activeFunctionIds]);

  // Filter employees based on department
  const filteredEmployees = useMemo(() => {
    if (!showOnlyDepartmentEmployees || !selectedDepartment) return employees;
    return employees.filter((e) => e.department_id === selectedDepartment);
  }, [employees, showOnlyDepartmentEmployees, selectedDepartment]);

  const handleFunctionToggle = (functionId: string) => {
    setActiveFunctionIds((prev) =>
      prev.includes(functionId)
        ? prev.filter((id) => id !== functionId)
        : [...prev, functionId]
    );
  };

  const handleToggleAllFunctions = () => {
    setActiveFunctionIds([]);
  };
  
  const updateShift = useUpdateShift();
  const createShift = useCreateShift();

  // Calculate week range
  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };

  const weekDays = getWeekDays(currentDate);
  const startDate = weekDays[0].toISOString().split("T")[0];
  const endDate = weekDays[6].toISOString().split("T")[0];

  const { data: shifts = [], isLoading: loadingShifts } = useShifts(startDate, endDate);
  const { violations, criticalCount, warningCount } = useWorkTimeViolations(shifts);
  const { data: approvedAbsences = [] } = useApprovedAbsences(startDate, endDate);
  const { data: showWeather = true } = useWeatherSettings();

  const dayNames = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const getShiftsForDayAndFunction = (date: Date, functionId: string) => {
    return shifts.filter(
      (shift) => shift.date === formatDate(date) && shift.function_id === functionId
    );
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date(2026, 0, 19));

  const handleCellClick = (date: Date, functionId: string) => {
    setSelectedDate(date);
    setSelectedFunctionId(functionId);
    setCreateModalOpen(true);
  };

  const handleShiftClick = (shift: ShiftData) => {
    setSelectedShift(shift);
    setDetailModalOpen(true);
  };

  const calculateDayStats = (date: Date) => {
    const dayShifts = shifts.filter((s) => s.date === formatDate(date));
    const costs = calculateDayCost(dayShifts, supplements);
    return { 
      hours: costs.totalHours.toFixed(1), 
      costs,
      shifts: dayShifts.length 
    };
  };

  // Handle drag-and-drop of shifts - now opens modal
  const handleShiftDrop = (shiftId: string, newDate: string, newFunctionId: string, isCopy: boolean) => {
    const shift = shifts.find((s) => s.id === shiftId);
    if (!shift) return;

    // Store pending drop data and open modal
    setPendingDrop({
      shiftId,
      originalDate: shift.date,
      originalFunctionId: shift.function_id,
      originalEmployeeId: shift.employee_id,
      plannedStart: shift.planned_start,
      plannedEnd: shift.planned_end,
      employeeName: shift.profiles?.full_name || null,
      targetDate: newDate,
      targetFunctionId: newFunctionId,
      isCopy,
    });
    setDropModalOpen(true);
  };

  // Confirm the drop with selected employee
  const handleDropConfirm = (employeeId: string | null) => {
    if (!pendingDrop) return;

    const shift = shifts.find((s) => s.id === pendingDrop.shiftId);
    if (!shift) return;

    if (pendingDrop.isCopy) {
      createShift.mutate({
        date: pendingDrop.targetDate,
        function_id: pendingDrop.targetFunctionId,
        employee_id: employeeId,
        planned_start: shift.planned_start,
        planned_end: shift.planned_end,
        planned_break_minutes: shift.planned_break_minutes ?? undefined,
        status: "draft",
        shift_type: shift.shift_type,
        notes: shift.notes ?? undefined,
      }, {
        onSuccess: () => {
          toast.success("Vakt kopiert");
        }
      });
    } else {
      updateShift.mutate({
        id: pendingDrop.shiftId,
        date: pendingDrop.targetDate,
        function_id: pendingDrop.targetFunctionId,
        employee_id: employeeId,
      }, {
        onSuccess: () => {
          toast.success("Vakt flyttet");
        }
      });
    }

    setPendingDrop(null);
  };

  const selectedFunction = functions.find((f) => f.id === selectedFunctionId) || null;

  if (loadingFunctions || loadingShifts) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Laster vaktplan...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 pl-12 sm:flex-row sm:items-center sm:justify-between lg:pl-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vaktplan</h1>
            <p className="text-muted-foreground">
              {selectedDepartment
                ? departments.find((d) => d.id === selectedDepartment)?.name
                : "Alle avdelinger"}
            </p>
          </div>
          <div className="flex gap-2">
            {isAdminOrManager() && (
              <>
                <ShiftTemplatesDropdown
                  templates={templates}
                  isLoading={loadingTemplates}
                  onSaveTemplate={() => setSaveTemplateModalOpen(true)}
                  onRollout={(template) => {
                    setSelectedTemplateForRollout(template);
                    setRolloutModalOpen(true);
                  }}
                  onManage={() => setManageTemplatesModalOpen(true)}
                />
                <Button variant="outline" onClick={() => setCopyWeekModalOpen(true)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Kopier uke
                </Button>
              <Button variant="outline" onClick={() => setDepartmentsModalOpen(true)}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Avdelinger
                </Button>
                <Button variant="outline" onClick={() => setFunctionsModalOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Funksjoner
                </Button>
              </>
            )}
            <Button onClick={() => { setSelectedDate(new Date()); setSelectedFunctionId(displayedFunctions[0]?.id || null); setCreateModalOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Ny vakt
            </Button>
          </div>
        </div>

        {/* Navigation with Department Filter and View Toggle */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <DepartmentFilter
              selectedDepartment={selectedDepartment}
              onDepartmentChange={setSelectedDepartment}
              departments={departments}
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToToday}>I dag</Button>
              <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="ml-2 text-lg font-semibold text-foreground">
                Uke {Math.ceil((currentDate.getDate() + new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()) / 7)},{" "}
                {currentDate.toLocaleDateString("nb-NO", { month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
          <ScheduleViewToggle
            viewMode={scheduleViewMode}
            onViewModeChange={setScheduleViewMode}
          />
        </div>

        {/* Function Filter Buttons */}
        <FunctionFilterButtons
          functions={filteredFunctions}
          activeFunctions={activeFunctionIds}
          onToggle={handleFunctionToggle}
          onToggleAll={handleToggleAllFunctions}
          showAllActive={activeFunctionIds.length === 0}
          showOnlyDepartmentEmployees={showOnlyDepartmentEmployees}
          onToggleDepartmentFilter={() => setShowOnlyDepartmentEmployees(!showOnlyDepartmentEmployees)}
          hasDepartmentSelected={selectedDepartment !== null}
        />

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary text-primary">
            <CalendarDays className="mr-1 h-3 w-3" />
            {shifts.filter(s => s.status === 'published').length} publiserte vakter
          </Badge>
          {(criticalCount > 0 || warningCount > 0) && (
            <Badge 
              variant={criticalCount > 0 ? "destructive" : "secondary"} 
              className={cn(
                "cursor-pointer",
                criticalCount === 0 && warningCount > 0 && "bg-warning text-warning-foreground"
              )}
              onClick={() => setShowAlerts(!showAlerts)}
            >
              <AlertCircle className="mr-1 h-3 w-3" />
              {criticalCount > 0 ? `${criticalCount} kritiske` : `${warningCount} advarsler`}
            </Badge>
          )}
        </div>

        {/* Work Time Alerts */}
        {showAlerts && violations.length > 0 && (
          <WorkTimeAlertsPanel 
            violations={violations} 
            onDismiss={() => setShowAlerts(false)}
            compact
          />
        )}

        {/* Open Shifts and Swap Requests */}
        <div className="grid gap-4 md:grid-cols-2">
          <OpenShiftsPanel startDate={startDate} endDate={endDate} compact />
          <ShiftSwapsPanel compact />
        </div>

        {/* Schedule Grid */}
        <Card>
          <CardContent className="p-0">
            {scheduleViewMode === "employees" ? (
              /* Employee-based view */
              <EmployeeBasedScheduleGrid
                employees={filteredEmployees}
                shifts={shifts}
                weekDays={weekDays}
                isAdminOrManager={isAdminOrManager()}
                onCellClick={(date, employeeId) => {
                  setSelectedDate(date);
                  setSelectedFunctionId(displayedFunctions[0]?.id || null);
                  setCreateModalOpen(true);
                }}
                onShiftClick={handleShiftClick}
                onShiftDrop={handleShiftDrop}
              />
            ) : (
              /* Function-based view with improved layout */
              <FunctionBasedScheduleGrid
                functions={displayedFunctions}
                shifts={shifts}
                weekDays={weekDays}
                isAdminOrManager={isAdminOrManager()}
                onCellClick={handleCellClick}
                onShiftClick={handleShiftClick}
                onShiftDrop={handleShiftDrop}
                approvedAbsences={approvedAbsences}
                supplements={supplements}
                showWeather={showWeather}
              />
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2"><div className="h-4 w-4 rounded bg-primary/10" /><span className="text-sm text-muted-foreground">Dagskift</span></div>
          <div className="flex items-center gap-2"><div className="h-4 w-4 rounded bg-destructive/10" /><span className="text-sm text-muted-foreground">Nattskift</span></div>
          <div className="flex items-center gap-2"><div className="h-4 w-4 rounded border-2 border-dashed border-primary bg-primary/10" /><span className="text-sm text-muted-foreground">Ledig vakt</span></div>
          <div className="flex items-center gap-2"><Palmtree className="h-4 w-4 text-success" /><span className="text-sm text-muted-foreground">Fravær</span></div>
        </div>
      </div>

      {/* Modals */}
      <CreateShiftModal open={createModalOpen} onOpenChange={setCreateModalOpen} date={selectedDate} selectedFunction={selectedFunction} functions={functions} />
      <EnhancedShiftDetailModal open={detailModalOpen} onOpenChange={setDetailModalOpen} shift={selectedShift} />
      <FunctionsManagementModal open={functionsModalOpen} onOpenChange={setFunctionsModalOpen} />
      <SaveTemplateModal 
        open={saveTemplateModalOpen} 
        onOpenChange={setSaveTemplateModalOpen} 
        currentWeekDate={currentDate} 
        shifts={shifts} 
      />
      <RolloutTemplateModal 
        open={rolloutModalOpen} 
        onOpenChange={setRolloutModalOpen} 
        currentWeekDate={currentDate}
        preselectedTemplate={selectedTemplateForRollout}
      />
      <ManageTemplatesModal 
        open={manageTemplatesModalOpen} 
        onOpenChange={setManageTemplatesModalOpen}
        onRollout={(template) => {
          setSelectedTemplateForRollout(template);
          setRolloutModalOpen(true);
        }}
      />
      <DepartmentsManagementModal
        open={departmentsModalOpen}
        onOpenChange={setDepartmentsModalOpen}
      />
      <CopyWeekModal
        open={copyWeekModalOpen}
        onOpenChange={setCopyWeekModalOpen}
        sourceWeekDate={currentDate}
      />
      <ShiftDropModal
        open={dropModalOpen}
        onOpenChange={(open) => {
          setDropModalOpen(open);
          if (!open) setPendingDrop(null);
        }}
        dropData={pendingDrop}
        targetDate={pendingDrop?.targetDate || ""}
        targetFunctionId={pendingDrop?.targetFunctionId || ""}
        targetFunctionName={functions.find(f => f.id === pendingDrop?.targetFunctionId)?.name || ""}
        isCopy={pendingDrop?.isCopy || false}
        onConfirm={handleDropConfirm}
      />
    </MainLayout>
  );
}

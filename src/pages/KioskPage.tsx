import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import {
  LogIn,
  LogOut,
  Clock,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Calendar,
  Users,
  Briefcase,
} from "lucide-react";
import crewplanLogo from "@/assets/crewplan-logo-v2.png";

interface KioskEmployee {
  id: string;
  full_name: string;
  avatar_url: string | null;
  pin_code: string | null;
  department_id: string | null;
}

interface TodayShift {
  id: string;
  employee_id: string;
  planned_start: string;
  planned_end: string;
  employee: KioskEmployee;
  function?: { name: string; color: string } | null;
}

interface ActiveTimeEntry {
  id: string;
  employee_id: string;
  clock_in: string;
  shift_id: string | null;
  employee: KioskEmployee;
}

type KioskMode = "dashboard" | "enter_pin" | "action" | "success";

export default function KioskPage() {
  const [mode, setMode] = useState<KioskMode>("dashboard");
  const [employees, setEmployees] = useState<KioskEmployee[]>([]);
  const [todayShifts, setTodayShifts] = useState<TodayShift[]>([]);
  const [activeEntries, setActiveEntries] = useState<ActiveTimeEntry[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<KioskEmployee | null>(null);
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string; type: "in" | "out" } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    const today = new Date().toISOString().split("T")[0];

    // Fetch all employees
    const { data: employeesData } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, pin_code, department_id")
      .eq("is_active", true)
      .order("full_name");

    if (employeesData) {
      setEmployees(employeesData);
    }

    // Fetch today's shifts
    const { data: shiftsData } = await supabase
      .from("shifts")
      .select(`
        id,
        employee_id,
        planned_start,
        planned_end,
        function:functions(name, color)
      `)
      .eq("date", today)
      .neq("status", "cancelled")
      .order("start_time");

    if (shiftsData && employeesData) {
      const shiftsWithEmployees = shiftsData
        .filter(s => s.employee_id)
        .map(shift => ({
          ...shift,
          employee: employeesData.find(e => e.id === shift.employee_id)!,
        }))
        .filter(s => s.employee);
      setTodayShifts(shiftsWithEmployees as TodayShift[]);
    }

    // Fetch active time entries (clocked in)
    const { data: entriesData } = await supabase
      .from("time_entries")
      .select("id, employee_id, clock_in, shift_id")
      .is("clock_out", null)
      .not("clock_in", "is", null);

    if (entriesData && employeesData) {
      const entriesWithEmployees = entriesData
        .map(entry => ({
          ...entry,
          employee: employeesData.find(e => e.id === entry.employee_id)!,
        }))
        .filter(e => e.employee);
      setActiveEntries(entriesWithEmployees);
    }
  };

  const getActiveEntryForEmployee = (employeeId: string) => {
    return activeEntries.find(e => e.employee_id === employeeId);
  };

  const handleEmployeeSelect = async (employee: KioskEmployee) => {
    setSelectedEmployee(employee);
    setPin("");
    
    if (employee.pin_code) {
      setMode("enter_pin");
    } else {
      setMode("action");
    }
  };

  const handlePinSubmit = async () => {
    if (!selectedEmployee) return;

    if (pin !== selectedEmployee.pin_code) {
      toast.error("Feil PIN-kode");
      setPin("");
      return;
    }

    setMode("action");
  };

  const handlePinKeyPress = (key: string) => {
    if (key === "clear") {
      setPin("");
    } else if (key === "back") {
      setPin(prev => prev.slice(0, -1));
    } else if (pin.length < 4) {
      const newPin = pin + key;
      setPin(newPin);
      
      if (newPin.length === 4 && selectedEmployee?.pin_code === newPin) {
        setTimeout(() => handlePinSubmit(), 200);
      }
    }
  };

  const handleClockIn = async () => {
    if (!selectedEmployee) return;
    setIsLoading(true);

    try {
      const now = new Date();
      const date = now.toISOString().split("T")[0];

      const { data: shift } = await supabase
        .from("shifts")
        .select("id")
        .eq("employee_id", selectedEmployee.id)
        .eq("date", date)
        .neq("status", "cancelled")
        .maybeSingle();

      const { error } = await supabase.from("time_entries").insert({
        employee_id: selectedEmployee.id,
        shift_id: shift?.id || null,
        date,
        clock_in: now.toISOString(),
        status: "draft",
      });

      if (error) throw error;

      setActionResult({ success: true, message: "Stemplet inn!", type: "in" });
      setMode("success");
      await fetchData();
    } catch (error) {
      setActionResult({ success: false, message: "Kunne ikke stemple inn", type: "in" });
      setMode("success");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!selectedEmployee) return;
    const activeEntry = getActiveEntryForEmployee(selectedEmployee.id);
    if (!activeEntry) return;
    
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("time_entries")
        .update({ clock_out: new Date().toISOString() })
        .eq("id", activeEntry.id);

      if (error) throw error;

      setActionResult({ success: true, message: "Stemplet ut!", type: "out" });
      setMode("success");
      await fetchData();
    } catch (error) {
      setActionResult({ success: false, message: "Kunne ikke stemple ut", type: "out" });
      setMode("success");
    } finally {
      setIsLoading(false);
    }
  };

  const resetKiosk = () => {
    setMode("dashboard");
    setSelectedEmployee(null);
    setPin("");
    setActionResult(null);
  };

  useEffect(() => {
    if (mode === "success") {
      const timer = setTimeout(resetKiosk, 3000);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Group employees alphabetically
  const groupedEmployees = useMemo(() => {
    const filtered = employees.filter(e =>
      e.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const groups: Record<string, KioskEmployee[]> = {};
    filtered.forEach(emp => {
      const letter = emp.full_name[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(emp);
    });
    
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [employees, searchQuery]);

  // Employees with shifts but not yet clocked in
  const plannedEmployees = useMemo(() => {
    const clockedInIds = new Set(activeEntries.map(e => e.employee_id));
    return todayShifts.filter(s => !clockedInIds.has(s.employee_id));
  }, [todayShifts, activeEntries]);

  const renderDashboard = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-4 border-b bg-card flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={crewplanLogo} alt="Crewplan" className="h-8 w-8" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {format(currentTime, "EEEE d. MMMM yyyy", { locale: nb })}
            </p>
            <p className="text-4xl font-bold font-mono tracking-tight">
              {format(currentTime, "HH:mm")}
            </p>
          </div>
        </div>
        
        {/* Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Søk etter ansatt..."
              className="pl-10 h-11 bg-muted/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Crewplan</span>
          <span>Kiosk</span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-3 gap-0 overflow-hidden">
        {/* Column 1: Planned */}
        <div className="border-r flex flex-col overflow-hidden bg-card/50">
          <div className="flex-shrink-0 px-4 py-3 border-b bg-card">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">Planlagt</h2>
              <Badge variant="secondary" className="ml-auto">{plannedEmployees.length}</Badge>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {plannedEmployees.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Ingen planlagte vakter
                </p>
              ) : (
                plannedEmployees.map((shift) => (
                  <button
                    key={shift.id}
                    onClick={() => handleEmployeeSelect(shift.employee)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left group"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground"
                      style={{ backgroundColor: shift.function?.color || "hsl(var(--primary))" }}
                    >
                      {getInitials(shift.employee.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {shift.employee.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {shift.function?.name || "—"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-mono font-medium text-foreground">
                        {shift.planned_start?.slice(0, 5)} - {shift.planned_end?.slice(0, 5)}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Column 2: At Work */}
        <div className="border-r flex flex-col overflow-hidden bg-primary/5">
          <div className="flex-shrink-0 px-4 py-3 border-b bg-primary/10">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">På arbeid</h2>
              <Badge className="ml-auto bg-primary text-primary-foreground">{activeEntries.length}</Badge>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {activeEntries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Ingen på jobb ennå
                </p>
              ) : (
                activeEntries.map((entry) => {
                  const shift = todayShifts.find(s => s.employee_id === entry.employee_id);
                  return (
                    <button
                      key={entry.id}
                      onClick={() => handleEmployeeSelect(entry.employee)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left group"
                    >
                      <div className="relative">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground"
                          style={{ backgroundColor: shift?.function?.color || "hsl(var(--primary))" }}
                        >
                          {getInitials(entry.employee.full_name)}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-background" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {entry.employee.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {shift?.function?.name || "—"}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-mono font-medium text-primary">
                          {format(new Date(entry.clock_in), "HH:mm")} - {shift?.planned_end?.slice(0, 5) || "—"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Column 3: All Employees */}
        <div className="flex flex-col overflow-hidden bg-card/50">
          <div className="flex-shrink-0 px-4 py-3 border-b bg-card">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Alle medarbeidere</h2>
              <Badge variant="outline" className="ml-auto">{employees.length}</Badge>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {groupedEmployees.map(([letter, emps]) => (
                <div key={letter}>
                  <div className="sticky top-0 px-3 py-1.5 bg-muted/80 backdrop-blur-sm text-xs font-semibold text-muted-foreground">
                    {letter}
                  </div>
                  <div className="space-y-0.5">
                    {emps.map((emp) => {
                      const isWorking = activeEntries.some(e => e.employee_id === emp.id);
                      const hasShift = todayShifts.some(s => s.employee_id === emp.id);
                      
                      return (
                        <button
                          key={emp.id}
                          onClick={() => handleEmployeeSelect(emp)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left"
                        >
                          <div className="relative">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                              {getInitials(emp.full_name)}
                            </div>
                            {isWorking && (
                              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-background" />
                            )}
                          </div>
                          <span className="flex-1 text-sm font-medium text-foreground truncate">
                            {emp.full_name}
                          </span>
                          {isWorking && (
                            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-5">
                              På jobb
                            </Badge>
                          )}
                          {!isWorking && hasShift && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                              Planlagt
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );

  const renderPinEntry = () => (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-background to-muted p-6">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardContent className="pt-6 space-y-6">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4"
            onClick={resetKiosk}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="text-center space-y-2">
            <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
              {getInitials(selectedEmployee?.full_name || "")}
            </div>
            <h2 className="text-xl font-semibold">{selectedEmployee?.full_name}</h2>
            <p className="text-muted-foreground text-sm">Skriv inn PIN-kode</p>
          </div>

          {/* PIN Display */}
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-12 w-12 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                  pin[i] ? "border-primary bg-primary/10" : "border-border"
                }`}
              >
                {pin[i] ? "•" : ""}
              </div>
            ))}
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"].map((key) => (
              <Button
                key={key}
                variant={key === "clear" || key === "back" ? "outline" : "secondary"}
                size="lg"
                className="h-14 text-lg font-semibold"
                onClick={() => handlePinKeyPress(key)}
              >
                {key === "clear" ? "C" : key === "back" ? "←" : key}
              </Button>
            ))}
          </div>

          <Button
            className="w-full h-12"
            onClick={handlePinSubmit}
            disabled={pin.length !== 4}
          >
            <KeyRound className="mr-2 h-4 w-4" />
            Bekreft
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderAction = () => {
    const activeEntry = selectedEmployee ? getActiveEntryForEmployee(selectedEmployee.id) : null;
    const shift = selectedEmployee ? todayShifts.find(s => s.employee_id === selectedEmployee.id) : null;
    
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-background to-muted p-6">
        <Card className="w-full max-w-sm shadow-2xl overflow-hidden">
          <div className={`h-2 ${activeEntry ? "bg-success" : "bg-primary"}`} />
          <CardContent className="pt-6 space-y-6">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-4"
              onClick={resetKiosk}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="text-center space-y-3">
              <div className={`flex h-24 w-24 mx-auto items-center justify-center rounded-full text-3xl font-bold text-primary-foreground ${activeEntry ? "bg-success" : "bg-primary"}`}>
                {getInitials(selectedEmployee?.full_name || "")}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedEmployee?.full_name}</h2>
                {shift && (
                  <p className="text-muted-foreground text-sm mt-1">
                    {shift.function?.name}
                  </p>
                )}
              </div>
              
              {activeEntry ? (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  <Clock className="mr-1.5 h-3 w-3" />
                  Stemplet inn {format(new Date(activeEntry.clock_in), "HH:mm")}
                </Badge>
              ) : shift ? (
                <Badge variant="outline">
                  <Calendar className="mr-1.5 h-3 w-3" />
                  Planlagt vakt: {shift.planned_start?.slice(0, 5)} - {shift.planned_end?.slice(0, 5)}
                </Badge>
              ) : (
                <Badge variant="secondary">Ingen planlagt vakt i dag</Badge>
              )}
            </div>

            {activeEntry ? (
              <Button
                size="lg"
                variant="destructive"
                className="w-full h-16 text-lg"
                onClick={handleClockOut}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-5 w-5" />
                )}
                {isLoading ? "Stempler ut..." : "Stemple ut"}
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-full h-16 text-lg"
                onClick={handleClockIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-5 w-5" />
                )}
                {isLoading ? "Stempler inn..." : "Stemple inn"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSuccess = () => (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-background to-muted p-6">
      <Card className="w-full max-w-sm shadow-2xl overflow-hidden">
        <div className={`h-2 ${actionResult?.success ? (actionResult.type === "in" ? "bg-primary" : "bg-destructive") : "bg-destructive"}`} />
        <CardContent className="py-12 text-center space-y-4">
          {actionResult?.success ? (
            <div className={`h-28 w-28 mx-auto rounded-full flex items-center justify-center ${actionResult.type === "in" ? "bg-primary/10" : "bg-destructive/10"}`}>
              <CheckCircle2 className={`h-16 w-16 ${actionResult.type === "in" ? "text-primary" : "text-destructive"}`} />
            </div>
          ) : (
            <div className="h-28 w-28 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
          )}
          <div>
            <h2 className="text-3xl font-bold">{actionResult?.message}</h2>
            <p className="text-muted-foreground mt-2">
              {selectedEmployee?.full_name} • {format(currentTime, "HH:mm")}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Går tilbake om 3 sekunder...
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      {mode === "dashboard" && renderDashboard()}
      {mode === "enter_pin" && renderPinEntry()}
      {mode === "action" && renderAction()}
      {mode === "success" && renderSuccess()}
    </div>
  );
}
